const sqlite3 = require('sqlite3').verbose();
const DB_FILE = 'grooming.db';

const db = new sqlite3.Database(DB_FILE, (err) => {
    if (err) {
        console.error('Error opening database', err.message);
        process.exit(1);
    } else {
        console.log('Successfully connected to the database.');
    }
});

// Create email_config table
const createEmailConfigTable = `
CREATE TABLE IF NOT EXISTS email_config (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    provider TEXT NOT NULL DEFAULT 'gmail',
    email TEXT,
    password TEXT,
    smtp_host TEXT,
    smtp_port INTEGER,
    shop_name TEXT,
    shop_phone TEXT,
    enabled INTEGER DEFAULT 0,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
)`;

db.run(createEmailConfigTable, (err) => {
    if (err) {
        console.error('Error creating email_config table:', err.message);
    } else {
        console.log('✓ email_config table created successfully');
        
        // Insert default row
        const insertDefault = `
        INSERT OR IGNORE INTO email_config (id, provider, enabled)
        VALUES (1, 'gmail', 0)`;
        
        db.run(insertDefault, (err) => {
            if (err) {
                console.error('Error inserting default config:', err.message);
            } else {
                console.log('✓ Default email config inserted');
            }
            
            db.close((err) => {
                if (err) {
                    console.error('Error closing database:', err.message);
                } else {
                    console.log('\n✅ Email configuration table added successfully!');
                    console.log('You can now configure email settings in the admin panel.');
                }
            });
        });
    }
});
