
const sqlite3 = require('sqlite3').verbose();
const DB_FILE = 'grooming.db';

// Promisify db.run for easier async/await usage
function dbRun(sql, params) {
    return new Promise((resolve, reject) => {
        db.run(sql, params, function(err) {
            if (err) reject(err);
            else resolve(this);
        });
    });
}

// Promisify db.get for easier async/await usage
function dbGet(sql, params) {
    return new Promise((resolve, reject) => {
        db.get(sql, params, (err, row) => {
            if (err) reject(err);
            else resolve(row);
        });
    });
}


const db = new sqlite3.Database(DB_FILE, (err) => {
    if (err) {
        console.error('Error opening database', err.message);
        process.exit(1);
    }
    console.log('Connected to the SQLite database for seeding groomers.');
});

async function seedGroomers() {
    console.log('Seeding initial groomer and schedule data...');

    try {
        // Insert groomer "Charlie"
        let groomerResult = await dbRun(`INSERT OR IGNORE INTO groomers (name) VALUES (?)`, ['Charlie']);
        let groomerId = groomerResult.lastID;

        // If no new groomer was inserted (lastID is 0), it means Charlie already exists, so fetch his ID
        if (groomerId === 0) {
            const existingGroomer = await dbGet(`SELECT id FROM groomers WHERE name = ?`, ['Charlie']);
            groomerId = existingGroomer.id;
        }
        
        console.log(`Groomer 'Charlie' inserted with ID: ${groomerId} (or already exists).`);

        // Clear existing schedule for Charlie
        await dbRun(`DELETE FROM groomer_schedules WHERE groomer_id = ?`, [groomerId]);
        console.log(`Cleared existing schedule for groomer ID ${groomerId}.`);

        // Add default schedule for Charlie (Mon-Fri, 9-5)
        const insertScheduleSql = `INSERT INTO groomer_schedules (groomer_id, day_of_week, start_time, end_time) VALUES (?, ?, ?, ?)`;
        for (let i = 1; i <= 5; i++) { // Monday (1) to Friday (5)
            await dbRun(insertScheduleSql, [groomerId, i, '09:00', '17:00']);
        }
        console.log('Default schedule for Charlie added.');

        console.log('Initial groomer seeding finished successfully.');
    } catch (error) {
        console.error('Error during groomer seeding:', error.message);
    } finally {
        db.close((err) => {
            if (err) console.error('Error closing database', err.message);
            else console.log('Database connection closed.');
        });
    }
}

seedGroomers();
