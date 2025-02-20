document.addEventListener('DOMContentLoaded', function() {
    const doctorsList = document.getElementById('doctorsList');
    const bookingForm = document.getElementById('bookingForm');
    const doctorSelect = document.getElementById('doctorSelect');
    const appointmentDate = document.getElementById('appointmentDate');
    const timeSlot = document.getElementById('timeSlot');
    const durationSelect = document.getElementById('durationSelect');
    const appointmentType = document.getElementById('appointmentType');
    const patientName = document.getElementById('patientName');
    const bookedAppointments = document.getElementById('bookedAppointments');
    const editModal = new bootstrap.Modal(document.getElementById('editAppointmentModal'));

    // Set minimum date to today
    const today = new Date().toISOString().split('T')[0];
    appointmentDate.min = today;
    document.getElementById('editDate').min = today;

    // Format date and time for display
    function formatDateTime(date, duration) {
        const appointmentDate = new Date(date);
        const endTime = new Date(appointmentDate.getTime() + duration * 60000);
        
        return {
            date: appointmentDate.toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
            }),
            time: `${appointmentDate.toLocaleTimeString('en-US', { 
                hour: '2-digit', 
                minute: '2-digit' 
            })} - ${endTime.toLocaleTimeString('en-US', { 
                hour: '2-digit', 
                minute: '2-digit' 
            })}`
        };
    }

    // Fetch and display booked appointments
    async function fetchBookedAppointments() {
        try {
            const response = await fetch('http://localhost:5000/api/appointments');
            const appointments = await response.json();

            // Sort appointments by date
            appointments.sort((a, b) => new Date(a.date) - new Date(b.date));

            // Group appointments by date
            const groupedAppointments = appointments.reduce((groups, appointment) => {
                const date = new Date(appointment.date).toLocaleDateString();
                if (!groups[date]) {
                    groups[date] = [];
                }
                groups[date].push(appointment);
                return groups;
            }, {});

            // Display appointments
            bookedAppointments.innerHTML = Object.entries(groupedAppointments).map(([date, appointments]) => `
                <div class="date-group mb-4">
                    <h5>${new Date(date).toLocaleDateString('en-US', { 
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                    })}</h5>
                    ${appointments.map(appointment => {
                        const { time } = formatDateTime(appointment.date, appointment.duration);
                        return `
                            <div class="card appointment-card position-relative" data-appointment-id="${appointment._id}">
                                <div class="card-body">
                                    <div class="action-buttons">
                                        <button class="btn btn-sm btn-outline-primary" 
                                                onclick="editAppointment('${appointment._id}')">
                                            Edit
                                        </button>
                                        <button class="btn btn-sm btn-outline-danger" 
                                                onclick="cancelAppointment('${appointment._id}')">
                                            Cancel
                                        </button>
                                    </div>
                                    <h6 class="card-title">${appointment.doctorId.name}</h6>
                                    <p class="card-text">
                                        <span class="appointment-time">${time}</span><br>
                                        <span class="appointment-type">${appointment.appointmentType}</span><br>
                                        Duration: ${appointment.duration} minutes
                                    </p>
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            `).join('') || '<p>No appointments booked yet.</p>';

        } catch (error) {
            console.error('Error fetching appointments:', error);
            showAlert('Error loading appointments. Please try again later.', 'danger');
        }
    }

    // Fetch and display doctors
    async function fetchDoctors() {
        try {
            const response = await fetch('http://localhost:5000/api/doctors');
            const doctors = await response.json();
            displayDoctors(doctors);
            populateDoctorSelect(doctors);
        } catch (error) {
            console.error('Error fetching doctors:', error);
            showAlert('Error loading doctors. Please try again later.', 'danger');
        }
    }

    // Display doctors in cards
    function displayDoctors(doctors) {
        doctorsList.innerHTML = doctors.map(doctor => `
            <div class="col-md-6 mb-4">
                <div class="card doctor-card">
                    <div class="card-body">
                        <h5 class="card-title">${doctor.name}</h5>
                        <p class="specialization">${doctor.specialization}</p>
                        <p class="working-hours">Working Hours: 9:00 AM - 5:00 PM</p>
                        <button class="btn btn-primary" onclick="selectDoctor('${doctor._id}')">
                            Book Appointment
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
    }

    // Populate doctor select dropdown
    function populateDoctorSelect(doctors) {
        doctorSelect.innerHTML = '<option value="">Choose a doctor...</option>' +
            doctors.map(doctor => 
                `<option value="${doctor._id}">${doctor.name} - ${doctor.specialization}</option>`
            ).join('');
    }

    // Generate time slots (9 AM to 5 PM)
    function generateTimeSlots() {
        const slots = [];
        for (let hour = 9; hour < 17; hour++) {
            for (let minute = 0; minute < 60; minute += 30) {
                const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
                slots.push(timeString);
            }
        }
        return slots;
    }

    // Check if a slot is available
    async function checkSlotAvailability(doctorId, date, time) {
        try {
            // Fetch all appointments for the selected date
            const response = await fetch(`http://localhost:5000/api/appointments/date/${date}`);
            const appointments = await response.json();

            // Filter appointments for the selected doctor
            const doctorAppointments = appointments.filter(app => app.doctorId._id === doctorId);

            // Convert selected time to Date object
            const [hours, minutes] = time.split(':');
            const selectedTime = new Date(date);
            selectedTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

            // Check if the slot overlaps with any existing appointment
            return !doctorAppointments.some(app => {
                const appStart = new Date(app.date);
                const appEnd = new Date(appStart.getTime() + app.duration * 60000);
                return selectedTime >= appStart && selectedTime < appEnd;
            });
        } catch (error) {
            console.error('Error checking slot availability:', error);
            return false;
        }
    }

    // Update available time slots
    async function updateTimeSlots() {
        const doctorId = doctorSelect.value;
        const date = appointmentDate.value;
        const duration = parseInt(durationSelect.value);

        if (!doctorId || !date) {
            timeSlot.innerHTML = '<option value="">Choose a time slot...</option>';
            return;
        }

        const slots = generateTimeSlots();
        
        // Disable all slots while we check availability
        timeSlot.disabled = true;
        timeSlot.innerHTML = '<option value="">Checking available slots...</option>';

        // Check availability for each slot
        const availableSlots = [];
        for (const slot of slots) {
            const isAvailable = await checkSlotAvailability(doctorId, date, slot);
            if (isAvailable) {
                availableSlots.push(slot);
            }
        }

        // Update the time slot dropdown with available slots
        timeSlot.innerHTML = '<option value="">Choose a time slot...</option>' +
            availableSlots.map(slot => `<option value="${slot}">${slot}</option>`).join('');
        timeSlot.disabled = false;

        if (availableSlots.length === 0) {
            showAlert('No available time slots for the selected date. Please try another date.', 'warning');
        }
    }

    // Function to edit appointment
    async function editAppointment(appointmentId) {
        try {
            // Fetch appointment details
            const response = await fetch(`http://localhost:5000/api/appointments/${appointmentId}`);
            const appointment = await response.json();

            // Store current appointment details for reference
            window.currentAppointment = {
                id: appointmentId,
                doctorId: appointment.doctorId._id,
                duration: appointment.duration
            };

            // Set form values
            const appointmentDate = new Date(appointment.date);
            document.getElementById('editAppointmentId').value = appointmentId;
            document.getElementById('editDate').value = appointmentDate.toISOString().split('T')[0];
            document.getElementById('editDuration').value = appointment.duration;
            document.getElementById('editAppointmentType').value = appointment.appointmentType;

            // Update time slots for the selected date
            await updateEditTimeSlots(appointmentDate.toISOString().split('T')[0], appointment.duration);

            // Set the current time after slots are generated
            const hours = appointmentDate.getHours().toString().padStart(2, '0');
            const minutes = appointmentDate.getMinutes().toString().padStart(2, '0');
            const time = `${hours}:${minutes}`;
            document.getElementById('editTimeSlot').value = time;

            // Add event listeners for date and duration changes
            const editDateInput = document.getElementById('editDate');
            const editDurationSelect = document.getElementById('editDuration');
            
            // Remove existing listeners if any
            editDateInput.removeEventListener('change', handleEditDateChange);
            editDurationSelect.removeEventListener('change', handleEditDurationChange);
            
            // Add new listeners
            editDateInput.addEventListener('change', handleEditDateChange);
            editDurationSelect.addEventListener('change', handleEditDurationChange);

            // Show modal
            const editModal = new bootstrap.Modal(document.getElementById('editAppointmentModal'));
            editModal.show();
        } catch (error) {
            console.error('Error fetching appointment details:', error);
            showAlert('Error loading appointment details. Please try again.', 'danger');
        }
    }

    // Handler for edit date change
    async function handleEditDateChange(event) {
        const date = event.target.value;
        const duration = document.getElementById('editDuration').value;
        await updateEditTimeSlots(date, duration);
    }

    // Handler for edit duration change
    async function handleEditDurationChange(event) {
        const date = document.getElementById('editDate').value;
        const duration = event.target.value;
        await updateEditTimeSlots(date, duration);
    }

    // Function to update time slots in edit modal
    async function updateEditTimeSlots(date, duration) {
        try {
            const currentAppointment = window.currentAppointment;
            if (!currentAppointment) return;

            // Fetch booked slots for the selected date
            const response = await fetch(`http://localhost:5000/api/appointments/date/${date}`);
            const appointments = await response.json();

            // Filter out the current appointment being edited
            const otherAppointments = appointments.filter(apt => apt._id !== currentAppointment.id);

            // Generate all possible time slots
            const allSlots = [];
            for (let hour = 9; hour < 17; hour++) {
                for (let minute = 0; minute < 60; minute += 30) {
                    const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
                    allSlots.push(timeString);
                }
            }

            // Filter out booked slots
            const availableSlots = allSlots.filter(timeSlot => {
                const [hours, minutes] = timeSlot.split(':');
                const slotTime = new Date(date);
                slotTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
                const slotEnd = new Date(slotTime.getTime() + duration * 60000);

                // Check if slot overlaps with any other appointment
                return !otherAppointments.some(apt => {
                    const aptTime = new Date(apt.date);
                    const aptEnd = new Date(aptTime.getTime() + apt.duration * 60000);
                    return (slotTime < aptEnd && slotEnd > aptTime);
                });
            });

            // Update the time slot dropdown
            const timeSlotSelect = document.getElementById('editTimeSlot');
            const currentValue = timeSlotSelect.value;

            timeSlotSelect.innerHTML = availableSlots
                .map(slot => `<option value="${slot}">${slot}</option>`)
                .join('');

            // Try to maintain the previously selected time if it's still available
            if (availableSlots.includes(currentValue)) {
                timeSlotSelect.value = currentValue;
            }

            // If no slots are available, show a message
            if (availableSlots.length === 0) {
                showAlert('No available time slots for the selected date. Please choose another date.', 'warning');
            }
        } catch (error) {
            console.error('Error updating time slots:', error);
            showAlert('Error loading available time slots. Please try again.', 'danger');
        }
    }

    // Function to save appointment changes
    async function saveAppointmentChanges() {
        const appointmentId = document.getElementById('editAppointmentId').value;
        const date = document.getElementById('editDate').value;
        const time = document.getElementById('editTimeSlot').value;
        const duration = document.getElementById('editDuration').value;
        const appointmentType = document.getElementById('editAppointmentType').value;

        if (!time) {
            showAlert('Please select a valid time slot', 'danger');
            return;
        }

        try {
            const response = await fetch(`http://localhost:5000/api/appointments/${appointmentId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    date,
                    time,
                    duration: parseInt(duration),
                    appointmentType
                })
            });

            if (response.ok) {
                // Hide modal
                const editModal = bootstrap.Modal.getInstance(document.getElementById('editAppointmentModal'));
                editModal.hide();

                // Show success message
                showAlert('Appointment updated successfully!', 'success');

                // Refresh appointments list with animation
                const appointmentCard = document.querySelector(`[data-appointment-id="${appointmentId}"]`);
                if (appointmentCard) {
                    appointmentCard.style.transition = 'all 0.3s ease';
                    appointmentCard.style.opacity = '0.5';
                    setTimeout(() => {
                        fetchBookedAppointments();
                    }, 300);
                }

                // Refresh available time slots if editing today's appointment
                const today = new Date().toISOString().split('T')[0];
                if (document.getElementById('appointmentDate').value === today) {
                    updateTimeSlots();
                }
            } else {
                const error = await response.json();
                showAlert(error.message || 'Error updating appointment', 'danger');
            }
        } catch (error) {
            console.error('Error updating appointment:', error);
            showAlert('Error updating appointment. Please try again.', 'danger');
        }
    }

    // Function to cancel appointment
    async function cancelAppointment(appointmentId) {
        if (!confirm('Are you sure you want to cancel this appointment?')) {
            return;
        }

        try {
            const response = await fetch(`http://localhost:5000/api/appointments/${appointmentId}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                // Find the appointment card and remove it with animation
                const appointmentCard = document.querySelector(`[data-appointment-id="${appointmentId}"]`);
                if (appointmentCard) {
                    appointmentCard.style.transition = 'all 0.3s ease';
                    appointmentCard.style.opacity = '0';
                    appointmentCard.style.transform = 'translateX(-20px)';
                    
                    setTimeout(() => {
                        appointmentCard.remove();
                        
                        // Check if this was the last appointment in the date group
                        const dateGroup = appointmentCard.closest('.date-group');
                        if (dateGroup && !dateGroup.querySelector('.appointment-card')) {
                            dateGroup.remove();
                        }
                        
                        // Show success message
                        const alertDiv = document.createElement('div');
                        alertDiv.className = 'alert alert-success alert-dismissible fade show';
                        alertDiv.innerHTML = `
                            Appointment cancelled successfully!
                            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
                        `;
                        document.getElementById('bookedAppointments').insertAdjacentElement('beforebegin', alertDiv);

                        // Auto dismiss after 5 seconds
                        setTimeout(() => {
                            alertDiv.remove();
                        }, 5000);
                    }, 300);
                }

                // Refresh available time slots if the cancelled appointment was for today
                const today = new Date().toISOString().split('T')[0];
                if (document.getElementById('appointmentDate').value === today) {
                    updateTimeSlots();
                }
            } else {
                const error = await response.json();
                showAlert(error.message || 'Error cancelling appointment', 'danger');
            }
        } catch (error) {
            console.error('Error cancelling appointment:', error);
            showAlert('Error cancelling appointment. Please try again.', 'danger');
        }
    }

    // Function to show alerts
    function showAlert(message, type) {
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type} alert-dismissible fade show`;
        alertDiv.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        document.getElementById('bookedAppointments').insertAdjacentElement('beforebegin', alertDiv);

        // Auto dismiss after 5 seconds
        setTimeout(() => {
            alertDiv.remove();
        }, 5000);
    }

    // Event listeners
    doctorSelect.addEventListener('change', updateTimeSlots);
    appointmentDate.addEventListener('change', updateTimeSlots);
    durationSelect.addEventListener('change', updateTimeSlots);

    // Make these functions available globally
    window.editAppointment = editAppointment;
    window.saveAppointmentChanges = saveAppointmentChanges;
    window.cancelAppointment = cancelAppointment;

    // Initialize
    fetchDoctors();
    fetchBookedAppointments();
});

// Global function to select doctor from card
function selectDoctor(doctorId) {
    document.getElementById('doctorSelect').value = doctorId;
    document.getElementById('doctorSelect').dispatchEvent(new Event('change'));
    document.getElementById('appointmentForm').scrollIntoView({ behavior: 'smooth' });
}
