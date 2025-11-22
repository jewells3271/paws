
const sqlite3 = require('sqlite3').verbose();
const DB_FILE = 'grooming.db';

const db = new sqlite3.Database(DB_FILE, (err) => {
    if (err) {
        console.error('Error opening database', err.message);
        process.exit(1);
    }
    console.log('Connected to the SQLite database for migration.');
});

db.serialize(() => {
    console.log('Starting groomer-related database migration...');

    // Drop the old business_hours table
    db.run(`DROP TABLE IF EXISTS business_hours`, (err) => {
        if (err) console.error("Error dropping 'business_hours' table:", err.message);
        else console.log("Table 'business_hours' dropped (if it existed).");
    });

    // Create groomers table
    db.run(`
        CREATE TABLE IF NOT EXISTS groomers (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL UNIQUE
        )
    `, (err) => {
        if (err) console.error("Error creating 'groomers' table:", err.message);
        else console.log("Table 'groomers' created or already exists.");
    });

    // Alter appointments table to add groomer_id
    // This is a simplified ALTER TABLE. For more complex scenarios (e.g., adding NOT NULL
    // to an existing table with data, or adding a foreign key constraint to a populated table),
    // a more involved process of creating a new table, copying data, dropping old, and renaming would be needed.
    // Given 'appointments' is currently empty, adding a nullable column is straightforward.
    db.run(`ALTER TABLE appointments ADD COLUMN groomer_id INTEGER`, (err) => {
        if (err && !err.message.includes('duplicate column name')) {
            console.error("Error altering 'appointments' table:", err.message);
        } else {
            console.log("Column 'groomer_id' added to 'appointments' table or already exists.");
        }
    });

    // Create groomer_schedules table
    db.run(`
        CREATE TABLE IF NOT EXISTS groomer_schedules (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            groomer_id INTEGER NOT NULL,
            day_of_week INTEGER NOT NULL, -- 0 for Sunday, 1 for Monday, etc.
            start_time TEXT NOT NULL,    -- HH:MM
            end_time TEXT NOT NULL,      -- HH:MM
            UNIQUE(groomer_id, day_of_week),
            FOREIGN KEY (groomer_id) REFERENCES groomers (id) ON DELETE CASCADE
        )
    `, (err) => {
        if (err) console.error("Error creating 'groomer_schedules' table:", err.message);
        else console.log("Table 'groomer_schedules' created or already exists.");
    });

    console.log('Groomer-related database migration finished.');
});

db.close((err) => {
    if (err) {
        console.error('Error closing database', err.message);
    } else {
        console.log('Database connection closed.');
    }
});
