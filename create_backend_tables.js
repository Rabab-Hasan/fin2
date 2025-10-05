const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Create database connection to the backend that's actually running
const dbPath = path.join('..', 'backend', 'src', 'database.db');
console.log('Creating tables in database:', dbPath);

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
    process.exit(1);
  }
  console.log('Connected to SQLite database.');
});

// Create clients table
const createClientsTable = `
  CREATE TABLE IF NOT EXISTS clients (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    company TEXT,
    status TEXT DEFAULT 'active',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`;

// Create reports table with all columns from the schema
const createReportsTable = `
  CREATE TABLE IF NOT EXISTS reports (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    report_date DATE NOT NULL,
    month_label TEXT NOT NULL,
    data TEXT,
    client_id TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
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
    FOREIGN KEY (client_id) REFERENCES clients(id)
  )
`;

// Execute table creation
db.serialize(() => {
  console.log('Creating clients table...');
  db.run(createClientsTable, (err) => {
    if (err) {
      console.error('Error creating clients table:', err.message);
    } else {
      console.log('✅ Clients table created successfully');
    }
  });

  console.log('Creating reports table...');
  db.run(createReportsTable, (err) => {
    if (err) {
      console.error('Error creating reports table:', err.message);
    } else {
      console.log('✅ Reports table created successfully');
    }
  });

  // Insert sample client data
  const insertClient = `
    INSERT OR IGNORE INTO clients (id, name, email, company) 
    VALUES ('ac22bb48-fee6-4c2d-9f43-f0ff37d299a5', 'Sample Client', 'client@example.com', 'Sample Company')
  `;
  
  db.run(insertClient, (err) => {
    if (err) {
      console.error('Error inserting sample client:', err.message);
    } else {
      console.log('✅ Sample client added');
    }
  });
});

db.close((err) => {
  if (err) {
    console.error('Error closing database:', err.message);
  } else {
    console.log('✅ Database tables created successfully');
    console.log('Database closed.');
  }
});