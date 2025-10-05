const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Create database tables for SQLite
function createTables() {
  const dbPath = path.join(__dirname, '..', 'data', 'finance_dashboard.db');
  const db = new sqlite3.Database(dbPath);

  db.serialize(() => {
    // Create clients table
    db.run(`CREATE TABLE IF NOT EXISTS clients (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT,
      phone TEXT,
      company TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Create reports table
    db.run(`CREATE TABLE IF NOT EXISTS reports (
      id TEXT PRIMARY KEY,
      report_date DATE NOT NULL,
      month_label TEXT,
      data TEXT,
      client_id TEXT,
      registered_onboarded INTEGER DEFAULT 0,
      linked_accounts INTEGER DEFAULT 0,
      total_advance_applications INTEGER DEFAULT 0,
      total_advance_applicants INTEGER DEFAULT 0,
      total_micro_financing_applications INTEGER DEFAULT 0,
      total_micro_financing_applicants INTEGER DEFAULT 0,
      total_personal_finance_application INTEGER DEFAULT 0,
      total_personal_finance_applicants INTEGER DEFAULT 0,
      total_bnpl_applications INTEGER DEFAULT 0,
      total_bnpl_applicants INTEGER DEFAULT 0,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (client_id) REFERENCES clients (id)
    )`);

    // Insert sample client if not exists
    db.run(`INSERT OR IGNORE INTO clients (id, name, email, company) VALUES 
      ('ac22bb48-fee6-4c2d-9f43-f0ff37d299a5', 'Sample Client', 'client@example.com', 'Sample Company')`);

    console.log('✅ Database tables created successfully');
  });

  db.close();
}

module.exports = { createTables };

// Run if called directly
if (require.main === module) {
  createTables();
}