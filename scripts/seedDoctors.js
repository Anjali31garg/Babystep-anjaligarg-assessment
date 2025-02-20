require('dotenv').config();
const mongoose = require('mongoose');
const Doctor = require('../models/Doctor');

const sampleDoctors = [
  {
    name: "Dr. Sarah Smith",
    specialization: "Pediatrician",
    workingHours: {
      start: "09:00",
      end: "17:00"
    }
  },
  {
    name: "Dr. John Kumar",
    specialization: "Dentist",
    workingHours: {
      start: "10:00",
      end: "18:00"
    }
  },
  {
    name: "Dr. Priya Patel",
    specialization: "Cardiologist",
    workingHours: {
      start: "08:00",
      end: "16:00"
    }
  },
  {
    name: "Dr. Michael Chen",
    specialization: "General Physician",
    workingHours: {
      start: "09:00",
      end: "17:30"
    }
  }
];

const seedDoctors = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear existing doctors
    await Doctor.deleteMany({});
    console.log('Cleared existing doctors');

    // Insert new doctors
    const doctors = await Doctor.insertMany(sampleDoctors);
    console.log('Added sample doctors:', doctors);

    // Disconnect from MongoDB
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');

  } catch (error) {
    console.error('Error seeding doctors:', error);
    process.exit(1);
  }
};

// Run the seeding function
seedDoctors();
