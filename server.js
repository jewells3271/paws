
const express = require('express');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const app = express();
const PORT = 3000;
const DB_FILE = 'grooming.db';

// --- Database Connection ---
const db = new sqlite3.Database(DB_FILE, (err) => {
    if (err) {
        console.error('Error opening database', err.message);
    } else {
        console.log('Successfully connected to the database.');
    }
});

// --- Middleware ---
// To parse JSON bodies from incoming requests
app.use(express.json()); 


// --- Middleware to handle favicon requests ---
app.get('/favicon.ico', (req, res) => res.status(204).send());


// --- API Endpoints (will be built in next steps) ---

// Example: A simple endpoint to check if the server is running
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'Server is running' });
});

// Endpoint to get all services
app.get('/api/services', (req, res) => {
    const sql = `SELECT * FROM services ORDER BY animal_type, name`;
    db.all(sql, [], (err, rows) => {
        if (err) {
            console.error('Error querying for services:', err.message);
            res.status(500).json({ error: 'Database error while fetching services.' });
            return;
        }
        res.json(rows);
    });
});

// Endpoint to get all clients
app.get('/api/clients', (req, res) => {
    const sql = `SELECT id, name FROM clients ORDER BY name`;
    db.all(sql, [], (err, rows) => {
        if (err) {
            console.error('Error querying for clients:', err.message);
            res.status(500).json({ error: 'Database error while fetching clients.' });
            return;
        }
        res.json(rows);
    });
});

// Endpoint to search clients and pets
app.get('/api/search', (req, res) => {
    const query = req.query.q;
    if (!query) {
        return res.status(400).json({ error: 'Search query parameter "q" is required.' });
    }

    const searchTerm = `%${query}%`;
    const sql = `
        SELECT
            c.id AS clientId,
            c.name AS ownerName,
            c.phone_number AS ownerPhone,
            c.email AS ownerEmail,
            p.id AS petId,
            p.name AS petName,
            p.pin AS petPin,
            p.animal_type AS petType,
            p.breed AS petBreed,
            p.weight AS petWeight,
            p.age AS petAge,
            p.demeanor AS petDemeanor,
            p.notes AS petNotes
        FROM pets p
        JOIN clients c ON p.client_id = c.id
        WHERE
            c.name LIKE ? OR
            p.name LIKE ? OR
            p.pin LIKE ?
        ORDER BY c.name, p.name
    `;

    db.all(sql, [searchTerm, searchTerm, searchTerm], (err, rows) => {
        if (err) {
            console.error('Error querying for search results:', err.message);
            res.status(500).json({ error: 'Database error while searching.' });
            return;
        }
        res.json(rows);
    });
});

// --- Booking Endpoints ---

// Endpoint to get pet and eligible service info by PIN
app.get('/api/booking-info/:pin', (req, res) => {
    const { pin } = req.params;

    if (!pin || pin.length !== 5) {
        return res.status(400).json({ error: 'A valid 5-digit PIN is required.' });
    }

    // First, find the pet by PIN
    const petSql = `SELECT id, name FROM pets WHERE pin = ?`;
    db.get(petSql, [pin], (err, pet) => {
        if (err) {
            console.error('Error finding pet by PIN:', err.message);
            return res.status(500).json({ error: 'Database error while searching for pet.' });
        }
        if (!pet) {
            return res.status(404).json({ error: 'Pet not found for the provided PIN.' });
        }

        // If pet is found, get its eligible services
        const servicesSql = `
            SELECT s.id, s.name, s.description, s.price, s.duration_minutes
            FROM services s
            JOIN pet_service_eligibility pse ON s.id = pse.service_id
            WHERE pse.pet_id = ?
            ORDER BY s.name;
        `;
        db.all(servicesSql, [pet.id], (err, services) => {
            if (err) {
                console.error('Error fetching eligible services for pet:', err.message);
                return res.status(500).json({ error: 'Database error while fetching services.' });
            }

            // Return pet info and its services
            res.json({
                petId: pet.id,
                petName: pet.name,
                eligibleServices: services
            });
        });
    });
});

// Promisify db.get and db.all for async/await
const dbGet = (sql, params) => new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => err ? reject(err) : resolve(row));
});
const dbAll = (sql, params) => new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => err ? reject(err) : resolve(rows));
});

// Endpoint to get availability for a given service
app.get('/api/availability', async (req, res) => {
    const { serviceId } = req.query;
    if (!serviceId) {
        return res.status(400).json({ error: 'A serviceId query parameter is required.' });
    }

    try {
        // --- 1. Fetch all necessary data in parallel ---
        const servicePromise = dbGet(`SELECT duration_minutes FROM services WHERE id = ?`, [serviceId]);
        const schedulesPromise = dbAll(`SELECT groomer_id, day_of_week, start_time, end_time FROM groomer_schedules`, []);
        
        // We only need to check appointments from today onwards
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Set to the beginning of the day
        const appointmentsPromise = dbAll(`SELECT appointment_start_time, appointment_end_time FROM appointments WHERE appointment_start_time >= ?`, [today.toISOString()]);

        const [service, allSchedules, allAppointments] = await Promise.all([servicePromise, schedulesPromise, appointmentsPromise]);

        if (!service) {
            return res.status(404).json({ error: 'Service not found.' });
        }
        const serviceDuration = service.duration_minutes;

        // --- 2. Generate all potential slots for the next 7 days ---
        const potentialSlots = [];
        const dayInMs = 1000 * 60 * 60 * 24;
        const interval = 15; // 15-minute intervals

        for (let i = 0; i < 7; i++) { // For the next 7 days
            const date = new Date(today.getTime() + i * dayInMs);
            const dayOfWeek = date.getDay();

            const groomersWorkingToday = allSchedules.filter(s => s.day_of_week === dayOfWeek);
            
            for (const schedule of groomersWorkingToday) {
                const [openHour, openMin] = schedule.start_time.split(':').map(Number);
                const [closeHour, closeMin] = schedule.end_time.split(':').map(Number);
                
                let currentTime = new Date(date);
                currentTime.setHours(openHour, openMin, 0, 0);

                let closeTime = new Date(date);
                closeTime.setHours(closeHour, closeMin, 0, 0);

                // Iterate through the working hours of the groomer
                while (currentTime < closeTime) {
                    potentialSlots.push(new Date(currentTime));
                    currentTime.setMinutes(currentTime.getMinutes() + interval);
                }
            }
        }
        
        // --- 3. Filter out unavailable slots ---
        const availableSlots = potentialSlots.filter(slotStart => {
            const slotEnd = new Date(slotStart.getTime() + serviceDuration * 60000);

            // Check if slot falls within any existing appointment
            const isOverlapping = allAppointments.some(appt => {
                const apptStart = new Date(appt.appointment_start_time);
                const apptEnd = new Date(appt.appointment_end_time);
                // Overlap condition: (StartA < EndB) and (EndA > StartB)
                return slotStart < apptEnd && slotEnd > apptStart;
            });

            return !isOverlapping;
        });

        // --- 4. Format and return the slots ---
        const formattedSlots = availableSlots.map(slot => slot.toISOString());
        res.json(formattedSlots);

    } catch (error) {
        console.error('Error calculating availability:', error.message);
        res.status(500).json({ error: 'Failed to calculate availability.' });
    }
});

// Endpoint to book an appointment
app.post('/api/appointments', async (req, res) => {
    const { petId, serviceId, appointmentStartTime } = req.body;

    if (!petId || !serviceId || !appointmentStartTime) {
        return res.status(400).json({ error: 'petId, serviceId, and appointmentStartTime are required.' });
    }

    // 1. Get the service duration
    const serviceSql = `SELECT duration_minutes FROM services WHERE id = ?`;
    db.get(serviceSql, [serviceId], (err, service) => {
        if (err) {
            console.error('Error getting service duration:', err.message);
            return res.status(500).json({ error: 'Database error while getting service details.' });
        }
        if (!service) {
            return res.status(404).json({ error: 'Service not found.' });
        }

        // 2. Calculate end time
        const startTime = new Date(appointmentStartTime);
        const endTime = new Date(startTime.getTime() + service.duration_minutes * 60000); // convert minutes to ms
        const appointmentEndTime = endTime.toISOString();

        // 3. Insert the appointment
        const insertSql = `INSERT INTO appointments (pet_id, service_id, appointment_start_time, appointment_end_time, status) VALUES (?, ?, ?, ?, 'scheduled')`;
        db.run(insertSql, [petId, serviceId, appointmentStartTime, appointmentEndTime], function(err) {
            if (err) {
                console.error('Error creating appointment:', err.message);
                return res.status(500).json({ error: 'Failed to book appointment.' });
            }
            res.status(201).json({ message: 'Appointment booked successfully!', appointmentId: this.lastID });
        });
    });
});

// --- Groomer Management Endpoints ---

// Endpoint to get all groomers
app.get('/api/groomers', (req, res) => {
    const sql = `SELECT id, name FROM groomers ORDER BY name`;
    db.all(sql, [], (err, rows) => {
        if (err) {
            console.error('Error querying for groomers:', err.message);
            res.status(500).json({ error: 'Database error while fetching groomers.' });
            return;
        }
        res.json(rows);
    });
});

// Endpoint to add a new groomer
app.post('/api/groomers', (req, res) => {
    const { name } = req.body;
    if (!name) {
        return res.status(400).json({ error: 'Groomer name is required.' });
    }
    const sql = `INSERT INTO groomers (name) VALUES (?)`;
    db.run(sql, [name], function(err) {
        if (err) {
            console.error('Error adding groomer:', err.message);
            if (err.message.includes('UNIQUE constraint failed')) {
                return res.status(409).json({ error: 'Groomer name already exists.' });
            }
            return res.status(500).json({ error: 'Failed to add groomer.' });
        }
        res.status(201).json({ message: 'Groomer added successfully!', id: this.lastID, name });
    });
});

// Endpoint to set a groomer's weekly schedule
app.post('/api/groomer-schedules', (req, res) => {
    console.log('Received request to set groomer schedule:', req.body); // Debugging line
    const { groomerId, dayOfWeek, startTime, endTime } = req.body;
    
    if (!groomerId || !Array.isArray(dayOfWeek) || dayOfWeek.length === 0 || !startTime || !endTime) {
        return res.status(400).json({ error: 'Groomer ID, at least one day of week, start time, and end time are required.' });
    }

    db.serialize(() => {
        db.run('BEGIN TRANSACTION;');

        // Delete ALL existing schedules for the given groomer_id before inserting new ones
        const deleteSql = `DELETE FROM groomer_schedules WHERE groomer_id = ?`;
        db.run(deleteSql, [groomerId], function(err) {
            if (err) {
                console.error('Error deleting existing schedules for groomer:', err.message);
                return db.run('ROLLBACK;', () => res.status(500).json({ error: 'Failed to update schedule.' }));
            }

            // Insert new schedules
            const insertSql = `INSERT INTO groomer_schedules (groomer_id, day_of_week, start_time, end_time) VALUES (?, ?, ?, ?)`;
            let promises = dayOfWeek.map(day => {
                return new Promise((resolve, reject) => {
                    db.run(insertSql, [groomerId, day, startTime, endTime], (err) => {
                        if (err) reject(err);
                        else resolve();
                    });
                });
            });

            Promise.all(promises)
                .then(() => {
                    db.run('COMMIT;', () => res.status(200).json({ message: 'Groomer schedule updated successfully!' }));
                })
                .catch(insertErr => {
                    console.error('Error inserting new schedules:', insertErr.message);
                    db.run('ROLLBACK;', () => res.status(500).json({ error: 'Failed to update schedule.' }));
                });
        });
    });
});


// Helper function to generate a unique 5-digit PIN
async function generateUniquePin() {
    let pin;
    let isUnique = false;
    let attempts = 0;
    const MAX_ATTEMPTS = 100; // Prevent infinite loops

    while (!isUnique && attempts < MAX_ATTEMPTS) {
        // Generate a random 5-digit number (10000-99999)
        pin = Math.floor(10000 + Math.random() * 90000).toString();
        
        const existingPin = await new Promise((resolve, reject) => {
            db.get(`SELECT pin FROM pets WHERE pin = ?`, [pin], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
        
        if (!existingPin) {
            isUnique = true;
        }
        attempts++;
    }

    if (!isUnique) {
        throw new Error('Failed to generate a unique PIN after multiple attempts.');
    }
    return pin;
}

// Endpoint to create a new client, pet, and pet_service_eligibility
app.post('/api/client-pet', async (req, res) => {
    const { ownerName, ownerPhone, ownerEmail, petName, animalType, petBreed, petWeight, petAge, petDemeanor, petNotes, selectedServiceIds, clientId: existingClientId } = req.body;

    db.serialize(() => {
        db.run('BEGIN TRANSACTION;');

        let finalClientId;
        let petId;
        let petPin;

        const handlePetAndEligibility = (err, generatedPin) => {
            if (err) {
                console.error('Error generating unique PIN:', err.message);
                return db.run('ROLLBACK;', () => res.status(500).json({ error: 'Failed to generate unique PIN.' }));
            }
            petPin = generatedPin;
            const insertPetSql = `INSERT INTO pets (client_id, pin, name, animal_type, breed, weight, age, demeanor, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
            db.run(insertPetSql, [finalClientId, petPin, petName, animalType, petBreed, petWeight, petAge, petDemeanor, petNotes], function(err) {
                if (err) {
                    console.error('Error inserting pet:', err.message);
                    return db.run('ROLLBACK;', () => res.status(500).json({ error: 'Failed to create pet.' }));
                }
                petId = this.lastID;
                console.log(`Pet inserted with ID: ${petId}, PIN: ${petPin}`);

                // 3. Insert Pet Service Eligibility
                if (selectedServiceIds && selectedServiceIds.length > 0) {
                    const insertEligibilitySql = `INSERT INTO pet_service_eligibility (pet_id, service_id) VALUES (?, ?)`;
                    let promises = selectedServiceIds.map(serviceId => {
                        return new Promise((resolve, reject) => {
                            db.run(insertEligibilitySql, [petId, serviceId], (err) => {
                                if (err) reject(err);
                                else resolve();
                            });
                        });
                    });

                    Promise.all(promises)
                        .then(() => {
                            db.run('COMMIT;', () => res.json({ message: 'Client and pet created successfully!', petPin: petPin, clientId: finalClientId }));
                        })
                        .catch(eligibilityErr => {
                            console.error('Error inserting service eligibility:', eligibilityErr.message);
                            db.run('ROLLBACK;', () => res.status(500).json({ error: 'Failed to link services to pet.' }));
                        });
                } else {
                    // If no services selected, commit directly
                    db.run('COMMIT;', () => res.json({ message: 'Client and pet created successfully (no services linked).', petPin: petPin, clientId: finalClientId }));
                }
            });
        };

        if (existingClientId) {
            finalClientId = existingClientId;
            console.log(`Using existing client ID: ${finalClientId}`);
            generateUniquePin().then(pin => handlePetAndEligibility(null, pin)).catch(err => handlePetAndEligibility(err));
        } else {
            // 1. Insert Client
            const insertClientSql = `INSERT INTO clients (name, phone_number, email) VALUES (?, ?, ?)`;
            db.run(insertClientSql, [ownerName, ownerPhone, ownerEmail], function(err) {
                if (err) {
                    console.error('Error inserting client:', err.message);
                    return db.run('ROLLBACK;', () => res.status(500).json({ error: 'Failed to create client.' }));
                }
                finalClientId = this.lastID;
                console.log(`Client inserted with ID: ${finalClientId}`);
                generateUniquePin().then(pin => handlePetAndEligibility(null, pin)).catch(err => handlePetAndEligibility(err));
            });
        }
    });
});



// To serve static files like index.html, style.css
app.use(express.static(path.join(__dirname, 'public'))); 

// --- Server Start ---
app.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
    console.log('Admin Panel should be accessible.');
});

// --- Graceful Shutdown ---
process.on('SIGINT', () => {
    db.close((err) => {
        if (err) {
            console.error(err.message);
        }
        console.log('Database connection closed.');
        process.exit(0);
    });
});
