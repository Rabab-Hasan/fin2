const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// Create database path
const dbPath = path.join(__dirname, '../data/finance_dashboard.db');
const dataDir = path.dirname(dbPath);

// Ensure data directory exists
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
  console.log('Created data directory');
}

console.log('Database path:', dbPath);

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err);
    process.exit(1);
  }
  console.log('Connected to SQLite database');
});

// Create reports table
const createReportsTable = `
  CREATE TABLE IF NOT EXISTS reports (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    report_date DATE UNIQUE NOT NULL,
    month_label TEXT,
    registered_onboarded INTEGER DEFAULT 0,
    linked_accounts INTEGER DEFAULT 0,
    total_advance_applications INTEGER DEFAULT 0,
    total_advance_applicants INTEGER DEFAULT 0,
    total_micro_financing_applications INTEGER DEFAULT 0,
    total_micro_financing_applicants INTEGER DEFAULT 0,
    total_personal_finance_application INTEGER DEFAULT 0,
    total_personal_finance_applicants INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`;

db.run(createReportsTable, (err) => {
  if (err) {
    console.error('Error creating reports table:', err);
  } else {
    console.log('✅ Reports table created successfully');
  }
  
  // Create columns_registry table
  const createColumnsTable = `
    CREATE TABLE IF NOT EXISTS columns_registry (
      key TEXT PRIMARY KEY,
      label TEXT NOT NULL,
      first_seen_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      last_seen_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      display_order INTEGER
    )
  `;
  
  db.run(createColumnsTable, (err) => {
    if (err) {
      console.error('Error creating columns_registry table:', err);
    } else {
      console.log('✅ Columns registry table created successfully');
    }
    
    // Create indexes
    db.run('CREATE INDEX IF NOT EXISTS idx_reports_date ON reports(report_date)', (err) => {
      if (err) {
        console.error('Error creating index:', err);
      } else {
        console.log('✅ Index created successfully');
      }
      
      console.log('🎉 Database setup complete!');
      db.close();
      process.exit(0);
    });
  });
});
