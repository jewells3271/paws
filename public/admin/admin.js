// Admin Panel Logic

const ADMIN_PIN = '4921';
let isLoggedIn = false;

// ===== AUTHENTICATION =====

function login() {
    const pinInput = document.getElementById('admin-pin');
    const pin = pinInput.value.trim();
    
    if (pin === ADMIN_PIN) {
        isLoggedIn = true;
        const loginScreen = document.getElementById('login-screen');
        const adminInterface = document.getElementById('admin-interface');
        
        // Hide login screen
        loginScreen.style.display = 'none';
        loginScreen.classList.add('hidden');
        
        // Show admin interface
        adminInterface.classList.remove('hidden');
        adminInterface.style.display = 'flex';
        
        // Load dashboard
        try {
            loadDashboard();
        } catch (error) {
            console.error('Error loading dashboard:', error);
        }
    } else {
        const errorEl = document.getElementById('login-error');
        errorEl.textContent = 'Invalid PIN. Please try again.';
        errorEl.classList.remove('hidden');
        pinInput.value = '';
        setTimeout(() => {
            errorEl.classList.add('hidden');
        }, 3000);
    }
}

function logout() {
    if (confirm('Are you sure you want to logout?')) {
        isLoggedIn = false;
        document.getElementById('admin-interface').classList.add('hidden');
        document.getElementById('login-screen').classList.remove('hidden');
        document.getElementById('admin-pin').value = '';
    }
}

// Allow Enter key on PIN input
window.addEventListener('DOMContentLoaded', () => {
    const pinInput = document.getElementById('admin-pin');
    if (pinInput) {
        pinInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                login();
            }
        });
    }
});

// ===== NAVIGATION =====

function showSection(sectionName) {
    // Update nav items
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    document.querySelector(`[data-section="${sectionName}"]`).classList.add('active');
    
    // Update content sections
    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.remove('active');
    });
    document.getElementById(`section-${sectionName}`).classList.add('active');
    
    // Load section data
    switch(sectionName) {
        case 'dashboard':
            loadDashboard();
            break;
        case 'appointments':
            loadAppointments();
            break;
        case 'clients':
            loadClients();
            break;
        case 'services':
            loadServices();
            break;
        case 'groomers':
            loadGroomers();
            break;
        case 'settings':
            loadEmailConfig();
            break;
    }
}

// ===== MODAL FUNCTIONS =====

function showModal(content) {
    document.getElementById('modal-container').innerHTML = content;
    document.getElementById('modal-overlay').classList.remove('hidden');
    document.getElementById('modal-container').classList.remove('hidden');
}

function closeModal() {
    document.getElementById('modal-overlay').classList.add('hidden');
    document.getElementById('modal-container').classList.add('hidden');
}

// ===== UTILITY FUNCTIONS =====

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
        weekday: 'short', 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric' 
    });
}

function formatTime(dateString) {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit', 
        hour12: true 
    });
}

function formatDateTime(dateString) {
    return `${formatDate(dateString)} at ${formatTime(dateString)}`;
}

function showAlert(message, type = 'success') {
    const alert = document.createElement('div');
    alert.className = `alert alert-${type}`;
    alert.textContent = message;
    alert.style.position = 'fixed';
    alert.style.top = '20px';
    alert.style.right = '20px';
    alert.style.zIndex = '9999';
    alert.style.minWidth = '300px';
    
    document.body.appendChild(alert);
    
    setTimeout(() => {
        alert.remove();
    }, 5000);
}

// ===== DASHBOARD =====

async function loadDashboard() {
    try {
        // Load stats
        const [clients, pets, groomers, appointments] = await Promise.all([
            fetch('/api/clients').then(r => r.json()),
            fetch('/api/search?q=').then(r => r.json()),
            fetch('/api/groomers').then(r => r.json()),
            fetch('/api/appointments-all').then(r => r.json()).catch(() => [])
        ]);
        
        document.getElementById('stat-total-clients').textContent = clients.length;
        document.getElementById('stat-total-pets').textContent = pets.length;
        document.getElementById('stat-active-groomers').textContent = groomers.length;
        
        // Count today's appointments
        const today = new Date().toDateString();
        const todayAppts = appointments.filter(appt => {
            return new Date(appt.appointment_start_time).toDateString() === today;
        });
        document.getElementById('stat-today-appointments').textContent = todayAppts.length;
        
        // Load upcoming appointments
        await loadDashboardAppointments();
        
    } catch (error) {
        console.error('Error loading dashboard:', error);
    }
}

async function loadDashboardAppointments() {
    const container = document.getElementById('dashboard-appointments');
    
    try {
        const response = await fetch('/api/appointments-all');
        let appointments = await response.json();
        
        // Filter upcoming appointments
        const now = new Date();
        appointments = appointments.filter(appt => {
            return new Date(appt.appointment_start_time) >= now && appt.status === 'scheduled';
        }).sort((a, b) => {
            return new Date(a.appointment_start_time) - new Date(b.appointment_start_time);
        }).slice(0, 5);
        
        if (appointments.length === 0) {
            container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">📅</div><p>No upcoming appointments</p></div>';
            return;
        }
        
        container.innerHTML = appointments.map(appt => `
            <div class="list-item">
                <div class="list-item-header">
                    <div>
                        <div class="list-item-title">${appt.pet_name || 'Unknown Pet'}</div>
                        <div class="text-muted">${appt.service_name || 'Service'}</div>
                    </div>
                    <span class="badge badge-${appt.status}">${appt.status}</span>
                </div>
                <div class="list-item-meta">
                    <span>📅 ${formatDateTime(appt.appointment_start_time)}</span>
                    <span>👨‍💼 ${appt.groomer_name || 'Unassigned'}</span>
                    <span>💰 $${appt.price ? appt.price.toFixed(2) : '0.00'}</span>
                </div>
            </div>
        `).join('');
        
    } catch (error) {
        console.error('Error loading dashboard appointments:', error);
        container.innerHTML = '<div class="empty-state"><p>Unable to load appointments</p></div>';
    }
}

// ===== APPOINTMENTS =====

async function loadAppointments() {
    const container = document.getElementById('appointments-list');
    const filter = document.getElementById('appointment-filter').value;
    
    container.innerHTML = '<div class="spinner"></div>';
    
    try {
        const response = await fetch('/api/appointments-all');
        let appointments = await response.json();
        
        // Apply filter
        if (filter !== 'all') {
            appointments = appointments.filter(appt => appt.status === filter);
        }
        
        // Sort by date
        appointments.sort((a, b) => {
            return new Date(b.appointment_start_time) - new Date(a.appointment_start_time);
        });
        
        if (appointments.length === 0) {
            container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">📅</div><p>No appointments found</p></div>';
            return;
        }
        
        container.innerHTML = appointments.map(appt => `
            <div class="list-item">
                <div class="list-item-header">
                    <div>
                        <div class="list-item-title">${appt.pet_name || 'Unknown Pet'} - ${appt.service_name || 'Service'}</div>
                        <div class="text-muted">${appt.owner_name || 'Unknown Owner'}</div>
                    </div>
                    <span class="badge badge-${appt.status}">${appt.status}</span>
                </div>
                <div class="list-item-meta">
                    <span>📅 ${formatDateTime(appt.appointment_start_time)}</span>
                    <span>👨‍💼 ${appt.groomer_name || 'Unassigned'}</span>
                    <span>💰 $${appt.price ? appt.price.toFixed(2) : '0.00'}</span>
                    <span>⏱️ ${appt.duration_minutes || 0} min</span>
                </div>
                <div class="list-item-actions mt-2">
                    ${appt.status === 'scheduled' ? `
                        <button class="btn btn-sm btn-success" onclick="updateAppointmentStatus(${appt.id}, 'completed')">Mark Completed</button>
                        <button class="btn btn-sm btn-warning" onclick="updateAppointmentStatus(${appt.id}, 'cancelled')">Cancel</button>
                        <button class="btn btn-sm btn-secondary" onclick="sendReminder(${appt.id})">Send Reminder</button>
                    ` : ''}
                </div>
            </div>
        `).join('');
        
    } catch (error) {
        console.error('Error loading appointments:', error);
        container.innerHTML = '<div class="empty-state"><p>Unable to load appointments</p></div>';
    }
}

async function updateAppointmentStatus(appointmentId, newStatus) {
    if (!confirm(`Are you sure you want to mark this appointment as ${newStatus}?`)) {
        return;
    }
    
    try {
        const response = await fetch(`/api/appointments/${appointmentId}/status`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: newStatus })
        });
        
        if (!response.ok) throw new Error('Failed to update appointment');
        
        showAlert(`Appointment ${newStatus} successfully`);
        loadAppointments();
        
    } catch (error) {
        console.error('Error updating appointment:', error);
        showAlert('Failed to update appointment', 'error');
    }
}

function showNewAppointmentModal() {
    // This will be implemented with client/pet selection
    showAlert('Feature coming soon - use client booking or manual entry', 'info');
}

// Continue in next part...

// ===== CLIENTS & PETS =====

async function loadClients() {
    const container = document.getElementById('clients-list');
    container.innerHTML = '<div class="spinner"></div>';
    
    try {
        const response = await fetch('/api/search?q=');
        const pets = await response.json();
        
        if (pets.length === 0) {
            container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">👥</div><p>No clients found</p></div>';
            return;
        }
        
        // Group pets by client
        const clientsMap = {};
        pets.forEach(pet => {
            if (!clientsMap[pet.clientId]) {
                clientsMap[pet.clientId] = {
                    id: pet.clientId,
                    name: pet.ownerName,
                    phone: pet.ownerPhone,
                    email: pet.ownerEmail,
                    pets: []
                };
            }
            clientsMap[pet.clientId].pets.push(pet);
        });
        
        const clients = Object.values(clientsMap);
        
        container.innerHTML = clients.map(client => `
            <div class="list-item">
                <div class="list-item-header">
                    <div>
                        <div class="list-item-title">${client.name}</div>
                        <div class="text-muted">${client.phone || 'No phone'} • ${client.email || 'No email'}</div>
                    </div>
                </div>
                <div class="mt-2">
                    <strong class="text-secondary">Pets:</strong>
                    <div class="mt-1">
                        ${client.pets.map(pet => `
                            <div class="list-item mt-1" style="background: var(--bg-hover);">
                                <div class="flex-between">
                                    <div>
                                        <strong>${pet.petName}</strong>
                                        <span class="badge badge-${pet.petType} ml-1">${pet.petType}</span>
                                        <div class="text-muted text-sm">PIN: ${pet.petPin} • ${pet.petBreed || 'Unknown breed'}</div>
                                    </div>
                                    <div class="list-item-actions">
                                        <button class="btn btn-sm btn-secondary" onclick="showEditPetModal(${pet.petId})">Edit</button>
                                    </div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
                <div class="list-item-actions mt-2">
                    <button class="btn btn-sm btn-primary" onclick="showAddPetModal(${client.id}, '${client.name}')">Add Pet</button>
                </div>
            </div>
        `).join('');
        
    } catch (error) {
        console.error('Error loading clients:', error);
        container.innerHTML = '<div class="empty-state"><p>Unable to load clients</p></div>';
    }
}

async function searchClients() {
    const query = document.getElementById('client-search').value.trim();
    const container = document.getElementById('clients-list');
    
    if (!query) {
        loadClients();
        return;
    }
    
    container.innerHTML = '<div class="spinner"></div>';
    
    try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        const results = await response.json();
        
        if (results.length === 0) {
            container.innerHTML = '<div class="empty-state"><p>No results found</p></div>';
            return;
        }
        
        container.innerHTML = results.map(pet => `
            <div class="list-item">
                <div class="list-item-header">
                    <div>
                        <div class="list-item-title">${pet.petName} <span class="badge badge-${pet.petType}">${pet.petType}</span></div>
                        <div class="text-muted">Owner: ${pet.ownerName} • PIN: ${pet.petPin}</div>
                    </div>
                </div>
                <div class="list-item-meta">
                    <span>Breed: ${pet.petBreed || 'Unknown'}</span>
                    <span>Weight: ${pet.petWeight || 'N/A'} lbs</span>
                    <span>Age: ${pet.petAge || 'N/A'} years</span>
                </div>
                ${pet.petNotes ? `<div class="mt-2 text-muted"><strong>Notes:</strong> ${pet.petNotes}</div>` : ''}
            </div>
        `).join('');
        
    } catch (error) {
        console.error('Error searching clients:', error);
        container.innerHTML = '<div class="empty-state"><p>Search failed</p></div>';
    }
}

function showNewClientModal() {
    showModal(`
        <div class="modal-header">
            <h2>Add New Client & Pet</h2>
            <button class="modal-close" onclick="closeModal()">×</button>
        </div>
        <form onsubmit="createClientPet(event)">
            <h3>Owner Information</h3>
            <div class="form-group">
                <label>Owner Name *</label>
                <input type="text" name="ownerName" required>
            </div>
            <div class="form-group">
                <label>Phone Number</label>
                <input type="tel" name="ownerPhone">
            </div>
            <div class="form-group">
                <label>Email</label>
                <input type="email" name="ownerEmail">
            </div>
            
            <h3 class="mt-3">Pet Information</h3>
            <div class="form-group">
                <label>Pet Name *</label>
                <input type="text" name="petName" required>
            </div>
            <div class="form-group">
                <label>Animal Type *</label>
                <select name="animalType" required>
                    <option value="dog">Dog</option>
                    <option value="cat">Cat</option>
                </select>
            </div>
            <div class="form-group">
                <label>Breed</label>
                <input type="text" name="petBreed">
            </div>
            <div class="form-group">
                <label>Weight (lbs)</label>
                <input type="number" name="petWeight" step="0.1">
            </div>
            <div class="form-group">
                <label>Age (years)</label>
                <input type="number" name="petAge">
            </div>
            <div class="form-group">
                <label>Demeanor</label>
                <input type="text" name="petDemeanor" placeholder="e.g., friendly, nervous, aggressive">
            </div>
            <div class="form-group">
                <label>Notes</label>
                <textarea name="petNotes" rows="3"></textarea>
            </div>
            
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancel</button>
                <button type="submit" class="btn btn-primary">Create Client & Pet</button>
            </div>
        </form>
    `);
}

function showAddPetModal(clientId, clientName) {
    showModal(`
        <div class="modal-header">
            <h2>Add Pet for ${clientName}</h2>
            <button class="modal-close" onclick="closeModal()">×</button>
        </div>
        <form onsubmit="addPetToClient(event, ${clientId})">
            <div class="form-group">
                <label>Pet Name *</label>
                <input type="text" name="petName" required>
            </div>
            <div class="form-group">
                <label>Animal Type *</label>
                <select name="animalType" required>
                    <option value="dog">Dog</option>
                    <option value="cat">Cat</option>
                </select>
            </div>
            <div class="form-group">
                <label>Breed</label>
                <input type="text" name="petBreed">
            </div>
            <div class="form-group">
                <label>Weight (lbs)</label>
                <input type="number" name="petWeight" step="0.1">
            </div>
            <div class="form-group">
                <label>Age (years)</label>
                <input type="number" name="petAge">
            </div>
            <div class="form-group">
                <label>Demeanor</label>
                <input type="text" name="petDemeanor">
            </div>
            <div class="form-group">
                <label>Notes</label>
                <textarea name="petNotes" rows="3"></textarea>
            </div>
            
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancel</button>
                <button type="submit" class="btn btn-primary">Add Pet</button>
            </div>
        </form>
    `);
}

async function createClientPet(event) {
    event.preventDefault();
    const formData = new FormData(event.target);
    
    const data = {
        ownerName: formData.get('ownerName'),
        ownerPhone: formData.get('ownerPhone'),
        ownerEmail: formData.get('ownerEmail'),
        petName: formData.get('petName'),
        animalType: formData.get('animalType'),
        petBreed: formData.get('petBreed'),
        petWeight: formData.get('petWeight'),
        petAge: formData.get('petAge'),
        petDemeanor: formData.get('petDemeanor'),
        petNotes: formData.get('petNotes'),
        selectedServiceIds: [] // Will be set later
    };
    
    try {
        const response = await fetch('/api/client-pet', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        
        const result = await response.json();
        
        if (!response.ok) throw new Error(result.error);
        
        showAlert(`Client and pet created! PIN: ${result.petPin}`);
        closeModal();
        loadClients();
        
    } catch (error) {
        console.error('Error creating client/pet:', error);
        showAlert('Failed to create client/pet: ' + error.message, 'error');
    }
}

async function addPetToClient(event, clientId) {
    event.preventDefault();
    const formData = new FormData(event.target);
    
    const data = {
        clientId: clientId,
        petName: formData.get('petName'),
        animalType: formData.get('animalType'),
        petBreed: formData.get('petBreed'),
        petWeight: formData.get('petWeight'),
        petAge: formData.get('petAge'),
        petDemeanor: formData.get('petDemeanor'),
        petNotes: formData.get('petNotes'),
        selectedServiceIds: []
    };
    
    try {
        const response = await fetch('/api/client-pet', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        
        const result = await response.json();
        
        if (!response.ok) throw new Error(result.error);
        
        showAlert(`Pet added! PIN: ${result.petPin}`);
        closeModal();
        loadClients();
        
    } catch (error) {
        console.error('Error adding pet:', error);
        showAlert('Failed to add pet: ' + error.message, 'error');
    }
}

// ===== SERVICES =====

async function loadServices() {
    const container = document.getElementById('services-list');
    container.innerHTML = '<div class="spinner"></div>';
    
    try {
        const response = await fetch('/api/services');
        const services = await response.json();
        
        if (services.length === 0) {
            container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">✂️</div><p>No services found</p></div>';
            return;
        }
        
        // Group by animal type
        const dogServices = services.filter(s => s.animal_type === 'dog');
        const catServices = services.filter(s => s.animal_type === 'cat');
        const unisexServices = services.filter(s => s.animal_type === 'unisex');
        
        let html = '';
        
        if (dogServices.length > 0) {
            html += '<h3 class="mb-2">Dog Services</h3><div class="service-grid mb-4">' + 
                dogServices.map(service => renderServiceCard(service)).join('') + '</div>';
        }
        
        if (catServices.length > 0) {
            html += '<h3 class="mb-2">Cat Services</h3><div class="service-grid mb-4">' + 
                catServices.map(service => renderServiceCard(service)).join('') + '</div>';
        }
        
        if (unisexServices.length > 0) {
            html += '<h3 class="mb-2">Universal Services</h3><div class="service-grid">' + 
                unisexServices.map(service => renderServiceCard(service)).join('') + '</div>';
        }
        
        container.innerHTML = html;
        
    } catch (error) {
        console.error('Error loading services:', error);
        container.innerHTML = '<div class="empty-state"><p>Unable to load services</p></div>';
    }
}

function renderServiceCard(service) {
    const durationHours = Math.floor(service.duration_minutes / 60);
    const durationMins = service.duration_minutes % 60;
    let durationText = '';
    if (durationHours > 0) {
        durationText = `${durationHours}h`;
        if (durationMins > 0) durationText += ` ${durationMins}m`;
    } else {
        durationText = `${durationMins}m`;
    }
    
    return `
        <div class="service-item">
            <div class="service-item-header">
                <div class="service-name">${service.name}</div>
                <div class="service-price">$${service.price.toFixed(2)}</div>
            </div>
            ${service.description ? `<div class="service-description">${service.description}</div>` : ''}
            <div class="service-meta">
                <span>⏱️ ${durationText}</span>
                <span class="badge badge-${service.animal_type}">${service.animal_type}</span>
            </div>
            <div class="service-actions">
                <button class="btn btn-sm btn-secondary" onclick="showEditServiceModal(${service.id})">Edit</button>
                <button class="btn btn-sm btn-danger" onclick="deleteService(${service.id})">Delete</button>
            </div>
        </div>
    `;
}

function showNewServiceModal() {
    showModal(`
        <div class="modal-header">
            <h2>Add New Service</h2>
            <button class="modal-close" onclick="closeModal()">×</button>
        </div>
        <form onsubmit="createService(event)">
            <div class="form-group">
                <label>Service Name *</label>
                <input type="text" name="name" required>
            </div>
            <div class="form-group">
                <label>Description</label>
                <textarea name="description" rows="2"></textarea>
            </div>
            <div class="form-group">
                <label>Price ($) *</label>
                <input type="number" name="price" step="0.01" required>
            </div>
            <div class="form-group">
                <label>Duration (minutes) *</label>
                <input type="number" name="duration_minutes" required>
            </div>
            <div class="form-group">
                <label>Animal Type *</label>
                <select name="animal_type" required>
                    <option value="dog">Dog</option>
                    <option value="cat">Cat</option>
                    <option value="unisex">Universal</option>
                </select>
            </div>
            
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancel</button>
                <button type="submit" class="btn btn-primary">Create Service</button>
            </div>
        </form>
    `);
}

async function showEditServiceModal(serviceId) {
    try {
        const response = await fetch('/api/services');
        const services = await response.json();
        const service = services.find(s => s.id === serviceId);
        
        if (!service) {
            showAlert('Service not found', 'error');
            return;
        }
        
        showModal(`
            <div class="modal-header">
                <h2>Edit Service</h2>
                <button class="modal-close" onclick="closeModal()">×</button>
            </div>
            <form onsubmit="updateService(event, ${serviceId})">
                <div class="form-group">
                    <label>Service Name *</label>
                    <input type="text" name="name" value="${service.name}" required>
                </div>
                <div class="form-group">
                    <label>Description</label>
                    <textarea name="description" rows="2">${service.description || ''}</textarea>
                </div>
                <div class="form-group">
                    <label>Price ($) *</label>
                    <input type="number" name="price" step="0.01" value="${service.price}" required>
                </div>
                <div class="form-group">
                    <label>Duration (minutes) *</label>
                    <input type="number" name="duration_minutes" value="${service.duration_minutes}" required>
                </div>
                <div class="form-group">
                    <label>Animal Type *</label>
                    <select name="animal_type" required>
                        <option value="dog" ${service.animal_type === 'dog' ? 'selected' : ''}>Dog</option>
                        <option value="cat" ${service.animal_type === 'cat' ? 'selected' : ''}>Cat</option>
                        <option value="unisex" ${service.animal_type === 'unisex' ? 'selected' : ''}>Universal</option>
                    </select>
                </div>
                
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancel</button>
                    <button type="submit" class="btn btn-primary">Update Service</button>
                </div>
            </form>
        `);
    } catch (error) {
        console.error('Error loading service:', error);
        showAlert('Failed to load service', 'error');
    }
}

async function createService(event) {
    event.preventDefault();
    const formData = new FormData(event.target);
    
    const data = {
        name: formData.get('name'),
        description: formData.get('description'),
        price: parseFloat(formData.get('price')),
        duration_minutes: parseInt(formData.get('duration_minutes')),
        animal_type: formData.get('animal_type')
    };
    
    try {
        const response = await fetch('/api/services', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        
        if (!response.ok) throw new Error('Failed to create service');
        
        showAlert('Service created successfully');
        closeModal();
        loadServices();
        
    } catch (error) {
        console.error('Error creating service:', error);
        showAlert('Failed to create service', 'error');
    }
}

async function updateService(event, serviceId) {
    event.preventDefault();
    const formData = new FormData(event.target);
    
    const data = {
        name: formData.get('name'),
        description: formData.get('description'),
        price: parseFloat(formData.get('price')),
        duration_minutes: parseInt(formData.get('duration_minutes')),
        animal_type: formData.get('animal_type')
    };
    
    try {
        const response = await fetch(`/api/services/${serviceId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        
        if (!response.ok) throw new Error('Failed to update service');
        
        showAlert('Service updated successfully');
        closeModal();
        loadServices();
        
    } catch (error) {
        console.error('Error updating service:', error);
        showAlert('Failed to update service', 'error');
    }
}

async function deleteService(serviceId) {
    if (!confirm('Are you sure you want to delete this service?')) {
        return;
    }
    
    try {
        const response = await fetch(`/api/services/${serviceId}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) throw new Error('Failed to delete service');
        
        showAlert('Service deleted successfully');
        loadServices();
        
    } catch (error) {
        console.error('Error deleting service:', error);
        showAlert('Failed to delete service', 'error');
    }
}

// Continue with groomers section...

// ===== GROOMERS =====

async function loadGroomers() {
    const container = document.getElementById('groomers-list');
    container.innerHTML = '<div class="spinner"></div>';
    
    try {
        const [groomersResponse, schedulesResponse] = await Promise.all([
            fetch('/api/groomers'),
            fetch('/api/groomer-schedules')
        ]);
        
        const groomers = await groomersResponse.json();
        const schedules = await schedulesResponse.json();
        
        if (groomers.length === 0) {
            container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">👨‍💼</div><p>No groomers found</p></div>';
            return;
        }
        
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        
        container.innerHTML = groomers.map(groomer => {
            const groomerSchedules = schedules.filter(s => s.groomer_id === groomer.id);
            const scheduleByDay = {};
            groomerSchedules.forEach(s => {
                scheduleByDay[s.day_of_week] = s;
            });
            
            return `
                <div class="groomer-card">
                    <div class="groomer-header">
                        <div class="groomer-name">${groomer.name}</div>
                        <div class="list-item-actions">
                            <button class="btn btn-sm btn-secondary" onclick="showEditGroomerSchedule(${groomer.id}, '${groomer.name}')">Edit Schedule</button>
                            <button class="btn btn-sm btn-danger" onclick="deleteGroomer(${groomer.id})">Delete</button>
                        </div>
                    </div>
                    <div class="schedule-grid">
                        ${days.map((day, index) => {
                            const schedule = scheduleByDay[index];
                            return `
                                <div class="schedule-day ${schedule ? 'active' : ''}">
                                    <div class="day-name">${day.substring(0, 3)}</div>
                                    <div class="day-hours">
                                        ${schedule ? `${schedule.start_time} - ${schedule.end_time}` : 'Off'}
                                    </div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>
            `;
        }).join('');
        
    } catch (error) {
        console.error('Error loading groomers:', error);
        container.innerHTML = '<div class="empty-state"><p>Unable to load groomers</p></div>';
    }
}

function showNewGroomerModal() {
    showModal(`
        <div class="modal-header">
            <h2>Add New Groomer</h2>
            <button class="modal-close" onclick="closeModal()">×</button>
        </div>
        <form onsubmit="createGroomer(event)">
            <div class="form-group">
                <label>Groomer Name *</label>
                <input type="text" name="name" required>
            </div>
            
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancel</button>
                <button type="submit" class="btn btn-primary">Add Groomer</button>
            </div>
        </form>
    `);
}

async function showEditGroomerSchedule(groomerId, groomerName) {
    try {
        const response = await fetch('/api/groomer-schedules');
        const allSchedules = await response.json();
        const groomerSchedules = allSchedules.filter(s => s.groomer_id === groomerId);
        
        const scheduleByDay = {};
        groomerSchedules.forEach(s => {
            scheduleByDay[s.day_of_week] = s;
        });
        
        const days = [
            { name: 'Sunday', value: 0 },
            { name: 'Monday', value: 1 },
            { name: 'Tuesday', value: 2 },
            { name: 'Wednesday', value: 3 },
            { name: 'Thursday', value: 4 },
            { name: 'Friday', value: 5 },
            { name: 'Saturday', value: 6 }
        ];
        
        const defaultStart = scheduleByDay[1]?.start_time || '09:00';
        const defaultEnd = scheduleByDay[1]?.end_time || '17:00';
        
        showModal(`
            <div class="modal-header">
                <h2>Edit Schedule - ${groomerName}</h2>
                <button class="modal-close" onclick="closeModal()">×</button>
            </div>
            <form onsubmit="updateGroomerSchedule(event, ${groomerId})">
                <div class="form-group">
                    <label>Working Days *</label>
                    <div class="checkbox-group">
                        ${days.map(day => `
                            <div class="checkbox-item">
                                <input 
                                    type="checkbox" 
                                    name="dayOfWeek" 
                                    value="${day.value}" 
                                    id="day-${day.value}"
                                    ${scheduleByDay[day.value] ? 'checked' : ''}
                                >
                                <label for="day-${day.value}">${day.name}</label>
                            </div>
                        `).join('')}
                    </div>
                </div>
                
                <div class="form-group">
                    <label>Start Time *</label>
                    <input type="time" name="startTime" value="${defaultStart}" required>
                </div>
                
                <div class="form-group">
                    <label>End Time *</label>
                    <input type="time" name="endTime" value="${defaultEnd}" required>
                </div>
                
                <div class="alert alert-info">
                    <strong>Note:</strong> The same hours will apply to all selected days.
                </div>
                
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancel</button>
                    <button type="submit" class="btn btn-primary">Update Schedule</button>
                </div>
            </form>
        `);
    } catch (error) {
        console.error('Error loading groomer schedule:', error);
        showAlert('Failed to load schedule', 'error');
    }
}

async function createGroomer(event) {
    event.preventDefault();
    const formData = new FormData(event.target);
    
    const data = {
        name: formData.get('name')
    };
    
    try {
        const response = await fetch('/api/groomers', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        
        const result = await response.json();
        
        if (!response.ok) throw new Error(result.error);
        
        showAlert('Groomer added successfully');
        closeModal();
        loadGroomers();
        
    } catch (error) {
        console.error('Error creating groomer:', error);
        showAlert('Failed to add groomer: ' + error.message, 'error');
    }
}

async function updateGroomerSchedule(event, groomerId) {
    event.preventDefault();
    const formData = new FormData(event.target);
    
    const selectedDays = formData.getAll('dayOfWeek').map(d => parseInt(d));
    const startTime = formData.get('startTime');
    const endTime = formData.get('endTime');
    
    if (selectedDays.length === 0) {
        showAlert('Please select at least one working day', 'error');
        return;
    }
    
    const data = {
        groomerId: groomerId,
        dayOfWeek: selectedDays,
        startTime: startTime,
        endTime: endTime
    };
    
    try {
        const response = await fetch('/api/groomer-schedules', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        
        const result = await response.json();
        
        if (!response.ok) throw new Error(result.error);
        
        showAlert('Schedule updated successfully');
        closeModal();
        loadGroomers();
        
    } catch (error) {
        console.error('Error updating schedule:', error);
        showAlert('Failed to update schedule: ' + error.message, 'error');
    }
}

async function deleteGroomer(groomerId) {
    if (!confirm('Are you sure you want to delete this groomer? This will also delete their schedule.')) {
        return;
    }
    
    try {
        const response = await fetch(`/api/groomers/${groomerId}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) throw new Error('Failed to delete groomer');
        
        showAlert('Groomer deleted successfully');
        loadGroomers();
        
    } catch (error) {
        console.error('Error deleting groomer:', error);
        showAlert('Failed to delete groomer', 'error');
    }
}

// ===== EMAIL SETTINGS =====

async function loadEmailConfig() {
    try {
        const response = await fetch('/api/email-config');
        const config = await response.json();
        
        if (config) {
            document.getElementById('email-enabled').checked = config.enabled === 1;
            document.getElementById('email-provider').value = config.provider || 'gmail';
            document.getElementById('email-address').value = config.email || '';
            document.getElementById('email-password').value = config.password || '';
            document.getElementById('smtp-host').value = config.smtp_host || '';
            document.getElementById('smtp-port').value = config.smtp_port || '';
            document.getElementById('shop-name').value = config.shop_name || '';
            document.getElementById('shop-phone').value = config.shop_phone || '';
            
            // Show/hide email settings based on enabled status
            document.getElementById('email-settings').style.display = config.enabled === 1 ? 'block' : 'none';
            
            // Show/hide SMTP fields based on provider
            toggleSmtpFields();
        }
    } catch (error) {
        console.error('Error loading email config:', error);
    }
}

// Toggle email settings visibility
document.getElementById('email-enabled').addEventListener('change', function() {
    document.getElementById('email-settings').style.display = this.checked ? 'block' : 'none';
});

// Toggle SMTP fields based on provider
function toggleSmtpFields() {
    const provider = document.getElementById('email-provider').value;
    const smtpFields = document.getElementById('smtp-fields');
    const smtpHost = document.getElementById('smtp-host');
    const smtpPort = document.getElementById('smtp-port');
    
    if (provider === 'custom') {
        smtpFields.style.display = 'block';
    } else {
        smtpFields.style.display = 'none';
        
        // Set default values for known providers
        if (provider === 'hostinger') {
            smtpHost.value = 'smtp.hostinger.com';
            smtpPort.value = '465';
        } else if (provider === 'gmail') {
            smtpHost.value = '';
            smtpPort.value = '';
        }
    }
}

async function saveEmailConfig(event) {
    event.preventDefault();
    const formData = new FormData(event.target);
    
    const data = {
        enabled: document.getElementById('email-enabled').checked ? 1 : 0,
        provider: formData.get('provider'),
        email: formData.get('email'),
        password: formData.get('password'),
        smtp_host: formData.get('smtp_host'),
        smtp_port: formData.get('smtp_port'),
        shop_name: formData.get('shop_name'),
        shop_phone: formData.get('shop_phone')
    };
    
    // Validation
    if (data.enabled && (!data.email || !data.password)) {
        showAlert('Email address and password are required when email is enabled', 'error');
        return;
    }
    
    try {
        const response = await fetch('/api/email-config', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        
        const result = await response.json();
        
        if (!response.ok) throw new Error(result.error);
        
        showAlert('Email settings saved successfully');
        
    } catch (error) {
        console.error('Error saving email config:', error);
        showAlert('Failed to save email settings: ' + error.message, 'error');
    }
}

async function testEmailConnection() {
    // First save the current settings
    const formData = new FormData(document.getElementById('email-config-form'));
    
    const data = {
        enabled: 1, // Temporarily enable for testing
        provider: formData.get('provider'),
        email: formData.get('email'),
        password: formData.get('password'),
        smtp_host: formData.get('smtp_host'),
        smtp_port: formData.get('smtp_port'),
        shop_name: formData.get('shop_name'),
        shop_phone: formData.get('shop_phone')
    };
    
    if (!data.email || !data.password) {
        showAlert('Please enter email address and password first', 'error');
        return;
    }
    
    try {
        showAlert('Testing email connection...', 'info');
        
        // Save config temporarily
        await fetch('/api/email-config', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        
        // Test connection
        const response = await fetch('/api/email-test', {
            method: 'POST'
        });
        
        const result = await response.json();
        
        if (!response.ok) throw new Error(result.error);
        
        showAlert('✅ Email connection successful! Test email sent.', 'success');
        
    } catch (error) {
        console.error('Error testing email:', error);
        showAlert('❌ Email connection failed: ' + error.message, 'error');
    }
}


async function sendReminder(appointmentId) {
    if (!confirm('Send a reminder email for this appointment?')) {
        return;
    }
    
    try {
        const response = await fetch(`/api/appointments/${appointmentId}/send-reminder`, {
            method: 'POST'
        });
        
        const result = await response.json();
        
        if (!response.ok) throw new Error(result.error);
        
        showAlert('Reminder email sent successfully!');
        
    } catch (error) {
        console.error('Error sending reminder:', error);
        showAlert('Failed to send reminder: ' + error.message, 'error');
    }
}
