const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Create SQLite database for development
const dbPath = path.join(__dirname, '../data/finance_dashboard.db');
const fs = require('fs');
const dataDir = path.dirname(dbPath);

// Ensure data directory exists
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new sqlite3.Database(dbPath);

// SQLite adapter to mimic PostgreSQL pool interface
const pool = {
  async connect() {
    return {
      query: (sql, params = []) => {
        return new Promise((resolve, reject) => {
          // Convert PostgreSQL-style $1, $2 to SQLite ? placeholders
          let sqliteSQL = sql;
          if (params && params.length > 0) {
            for (let i = params.length; i >= 1; i--) {
              sqliteSQL = sqliteSQL.replace(new RegExp(`\\$${i}`, 'g'), '?');
            }
          }
          
          // Handle different query types
          if (sqliteSQL.toLowerCase().includes('select') || sqliteSQL.toLowerCase().includes('returning')) {
            db.all(sqliteSQL, params, (err, rows) => {
              if (err) {
                reject(err);
              } else {
                resolve({ rows });
              }
            });
          } else {
            db.run(sqliteSQL, params, function(err) {
              if (err) {
                reject(err);
              } else {
                resolve({ rows: [], lastID: this.lastID, changes: this.changes });
              }
            });
          }
        });
      },
      release: () => {} // No-op for SQLite
    };
  }
};

module.exports = pool;
