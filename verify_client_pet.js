
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
        throw err;
    }
    console.log('Connected to the SQLite database for verification.');
});

async function verify() {
    try {
        console.log('\n--- Verifying Pet: Rover (PIN: 83111) ---');
        const pet = await dbGet(`SELECT * FROM pets WHERE name = ? AND pin = ?`, ['Rover', '83111']);
        
        if (pet) {
            console.log(pet);
            const petId = pet.id;

            if (pet.client_id === 4) { // Alice Smith's ID from previous verification
                 console.log('SUCCESS: Pet "Rover" is correctly linked to Client ID 4 (Alice Smith).');
            } else {
                 console.log(`ERROR: Pet "Rover" is linked to the wrong client ID: ${pet.client_id}`);
            }

            if (pet.animal_type === 'dog') {
                console.log('SUCCESS: Pet "Rover" is correctly identified as a "dog".');
            } else {
                console.log(`ERROR: Pet "Rover" is identified as "${pet.animal_type}" instead of "dog".`);
            }

            console.log('\n--- Verifying Services for Rover ---');
            const sql = `
                SELECT s.name, s.price FROM pet_service_eligibility pse
                JOIN services s ON pse.service_id = s.id
                WHERE pse.pet_id = ?
            `;
            const services = await dbAll(sql, [petId]);
            console.log('Rover\'s eligible services:', services);
        } else {
            console.log('Pet "Rover" (PIN: 83111) not found.');
        }

    } catch (error) {
        console.error('Error during verification:', error.message);
    } finally {
        db.close((err) => {
            if (err) console.error('Error closing database', err.message);
            else console.log('\nDatabase connection closed after verification.');
        });
    }
}

verify();
