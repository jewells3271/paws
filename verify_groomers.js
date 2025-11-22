const sqlite3 = require('sqlite3').verbose();
const DB_FILE = 'grooming.db';

// Promisify db.get and db.all for easier async/await usage
function dbGet(sql, params) {
    return new Promise((resolve, reject) => {
        db.get(sql, params, (err, row) => {
            if (err) reject(err);
            else resolve(row);
        });
    });
}

function dbAll(sql, params) {
    return new Promise((resolve, reject) => {
        db.all(sql, params, (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
        });
    });
}


const db = new sqlite3.Database(DB_FILE, sqlite3.OPEN_READONLY, (err) => {
    if (err) {
        console.error('Error opening database', err.message);
        process.exit(1);
    }
    console.log('Connected to the SQLite database for groomer verification.');
});

async function verifyGroomers() {
    try {
        console.log('\n--- Verifying Groomers ---');
        const groomers = await dbAll(`SELECT * FROM groomers ORDER BY name`);
        console.table(groomers);

        // Find Charlie's ID
        const charlie = groomers.find(g => g.name === 'Charlie');
        if (charlie) {
            console.log('\n--- Verifying Charlie\'s Schedule (Mon, Tue, Wed 09:00-17:00) ---');
            const charlieSchedule = await dbAll(
                `SELECT day_of_week, start_time, end_time FROM groomer_schedules WHERE groomer_id = ? ORDER BY day_of_week`,
                [charlie.id]
            );
            console.table(charlieSchedule);

            // Check for expected schedule (Monday, Tuesday, Wednesday 09:00-17:00)
            const expectedDays = [1, 2, 3]; // Mon, Tue, Wed
            const foundDays = charlieSchedule.map(s => s.day_of_week);
            
            const isScheduleCorrect = charlieSchedule.length === expectedDays.length &&
                                      expectedDays.every(day => foundDays.includes(day)) &&
                                      charlieSchedule.every(s => s.start_time === '09:00' && s.end_time === '17:00');
            
            if (isScheduleCorrect) {
                console.log('SUCCESS: Charlie\'s schedule matches the expected (Mon, Tue, Wed, 09:00-17:00).');
            } else {
                console.log('ERROR: Charlie\'s schedule does NOT match the expected (Mon, Tue, Wed, 09:00-17:00).');
                console.log('Expected days:', expectedDays, 'Found days:', foundDays);
                console.log('Full schedule:', charlieSchedule);
            }

        } else {
            console.log("Groomer 'Charlie' not found.");
        }

    } catch (error) {
        console.error('Error during groomer verification:', error.message);
    } finally {
        db.close((err) => {
            if (err) console.error('Error closing database', err.message);
            else console.log('\nDatabase connection closed after groomer verification.');
        });
    }
}

verifyGroomers();