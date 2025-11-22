
const sqlite3 = require('sqlite3').verbose();
const DB_FILE = 'grooming.db';

const db = new sqlite3.Database(DB_FILE, sqlite3.OPEN_READONLY, (err) => {
    if (err) { console.error(err.message); throw err; }
    console.log('Connected to the SQLite database for inspection.');
});

db.serialize(() => {
    console.log('\n--- All Clients ---');
    db.all(`SELECT * FROM clients`, [], (err, rows) => {
        if (err) { console.error(err.message); return; }
        console.table(rows);
    });

    console.log('\n--- All Pets ---');
    db.all(`SELECT * FROM pets`, [], (err, rows) => {
        if (err) { console.error(err.message); return; }
        console.table(rows);
    });

    db.close((err) => {
        if (err) console.error('Error closing database', err.message);
        else console.log('\nInspection complete.');
    });
});

