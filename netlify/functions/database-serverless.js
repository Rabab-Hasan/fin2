// Serverless-compatible database setup for Netlify Functions
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs-extra');

// For Netlify Functions, we need to handle database file location differently
const isDev = process.env.NODE_ENV !== 'production';
const isNetlifyFunction = process.env.NETLIFY_DEV || process.env.NETLIFY;

let dbPath;

if (isDev) {
  // Development: use local file
  dbPath = path.join(__dirname, '../../../backend/data/finance_dashboard.db');
} else if (isNetlifyFunction) {
  // Netlify Functions: use /tmp directory (writable in serverless)
  dbPath = '/tmp/finance_dashboard.db';
  
  // Copy initial database if it doesn't exist
  const initialDbPath = path.join(__dirname, '../../../backend/data/finance_dashboard.db');
  if (!fs.existsSync(dbPath) && fs.existsSync(initialDbPath)) {
    try {
      fs.copyFileSync(initialDbPath, dbPath);
      console.log('📊 Database copied to serverless environment');
    } catch (error) {
      console.warn('⚠️ Could not copy initial database, creating fresh:', error.message);
    }
  }
} else {
  // Fallback
  dbPath = path.join(__dirname, '../../../backend/data/finance_dashboard.db');
}

// Ensure directory exists
const dataDir = path.dirname(dbPath);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

console.log('📊 SQLite database path:', dbPath);

let db = null;

// Initialize database connection with retry logic
const initializeDB = () => {
  if (db) return db;
  
  try {
    db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        console.error('❌ Error opening database:', err);
      } else {
        console.log('✅ Connected to SQLite database');
        
        // Enable WAL mode for better concurrency
        db.run('PRAGMA journal_mode = WAL');
        db.run('PRAGMA synchronous = NORMAL');
        db.run('PRAGMA cache_size = 1000');
        db.run('PRAGMA temp_store = MEMORY');
      }
    });
    
    return db;
  } catch (error) {
    console.error('❌ Failed to initialize database:', error);
    throw error;
  }
};

// SQLite adapter to mimic PostgreSQL pool interface for serverless
const pool = {
  async connect() {
    const database = initializeDB();
    
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
            database.all(sqliteSQL, params, (err, rows) => {
              if (err) {
                console.error('SQLite query error:', err);
                reject(err);
              } else {
                resolve({ rows });
              }
            });
          } else {
            database.run(sqliteSQL, params, function(err) {
              if (err) {
                console.error('SQLite run error:', err);
                reject(err);
              } else {
                resolve({ rows: [], lastID: this.lastID, changes: this.changes });
              }
            });
          }
        });
      },
      release: () => {
        // In serverless, we keep the connection alive for the duration of the function
        // No need to close it immediately
      }
    };
  },
  
  // Graceful shutdown for serverless functions
  async close() {
    if (db) {
      return new Promise((resolve) => {
        db.close((err) => {
          if (err) {
            console.error('Error closing database:', err);
          } else {
            console.log('📊 Database connection closed');
          }
          db = null;
          resolve();
        });
      });
    }
  }
};

module.exports = pool;