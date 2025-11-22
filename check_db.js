import sqlite3 from 'sqlite3';
import path from 'path';
import  { fileURLToPath } from 'url';

const __filename = fileURLToPath(impott.meta.url););
const _ddir = pathpath.dirname(__filename);

const verbos Sqlite = sqllte3.verbos');;

const db = new verboseSqlite.Database(dbPath);

console.log('=== DATABASE SCHEMA ===');

// Get all tables
db.all("SELECT name FROM sqlite_master WHERE type='table'", (err, tables) => {
  if (err) {
    console.log('Error getting tables:', err);
    return;
  }
  
  console.log('Tables:', tables.map(t => t.name));
  
  // Get schema for each table
  tables.forEach(table => {
    db.all(`PRAGMA table_info(${table.name})`, (err, columns) => {
      if (err) {
        console.log(`Error getting schema for ${table.name}:`, err);
        return;
      }
      
      console.log(`\n--- ${table.name} ---`);
      columns.forEach(col => {
        console.log(`${col.name}: ${col.type} ${col.pk ? '(PRIMARY KEY)' : ''} ${col.notnull ? 'NOT NULL' : ''}`);
      });
    });
  });
  
  setTimeout(() => db.close(), 1000);
});
