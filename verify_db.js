
const sqlite3 = require('sqlite3').verbose();
const DB_FILE = 'grooming.db';

const db = new sqlite3.Database(DB_FILE, (err) => {
    if (err) {
        console.error('Error opening database', err.message);
        throw err;
    }
    console.log('Connected to the SQLite database for verification.');
});

db.serialize(() => {
    console.log('\n--- Verifying Services ---');
    db.all(`SELECT * FROM services ORDER BY animal_type, price`, [], (err, rows) => {
        if (err) {
            console.error('Error querying services', err.message);
            return;
        }
        console.log('Found', rows.length, 'services:');
        console.table(rows);
    });

    console.log('\n--- Verifying Business Hours ---');
    db.all(`SELECT * FROM business_hours ORDER BY day_of_week`, [], (err, rows) => {
        if (err) {
            console.error('Error querying business_hours', err.message);
            return;
        }
        console.log('Found', rows.length, 'business hour entries:');
        console.table(rows);
        
        // Close the database connection
        db.close((err) => {
            if (err) {
                console.error('Error closing database', err.message);
            } else {
                console.log('\nVerification complete. Database connection closed.');
            }
        });
    });
});
