const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor',
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  duration: {
    type: Number,
    required: true,
    default: 30,
    enum: [30, 60] // Only allow 30 or 60 minute appointments
  },
  appointmentType: {
    type: String,
    required: false,
    enum: ['Routine Check-Up', 'Ultrasound', 'Consultation', 'Follow-up']
  },
  patientName: {
    type: String,
    required: true
  },
  notes: {
    type: String
  }
}, {
  timestamps: true
});

// Index for efficient querying of appointments by date and doctor
appointmentSchema.index({ doctorId: 1, date: 1 });

module.exports = mongoose.model('Appointment', appointmentSchema);
