const mongoose = require('mongoose');

const doctorSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  workingHours: {
    start: {
      type: String,
      required: true,
      default: "09:00"
    },
    end: {
      type: String,
      required: true,
      default: "17:00"
    }
  },
  specialization: {
    type: String,
    default: "General"
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Doctor', doctorSchema);
