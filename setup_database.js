import sqlite3 from 'sqlite3';
import bcrypt from 'bcrypt';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.join(__dirname, 'stock.db');

const verboseSqlite = sqlite3.verbose();
const db = new verboseSqlite.Database(dbPath);

async function setupDatabase() {
  return new Promise((resolve, reject) => {
    db.serialize(async () => {
      try {
        // Create users table if it doesn't exist
        db.run(`
          CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT UNIQUE NOT NULL,
            name TEXT NOT NULL,
            phone TEXT,
            password_hash TEXT NOT NULL,
            role TEXT DEFAULT 'user',
            verified INTEGER DEFAULT 0,
            verification_token TEXT,
            verification_token_expires TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
          )
        `);

        // Check if admin user already exists
        db.get('SELECT * FROM users WHERE email = ?', ['admin@stockmaster.com'], async (err, row) => {
          if (err) {
            reject(err);
            return;
          }

          if (row) {
            console.log('Admin user already exists');
            resolve();
            return;
          }

          // Create admin user
          const hashedPassword = await bcrypt.hash('admin123', 10);
          db.run(
            'INSERT INTO users (email, name, password_hash, role, verified) VALUES (?, ?, ?, ?, ?)',
            ['admin@stockmaster.com', 'Admin User', hashedPassword, 'admin', 1],
            function(err) {
              if (err) {
                reject(err);
                return;
              }
              console.log('Admin user created successfully with ID:', this.lastID);
              resolve();
            }
          );
        });
      } catch (error) {
        reject(error);
      }
    });
  });
}

setupDatabase()
  .then(() => {
    console.log('Database setup completed successfully');
    db.close();
  })
  .catch((error) => {
    console.error('Database setup failed:', error);
    db.close();
  });
