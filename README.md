# Doctor Appointment System

A modern, responsive web application for managing doctor appointments. Built with Node.js, Express, MongoDB, and vanilla JavaScript.

## Features

- 📅 Book appointments with available doctors
- 🕒 Dynamic time slot management
- ✏️ Edit existing appointments
- ❌ Cancel appointments
- 📱 Responsive design
- 🔄 Real-time availability updates
- 🚫 Conflict prevention
- 📊 Organized appointment display

## Prerequisites

Before running this application, make sure you have the following installed:
- Node.js (v14 or higher)
- MongoDB (v4.4 or higher)
- npm (Node Package Manager)

## Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/doctor-appointment-system.git
cd doctor-appointment-system
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory with the following content:
```env
MONGODB_URI=mongodb://localhost:27017/appointment_system
PORT=5000
```

4. Seed the database with sample doctors:
```bash
node scripts/seedDoctors.js
```

## Running the Application

1. Start MongoDB service:
```bash
sudo service mongod start
```

2. Start the server:
```bash
npm start
```

3. Open your browser and navigate to:
```
http://localhost:5000
```

## Project Structure

```
doctor-appointment-system/
├── models/                 # Database models
│   ├── Appointment.js     # Appointment schema
│   └── Doctor.js         # Doctor schema
├── public/                # Frontend files
│   ├── index.html        # Main HTML file
│   ├── app.js           # Frontend JavaScript
│   └── styles.css       # CSS styles
├── routes/                # API routes
│   ├── appointments.js   # Appointment endpoints
│   └── doctors.js       # Doctor endpoints
├── scripts/              # Utility scripts
│   └── seedDoctors.js   # Database seeding
├── .env                  # Environment variables
├── package.json         # Project dependencies
└── server.js            # Express server setup
```

## Design Decisions and Assumptions

### Backend Design
1. **Database Schema**:
   - Used MongoDB for flexible document structure
   - Separate collections for doctors and appointments
   - Referential integrity using ObjectId

2. **API Design**:
   - RESTful API principles
   - Proper error handling and validation
   - Efficient query optimization

3. **Time Slot Management**:
   - 30/60 minute appointment durations
   - Working hours: 9 AM to 5 PM
   - Automatic conflict detection

### Frontend Design
1. **User Interface**:
   - Clean and intuitive design
   - Responsive layout using Bootstrap
   - Real-time feedback for user actions

2. **State Management**:
   - Vanilla JavaScript for simplicity
   - Event-driven architecture
   - Efficient DOM manipulation

### Assumptions
1. **Business Rules**:
   - Appointments can only be booked during working hours (9 AM - 5 PM)
   - Minimum appointment duration is 30 minutes
   - Maximum appointment duration is 60 minutes
   - No appointments on weekends (can be implemented if needed)

2. **User Experience**:
   - Users can view all their appointments
   - Users can edit/cancel appointments
   - Real-time availability checking
   - Single time zone (can be extended for multiple zones)

3. **Security**:
   - Basic validation on both frontend and backend
   - No authentication required (can be added if needed)
   - Data sanitization for MongoDB queries

## API Endpoints

### Appointments
- `GET /api/appointments` - Get all appointments
- `GET /api/appointments/date/:date` - Get appointments for a specific date
- `POST /api/appointments` - Create new appointment
- `PATCH /api/appointments/:id` - Update appointment
- `DELETE /api/appointments/:id` - Cancel appointment

### Doctors
- `GET /api/doctors` - Get all doctors
- `GET /api/doctors/:id` - Get specific doctor

## Future Enhancements
1. User authentication and authorization
2. Email/SMS notifications
3. Multiple time zone support
4. Appointment reminders
5. Doctor availability calendar
6. Patient history tracking
7. Integration with payment gateway
8. Advanced reporting features

## Contributing
1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## Author
Anjali Garg

## License
This project is licensed under the MIT License.
