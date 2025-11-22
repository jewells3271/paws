const sqlite3 = require('sqlite3').verbose();

const DB_FILE = 'grooming.db';

// --- Helper function to parse duration strings ---
// Handles formats like: (1 hr), (2.5 hr), +1 hr, +30 min
const parseDuration = (str) => {
    if (!str || str.trim() === '-') return 15; // Default for untimed services
    const cleaned = str.replace(/[()+$]/g, '').trim();
    
    const hrMatch = cleaned.match(/([\d\.]+)\s*hr/);
    if (hrMatch) {
        return parseFloat(hrMatch[1]) * 60;
    }

    const minMatch = cleaned.match(/([\d\.]+)\s*min/);
    if (minMatch) {
        return parseInt(minMatch[1], 10);
    }

    return 15; // fallback
};

// --- Main Seeding Function ---
const seedDatabase = async () => {
    const db = new sqlite3.Database(DB_FILE);

    try {
        let allServices = [];

        // --- DOGS - Full Packages ---
        const dogPackagesText = `
Small | Under 10 lbs | $45 (1 hr) | $65 (1 hr) | $85 (2 hr)
Medium | Up to 35 lbs | $55 (1 hr) | $80 (1.5 hr) | $100 (2 hr)
Large | Up to 65 lbs | $65 (1 hr) | $90 (2 hr) | $125 (2.5 hr)
X-Large | Over 65 lbs | $75 (1 hr) | $100 (2.5 hr) | $140 (3 hr)
        `;
        const dogServiceNames = ['Bath + Nails Only', 'Full Service Groom (Bath + Face/Feet/Fanny Trim)', 'Full Groom (All-Over Haircut)'];
        const dogPackageLines = dogPackagesText.trim().split('\n');

        for (const line of dogPackageLines) {
            const parts = line.split('|').map(p => p.trim());
            const size = parts[0];
            const description = parts[1];
            
            for (let i = 2; i < parts.length; i++) {
                const cell = parts[i];
                const priceMatch = cell.match(/\$(\d+)/);
                const price = priceMatch ? parseInt(priceMatch[1], 10) : 0;
                const duration = parseDuration(cell);
                
                allServices.push({
                    name: `${size} ${dogServiceNames[i-2]}`,
                    description: description,
                    price: price,
                    duration_minutes: duration,
                    animal_type: 'dog'
                });
            }
        }

        // --- DOGS - À La Carte Add-Ons ---
        const dogAlaCarteText = `
Nail Trim | $10 | -
Nail Filing | $10 | -
Face & Fanny Trim(eyes, visor trim, sanitary) | $15 | -
Skunk Treatment | +$65 | +1 hr
Flea Treatment(flea shampoo + spot-on) | +$25 | +30 min
        `;
        const dogAlaCarteLines = dogAlaCarteText.trim().split('\n');
        for (const line of dogAlaCarteLines) {
            const parts = line.split('|').map(p => p.trim());
            allServices.push({
                name: parts[0],
                description: '',
                price: parseInt(parts[1].replace(/[+$]/g, '')),
                duration_minutes: parseDuration(parts[2]),
                animal_type: 'unisex'
            });
        }

        // --- CATS ---
        allServices.push({ name: 'Shave Down', description: '', price: 115, duration_minutes: 60, animal_type: 'cat' });
        allServices.push({ name: 'Brush Out + Nails', description: '', price: 75, duration_minutes: 60, animal_type: 'cat' });
        allServices.push({ name: 'Bath (if possible)', description: '', price: 0, duration_minutes: 45, animal_type: 'cat' });
        allServices.push({ name: 'Nail Caps(includes trim)', description: 'includes trim', price: 25, duration_minutes: 30, animal_type: 'cat' });

        // --- Database Insertion ---
        await new Promise((resolve, reject) => {
            db.serialize(() => {
                db.run("BEGIN TRANSACTION;");
                db.run("DELETE FROM services;").run("DELETE FROM business_hours;");
                const serviceStmt = db.prepare("INSERT INTO services (name, description, price, duration_minutes, animal_type) VALUES (?, ?, ?, ?, ?)");
                allServices.forEach(s => serviceStmt.run(s.name, s.description, s.price, s.duration_minutes, s.animal_type));
                serviceStmt.finalize();
                const hoursStmt = db.prepare("INSERT INTO business_hours (day_of_week, open_time, close_time) VALUES (?, ?, ?)");
                for (let i = 1; i <= 5; i++) hoursStmt.run(i, '09:00', '17:00'); // Mon-Fri 9-5
                hoursStmt.finalize();
                db.run("COMMIT;", err => err ? reject(err) : resolve());
            });
        });
        console.log(`Successfully seeded ${allServices.length} services and default business hours.`);

        // --- Verification ---
        console.log('\n--- Database Verification ---');
        const serviceRows = await new Promise((resolve, reject) => db.all(`SELECT * FROM services ORDER BY animal_type, price, name`, (e,r) => e ? reject(e) : resolve(r)));
        console.table(serviceRows);
    } catch (error) {
        console.error('An error occurred during seeding:', error);
        db.run("ROLLBACK;");
    } finally {
        db.close();
        console.log('\nDatabase connection closed.');
    }
};

seedDatabase();