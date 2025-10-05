const pool = require('../database');

async function createTables() {
  const client = await pool.connect();
  
  try {
    // Create extension for UUID generation
    await client.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
    
    // Create reports table
    await client.query(`
      CREATE TABLE IF NOT EXISTS reports (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        report_date DATE UNIQUE NOT NULL,
        month_label TEXT,
        data JSONB NOT NULL DEFAULT '{}',
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    
    // Create columns_registry table
    await client.query(`
      CREATE TABLE IF NOT EXISTS columns_registry (
        key TEXT PRIMARY KEY,
        label TEXT NOT NULL,
        first_seen_at TIMESTAMPTZ DEFAULT NOW(),
        last_seen_at TIMESTAMPTZ DEFAULT NOW(),
        display_order INTEGER
      )
    `);
    
    // Create indexes
    await client.query('CREATE INDEX IF NOT EXISTS idx_reports_date ON reports(report_date)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_reports_month ON reports USING GIN((data->\'month_label\'))');
    await client.query('CREATE INDEX IF NOT EXISTS idx_columns_order ON columns_registry(display_order)');
    
    console.log('Database tables created successfully');
  } catch (err) {
    console.error('Error creating tables:', err);
    throw err;
  } finally {
    client.release();
  }
}

module.exports = { createTables };
