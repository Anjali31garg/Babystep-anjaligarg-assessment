const express = require('express');
const router = express.Router();
const Appointment = require('../models/Appointment');
const Doctor = require('../models/Doctor');
const { parse, addMinutes, isWithinInterval, parseISO, startOfDay, endOfDay } = require('date-fns');

// Helper function to check slot availability
async function isSlotAvailable(doctorId, date, duration, excludeAppointmentId = null) {
  const appointmentStart = new Date(date);
  const appointmentEnd = addMinutes(appointmentStart, duration);

  // Find any overlapping appointments
  const overlappingAppointments = await Appointment.find({
    doctorId,
    _id: { $ne: excludeAppointmentId },
    date: {
      $lt: appointmentEnd,
      $gt: appointmentStart
    }
  });

  return overlappingAppointments.length === 0;
}

// Helper function to check if time is within working hours (9 AM to 5 PM)
function isWithinWorkingHours(date) {
  const hours = date.getHours();
  return hours >= 9 && hours < 17;
}

// Get all appointments for a specific date
router.get('/date/:date', async (req, res) => {
  try {
    const date = parseISO(req.params.date);
    const appointments = await Appointment.find({
      date: {
        $gte: startOfDay(date),
        $lt: endOfDay(date)
      }
    }).populate('doctorId');
    res.json(appointments);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get all appointments
router.get('/', async (req, res) => {
  try {
    const appointments = await Appointment.find()
      .populate('doctorId', 'name specialization')
      .sort({ date: 1 });
    res.json(appointments);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get specific appointment
router.get('/:id', async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id)
      .populate('doctorId', 'name specialization');
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }
    res.json(appointment);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create new appointment
router.post('/', async (req, res) => {
  try {
    const { doctorId, date, time, duration, appointmentType, patientName, notes } = req.body;

    // Check if doctor exists
    const doctor = await Doctor.findById(doctorId);
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }

    // Combine date and time
    const [hours, minutes] = time.split(':');
    const appointmentDate = new Date(date);
    appointmentDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);

    // Check if appointment is in the past
    if (appointmentDate < new Date()) {
      return res.status(400).json({ message: 'Cannot book appointments in the past' });
    }

    // Check if appointment is within working hours
    if (!isWithinWorkingHours(appointmentDate)) {
      return res.status(400).json({ message: 'Appointments are only available between 9 AM and 5 PM' });
    }

    // Check if slot is available
    const isAvailable = await isSlotAvailable(doctorId, appointmentDate, parseInt(duration) || 30);
    if (!isAvailable) {
      return res.status(400).json({ message: 'Selected time slot is not available' });
    }

    const appointment = new Appointment({
      doctorId,
      date: appointmentDate,
      duration: parseInt(duration) || 30,
      appointmentType,
      patientName,
      notes
    });

    const newAppointment = await appointment.save();
    await newAppointment.populate('doctorId', 'name specialization');
    res.status(201).json(newAppointment);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update appointment
router.patch('/:id', async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    const { date, time, duration } = req.body;

    // If updating time/date, validate the new slot
    if (date || time) {
      const newDate = date ? new Date(date) : appointment.date;
      if (time) {
        const [hours, minutes] = time.split(':');
        newDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
      }

      // Check if new appointment time is in the past
      if (newDate < new Date()) {
        return res.status(400).json({ message: 'Cannot book appointments in the past' });
      }

      // Check if new appointment time is within working hours
      if (!isWithinWorkingHours(newDate)) {
        return res.status(400).json({ message: 'Appointments are only available between 9 AM and 5 PM' });
      }

      // Check if the new slot is available
      const isAvailable = await isSlotAvailable(
        appointment.doctorId,
        newDate,
        parseInt(duration) || appointment.duration,
        appointment._id
      );

      if (!isAvailable) {
        return res.status(400).json({ message: 'Selected time slot is not available' });
      }

      appointment.date = newDate;
    }

    if (duration) {
      appointment.duration = parseInt(duration);
    }

    // Update other fields
    Object.keys(req.body).forEach(key => {
      if (!['date', 'time', 'duration'].includes(key)) {
        appointment[key] = req.body[key];
      }
    });

    const updatedAppointment = await appointment.save();
    await updatedAppointment.populate('doctorId', 'name specialization');
    res.json(updatedAppointment);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Delete appointment
router.delete('/:id', async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }
    
    // Use findByIdAndDelete instead of deleteOne or remove
    await Appointment.findByIdAndDelete(req.params.id);
    res.json({ message: 'Appointment cancelled successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
