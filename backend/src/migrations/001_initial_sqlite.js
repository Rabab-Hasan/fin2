const db = require('../database-sqlite');

async function createTables() {
  const client = await db.connect();
  
  try {
    // Create reports table with individual columns to match the import service
    await client.query(`
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
    `);
    
    // Create columns_registry table
    await client.query(`
      CREATE TABLE IF NOT EXISTS columns_registry (
        key TEXT PRIMARY KEY,
        label TEXT NOT NULL,
        first_seen_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        last_seen_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        display_order INTEGER
      )
    `);
    
    // Create indexes
    await client.query('CREATE INDEX IF NOT EXISTS idx_reports_date ON reports(report_date)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_columns_order ON columns_registry(display_order)');
    
    console.log('SQLite database tables created successfully');
  } catch (err) {
    console.error('Error creating tables:', err);
    throw err;
  } finally {
    client.release();
  }
}

module.exports = { createTables };
