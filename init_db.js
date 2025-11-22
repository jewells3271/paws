
const sqlite3 = require('sqlite3').verbose();

// The name of our database file
const DB_FILE = 'grooming.db';

// Connect to the SQLite database.
// The file will be created if it does not exist.
const db = new sqlite3.Database(DB_FILE, (err) => {
    if (err) {
        console.error('Error opening database', err.message);
    } else {
        console.log('Connected to the SQLite database.');
        createTables();
    }
});

// Function to create the database tables
function createTables() {
    // Using serialize to ensure statements run in order
    db.serialize(() => {
        console.log('Creating tables...');

        // Clients table: Stores owner information
        db.run(`
            CREATE TABLE IF NOT EXISTS clients (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                phone_number TEXT,
                email TEXT
            )
        `, (err) => {
            if (err) console.error("Error creating 'clients' table", err.message);
            else console.log("Table 'clients' created or already exists.");
        });

        // Pets table: Stores pet information, linked to a client
        db.run(`
            CREATE TABLE IF NOT EXISTS pets (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                client_id INTEGER NOT NULL,
                pin TEXT NOT NULL UNIQUE,
                name TEXT NOT NULL,
                animal_type TEXT NOT NULL CHECK(animal_type IN ('dog', 'cat')),
                breed TEXT,
                weight REAL,
                coat_type TEXT,
                age INTEGER,
                demeanor TEXT,
                notes TEXT,
                FOREIGN KEY (client_id) REFERENCES clients (id)
            )
        `, (err) => {
            if (err) console.error("Error creating 'pets' table", err.message);
            else console.log("Table 'pets' created or already exists.");
        });

        // Services table: All possible services offered
        db.run(`
            CREATE TABLE IF NOT EXISTS services (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                description TEXT,
                price REAL NOT NULL,
                duration_minutes INTEGER DEFAULT 15,
                animal_type TEXT NOT NULL CHECK(animal_type IN ('dog', 'cat', 'unisex'))
            )
        `, (err) => {
            if (err) console.error("Error creating 'services' table", err.message);
            else console.log("Table 'services' created or already exists.");
        });

        // Pet-Service Eligibility table: Maps which services are allowed for which pet
        db.run(`
            CREATE TABLE IF NOT EXISTS pet_service_eligibility (
                pet_id INTEGER NOT NULL,
                service_id INTEGER NOT NULL,
                PRIMARY KEY (pet_id, service_id),
                FOREIGN KEY (pet_id) REFERENCES pets (id),
                FOREIGN KEY (service_id) REFERENCES services (id)
            )
        `, (err) => {
            if (err) console.error("Error creating 'pet_service_eligibility' table", err.message);
            else console.log("Table 'pet_service_eligibility' created or already exists.");
        });

        // Appointments table: Stores scheduled bookings
        db.run(`
            CREATE TABLE IF NOT EXISTS appointments (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                pet_id INTEGER NOT NULL,
                service_id INTEGER NOT NULL,
                appointment_start_time TEXT NOT NULL,
                appointment_end_time TEXT NOT NULL,
                status TEXT NOT NULL DEFAULT 'scheduled' CHECK(status IN ('scheduled', 'completed', 'cancelled')),
                FOREIGN KEY (pet_id) REFERENCES pets (id),
                FOREIGN KEY (service_id) REFERENCES services (id)
            )
        `, (err) => {
            if (err) console.error("Error creating 'appointments' table", err.message);
            else console.log("Table 'appointments' created or already exists.");
        });

        // Business Hours table: Defines the weekly schedule
        db.run(`
            CREATE TABLE IF NOT EXISTS business_hours (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                day_of_week INTEGER NOT NULL UNIQUE, -- 0 for Sunday, 1 for Monday, etc.
                open_time TEXT, -- Format 'HH:MM'
                close_time TEXT -- Format 'HH:MM'
            )
        `, (err) => {
            if (err) console.error("Error creating 'business_hours' table", err.message);
            else console.log("Table 'business_hours' created or already exists.");
        });
    });

    // Close the database connection
    db.close((err) => {
        if (err) {
            console.error('Error closing database', err.message);
        } else {
            console.log('Finished creating tables. Database connection closed.');
        }
    });
}
