const express = require('express');
const router = express.Router();
const Doctor = require('../models/Doctor');
const Appointment = require('../models/Appointment');
const { startOfDay, endOfDay, parse, format, addMinutes, isWithinInterval } = require('date-fns');




// Get all doctors
router.get('/', async (req, res) => {
  try {
    const doctors = await Doctor.find();
    res.json(doctors);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get a single doctor by ID
router.get('/:id', async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.id);
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }
    res.json(doctor);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get available slots for a specific doctor on a given date
router.get('/:id/slots', async (req, res) => {
  try {
    const { id } = req.params;
    const { date } = req.query;

    if (!date) {
      return res.status(400).json({ message: 'Date parameter is required' });
    }

    const doctor = await Doctor.findById(id);
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }

    // Get start and end of the requested date
    const requestedDate = new Date(date);
    const dayStart = startOfDay(requestedDate);
    const dayEnd = endOfDay(requestedDate);

    // Get all appointments for this doctor on the requested date
    const appointments = await Appointment.find({
      doctorId: id,
      date: {
        $gte: dayStart,
        $lte: dayEnd
      }
    }).sort({ date: 1 });

    // Parse doctor's working hours
    const workStart = parse(doctor.workingHours.start, 'HH:mm', requestedDate);
    const workEnd = parse(doctor.workingHours.end, 'HH:mm', requestedDate);

    // Generate all possible 30-minute slots
    const slots = [];
    let currentSlot = workStart;

    while (currentSlot < workEnd) {
      const slotEnd = addMinutes(currentSlot, 30);
      
      // Check if slot overlaps with any existing appointment
      const isAvailable = !appointments.some(appointment => {
        const appointmentStart = new Date(appointment.date);
        const appointmentEnd = addMinutes(appointmentStart, appointment.duration);
        return isWithinInterval(currentSlot, { start: appointmentStart, end: appointmentEnd }) ||
               isWithinInterval(slotEnd, { start: appointmentStart, end: appointmentEnd });
      });

      if (isAvailable) {
        slots.push(format(currentSlot, 'HH:mm'));
      }

      currentSlot = slotEnd;
    }

    res.json(slots);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
