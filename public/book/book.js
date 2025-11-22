// Client Booking Interface Logic

let bookingData = {
    pin: '',
    petId: null,
    petName: '',
    serviceId: null,
    serviceName: '',
    servicePrice: null,
    selectedSlot: null,
    groomerId: null,
    groomerName: ''
};

// Utility functions
function showError(elementId, message) {
    const errorEl = document.getElementById(elementId);
    errorEl.textContent = message;
    errorEl.classList.remove('hidden');
    setTimeout(() => {
        errorEl.classList.add('hidden');
    }, 5000);
}

function goToStep(stepId) {
    document.querySelectorAll('.step').forEach(step => {
        step.classList.add('hidden');
    });
    document.getElementById(stepId).classList.remove('hidden');
}

// Step 1: Verify PIN
async function verifyPin() {
    const pinInput = document.getElementById('pin-input');
    const pin = pinInput.value.trim();
    
    if (pin.length !== 5 || !/^\d{5}$/.test(pin)) {
        showError('pin-error', 'Please enter a valid 5-digit PIN');
        return;
    }
    
    try {
        const response = await fetch(`/api/booking-info/${pin}`);
        const data = await response.json();
        
        if (!response.ok) {
            showError('pin-error', data.error || 'Invalid PIN. Please try again.');
            return;
        }
        
        if (!data.eligibleServices || data.eligibleServices.length === 0) {
            showError('pin-error', 'No services available for this pet. Please contact your groomer.');
            return;
        }
        
        // Store booking data
        bookingData.pin = pin;
        bookingData.petId = data.petId;
        bookingData.petName = data.petName;
        bookingData.services = data.eligibleServices;
        
        // Show pet confirmation
        document.getElementById('pet-name').textContent = data.petName;
        goToStep('step-confirm');
        
    } catch (error) {
        console.error('Error verifying PIN:', error);
        showError('pin-error', 'Unable to verify PIN. Please try again.');
    }
}

// Allow Enter key to submit PIN
document.getElementById('pin-input').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        verifyPin();
    }
});

// Step 3: Load and display services
function loadServices() {
    const servicesList = document.getElementById('services-list');
    servicesList.innerHTML = '';
    
    if (!bookingData.services || bookingData.services.length === 0) {
        showError('service-error', 'No services available.');
        return;
    }
    
    bookingData.services.forEach(service => {
        const serviceCard = document.createElement('div');
        serviceCard.className = 'service-card';
        serviceCard.onclick = () => selectService(service);
        
        const durationHours = Math.floor(service.duration_minutes / 60);
        const durationMins = service.duration_minutes % 60;
        let durationText = '';
        if (durationHours > 0) {
            durationText = `${durationHours}h`;
            if (durationMins > 0) durationText += ` ${durationMins}m`;
        } else {
            durationText = `${durationMins}m`;
        }
        
        serviceCard.innerHTML = `
            <div class="service-name">${service.name}</div>
            ${service.description ? `<div class="service-description">${service.description}</div>` : ''}
            <div class="service-meta">
                <div class="service-price">$${service.price.toFixed(2)}</div>
                <div class="service-duration">${durationText}</div>
            </div>
        `;
        
        servicesList.appendChild(serviceCard);
    });
}

// Select service and load time slots
async function selectService(service) {
    bookingData.serviceId = service.id;
    bookingData.serviceName = service.name;
    bookingData.servicePrice = service.price;
    bookingData.serviceDuration = service.duration_minutes;
    
    document.getElementById('selected-service-name').textContent = service.name;
    goToStep('step-time');
    
    await loadTimeSlots();
}

// Step 4: Load available time slots
async function loadTimeSlots() {
    const loadingEl = document.getElementById('loading-slots');
    const timeSlotsEl = document.getElementById('time-slots');
    
    loadingEl.classList.remove('hidden');
    timeSlotsEl.classList.add('hidden');
    timeSlotsEl.innerHTML = '';
    
    try {
        // Fetch availability
        const availResponse = await fetch(`/api/availability?serviceId=${bookingData.serviceId}`);
        const availSlots = await availResponse.json();
        
        if (!availResponse.ok) {
            throw new Error(availSlots.error || 'Failed to load availability');
        }
        
        if (!availSlots || availSlots.length === 0) {
            showError('time-error', 'No available time slots found. Please contact your groomer.');
            loadingEl.classList.add('hidden');
            return;
        }
        
        // Fetch groomers to map IDs to names
        const groomersResponse = await fetch('/api/groomers');
        const groomers = await groomersResponse.json();
        const groomerMap = {};
        groomers.forEach(g => {
            groomerMap[g.id] = g.name;
        });
        
        // Fetch groomer schedules to determine which groomer is available at each slot
        const schedulesResponse = await fetch('/api/groomer-schedules');
        const schedules = await schedulesResponse.json();
        
        // Group slots by day and assign groomers
        const slotsByDay = {};
        
        availSlots.forEach(slotTime => {
            const slotDate = new Date(slotTime);
            const dayKey = slotDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
            const dayOfWeek = slotDate.getDay();
            const timeStr = slotDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
            
            // Find which groomer is working at this time
            const workingGroomers = schedules.filter(schedule => {
                if (schedule.day_of_week !== dayOfWeek) return false;
                
                const slotHour = slotDate.getHours();
                const slotMinute = slotDate.getMinutes();
                const slotTimeInMinutes = slotHour * 60 + slotMinute;
                
                const [startHour, startMin] = schedule.start_time.split(':').map(Number);
                const [endHour, endMin] = schedule.end_time.split(':').map(Number);
                const startTimeInMinutes = startHour * 60 + startMin;
                const endTimeInMinutes = endHour * 60 + endMin;
                
                return slotTimeInMinutes >= startTimeInMinutes && slotTimeInMinutes < endTimeInMinutes;
            });
            
            // Add a slot for each working groomer
            workingGroomers.forEach(schedule => {
                if (!slotsByDay[dayKey]) {
                    slotsByDay[dayKey] = [];
                }
                
                slotsByDay[dayKey].push({
                    datetime: slotTime,
                    time: timeStr,
                    groomerId: schedule.groomer_id,
                    groomerName: groomerMap[schedule.groomer_id] || 'Unknown'
                });
            });
        });
        
        // Render slots grouped by day
        Object.keys(slotsByDay).forEach(day => {
            const dayGroup = document.createElement('div');
            dayGroup.className = 'day-group';
            
            const dayHeader = document.createElement('div');
            dayHeader.className = 'day-header';
            dayHeader.textContent = day;
            dayGroup.appendChild(dayHeader);
            
            const slotsGrid = document.createElement('div');
            slotsGrid.className = 'slots-grid';
            
            slotsByDay[day].forEach(slot => {
                const slotEl = document.createElement('div');
                slotEl.className = 'time-slot';
                slotEl.onclick = () => selectTimeSlot(slot);
                
                slotEl.innerHTML = `
                    <span class="slot-time">${slot.time}</span>
                    <span class="slot-groomer">${slot.groomerName}</span>
                `;
                
                slotsGrid.appendChild(slotEl);
            });
            
            dayGroup.appendChild(slotsGrid);
            timeSlotsEl.appendChild(dayGroup);
        });
        
        loadingEl.classList.add('hidden');
        timeSlotsEl.classList.remove('hidden');
        
    } catch (error) {
        console.error('Error loading time slots:', error);
        showError('time-error', 'Unable to load available times. Please try again.');
        loadingEl.classList.add('hidden');
    }
}

// Select time slot and book appointment
async function selectTimeSlot(slot) {
    // Visual feedback
    document.querySelectorAll('.time-slot').forEach(el => el.classList.remove('selected'));
    event.currentTarget.classList.add('selected');
    
    bookingData.selectedSlot = slot.datetime;
    bookingData.groomerId = slot.groomerId;
    bookingData.groomerName = slot.groomerName;
    
    // Confirm booking
    if (!confirm(`Book appointment with ${slot.groomerName} at ${slot.time}?`)) {
        return;
    }
    
    await bookAppointment();
}

// Book the appointment
async function bookAppointment() {
    try {
        const response = await fetch('/api/appointments', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                petId: bookingData.petId,
                serviceId: bookingData.serviceId,
                appointmentStartTime: bookingData.selectedSlot,
                groomerId: bookingData.groomerId
            })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Failed to book appointment');
        }
        
        // Show confirmation
        const appointmentDate = new Date(bookingData.selectedSlot);
        const dateStr = appointmentDate.toLocaleDateString('en-US', { 
            weekday: 'long', 
            month: 'long', 
            day: 'numeric', 
            year: 'numeric' 
        });
        const timeStr = appointmentDate.toLocaleTimeString('en-US', { 
            hour: 'numeric', 
            minute: '2-digit', 
            hour12: true 
        });
        
        document.getElementById('confirm-pet').textContent = bookingData.petName;
        document.getElementById('confirm-service').textContent = bookingData.serviceName;
        document.getElementById('confirm-price').textContent = `$${bookingData.servicePrice.toFixed(2)}`;
        document.getElementById('confirm-datetime').textContent = `${dateStr} at ${timeStr}`;
        document.getElementById('confirm-groomer').textContent = bookingData.groomerName;
        
        goToStep('step-confirmation');
        
    } catch (error) {
        console.error('Error booking appointment:', error);
        alert('Unable to book appointment. Please try again or contact us directly.');
    }
}

// Initialize when service step is shown
const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
        if (mutation.target.id === 'step-service' && !mutation.target.classList.contains('hidden')) {
            loadServices();
        }
    });
});

document.querySelectorAll('.step').forEach(step => {
    observer.observe(step, { attributes: true, attributeFilter: ['class'] });
});
