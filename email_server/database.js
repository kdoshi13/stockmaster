// d:\Users\HollowME\Desktop\StockMaster\email_server\database.js
import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

// Since we are using ES Modules, __dirname is not available directly.
// We can create it to construct a reliable path to the database.
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// The database file is one directory level up from the current 'email_server' directory.
const dbPath = path.join(__dirname, '..', 'stock.db');

const verboseSqlite = sqlite3.verbose();

export const db = new verboseSqlite.Database(dbPath, (err) => {
  if (err) {
    console.error('Error connecting to the database:', err.message);
  } else {
    console.log('Successfully connected to the stock.db database.');
  }
});
