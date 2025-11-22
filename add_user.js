import sqlite3 from 'sqlite3';
import bcrypt from 'bcrypt';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.join(__dirname, 'stock.db');

const verboseSqlite = sqlite3.verbose();
const db = new verboseSqlite.Database(dbPath);

async function addNewUser() {
  return new Promise(async (resolve, reject) => {
    try {
      const email = 'kevaldoshi34223@gmail.com';
      const password = 'admin123';
      const name = 'Keval Doshi';
      const hashedPassword = await bcrypt.hash(password, 10);

      // Check if user already exists
      db.get('SELECT * FROM users WHERE email = ?', [email], (err, row) => {
        if (err) {
          reject(err);
          return;
        }

        if (row) {
          console.log('User already exists with email:', email);
          resolve();
          return;
        }

        // Create new user
        db.run(
          'INSERT INTO users (email, name, password_hash, role, verified) VALUES (?, ?, ?, ?, ?)',
          [email, name, hashedPassword, 'admin', 1],
          function(err) {
            if (err) {
              reject(err);
              return;
            }
            console.log('User created successfully with ID:', this.lastID);
            console.log('Email:', email);
            console.log('Password:', password);
            resolve();
          }
        );
      });
    } catch (error) {
      reject(error);
    }
  });
}

addNewUser()
  .then(() => {
    console.log('User addition completed successfully');
    db.close();
  })
  .catch((error) => {
    console.error('User addition failed:', error);
    db.close();
  });
