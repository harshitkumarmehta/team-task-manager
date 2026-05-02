const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const dbPath = path.resolve(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath);

// Enable foreign keys
db.run('PRAGMA foreign_keys = ON');

// Helper to run queries as promises (compatible with pg's db.query)
const query = (text, params = []) => {
  // Convert Postgres style placeholders ($1, $2) to SQLite style (?)
  const sqliteText = text.replace(/\$\d+/g, '?');

  return new Promise((resolve, reject) => {
    const isSelect = sqliteText.trim().toUpperCase().startsWith('SELECT');
    const hasReturning = sqliteText.toUpperCase().includes('RETURNING');

    if (isSelect || hasReturning) {
      db.all(sqliteText, params, (err, rows) => {
        if (err) reject(err);
        else resolve({ rows });
      });
    } else {
      db.run(sqliteText, params, function(err) {
        if (err) reject(err);
        else {
          // For INSERT/UPDATE/DELETE, we return the rows if possible, or just the changes
          // pg uses RETURNING, but for sqlite we might need to fetch the last inserted row
          // For now, let's just return empty rows if it's not a SELECT,
          // but if it's an INSERT with RETURNING, we'll try to emulate it.
          if (sqliteText.toUpperCase().includes('RETURNING')) {
             // Basic emulation of RETURNING * by fetching the last row or the row by id
             // This is a bit complex for a generic wrapper, so we'll handle specific cases in controllers if needed
             // but let's try a simple approach for common patterns.
             const lastID = this.lastID;
             const tableName = sqliteText.match(/INSERT INTO (\w+)/i)?.[1] || 
                               sqliteText.match(/UPDATE (\w+)/i)?.[1];
             
             if (tableName) {
                db.all(`SELECT * FROM ${tableName} WHERE id = ?`, [lastID || params[params.length-1]], (err, rows) => {
                  if (err) resolve({ rows: [] });
                  else resolve({ rows });
                });
                return;
             }
          }
          resolve({ rows: [], lastID: this.lastID, changes: this.changes });
        }
      });
    }
  });
};

// Initialize schema if needed
const initSchema = () => {
  const schema = `
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'member',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS projects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS project_members (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE(project_id, user_id)
    );

    CREATE TABLE IF NOT EXISTS tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
      assigned_to INTEGER REFERENCES users(id) ON DELETE SET NULL,
      created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
      priority TEXT DEFAULT 'medium',
      status TEXT DEFAULT 'todo',
      due_date TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `;
  
  db.serialize(() => {
    schema.split(';').forEach(s => {
      if (s.trim()) db.run(s);
    });
  });
};

initSchema();

console.log('Using SQLite database at', dbPath);

module.exports = { query };
