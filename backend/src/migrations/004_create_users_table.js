const { Database } = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '../../data/finance_dashboard.db');

const createUsersTable = async () => {
  return new Promise((resolve, reject) => {
    const db = new Database(dbPath);
    
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        name TEXT NOT NULL,
        user_type TEXT DEFAULT 'employee' CHECK (user_type IN ('admin', 'employee', 'client')),
        association TEXT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `;

    db.run(createTableSQL, (err) => {
      if (err) {
        console.error('Error creating users table:', err);
        reject(err);
      } else {
        console.log('✓ Users table created successfully');
        resolve();
      }
      db.close();
    });
  });
};

module.exports = { createUsersTable };