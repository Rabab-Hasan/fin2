const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'finance_dashboard',
  password: process.env.DB_PASSWORD || 'password',
  port: process.env.DB_PORT || 5432,
});

async function up() {
  const client = await pool.connect();
  try {
    console.log('Starting migration 007_fix_account_manager_id...');

    // For SQLite, we need to recreate the table since ALTER COLUMN isn't fully supported
    // First, check if we're using SQLite
    const dbType = process.env.DB_TYPE || 'sqlite';
    
    if (dbType === 'sqlite') {
      // SQLite approach: recreate table with TEXT column
      await client.query(`
        CREATE TABLE campaigns_new (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          type TEXT NOT NULL DEFAULT 'marketing',
          budget REAL DEFAULT 0,
          product_service TEXT,
          objective TEXT,
          narrative TEXT,
          concept TEXT,
          tagline TEXT,
          hero_artwork TEXT,
          account_manager_id TEXT,  -- Changed from INTEGER to TEXT
          activities TEXT DEFAULT '[]',
          internal_approval_required INTEGER DEFAULT 0,
          client_approval_required INTEGER DEFAULT 0,
          ai_validation_passed INTEGER DEFAULT 0,
          ai_validation_feedback TEXT,
          status TEXT DEFAULT 'draft',
          client_id INTEGER,
          created_by INTEGER,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (client_id) REFERENCES clients(id),
          FOREIGN KEY (created_by) REFERENCES users(id)
        )
      `);

      // Copy existing data
      await client.query(`
        INSERT INTO campaigns_new (
          id, name, type, budget, product_service, objective, narrative, concept,
          tagline, hero_artwork, account_manager_id, activities,
          internal_approval_required, client_approval_required,
          ai_validation_passed, ai_validation_feedback, status,
          client_id, created_by, created_at, updated_at
        )
        SELECT 
          id, name, type, budget, product_service, objective, narrative, concept,
          tagline, hero_artwork, CAST(account_manager_id AS TEXT), activities,
          internal_approval_required, client_approval_required,
          ai_validation_passed, ai_validation_feedback, status,
          client_id, created_by, created_at, updated_at
        FROM campaigns
      `);

      // Drop old table and rename new one
      await client.query('DROP TABLE campaigns');
      await client.query('ALTER TABLE campaigns_new RENAME TO campaigns');

    } else {
      // PostgreSQL approach
      await client.query(`
        ALTER TABLE campaigns 
        ALTER COLUMN account_manager_id TYPE TEXT
      `);
    }

    console.log('Migration 007_fix_account_manager_id completed successfully');
  } catch (error) {
    console.error('Migration 007_fix_account_manager_id failed:', error);
    throw error;
  } finally {
    client.release();
  }
}

async function down() {
  const client = await pool.connect();
  try {
    console.log('Rolling back migration 007_fix_account_manager_id...');
    
    const dbType = process.env.DB_TYPE || 'sqlite';
    
    if (dbType === 'sqlite') {
      // Recreate with INTEGER column (reverse)
      await client.query(`
        CREATE TABLE campaigns_new (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          type TEXT NOT NULL DEFAULT 'marketing',
          budget REAL DEFAULT 0,
          product_service TEXT,
          objective TEXT,
          narrative TEXT,
          concept TEXT,
          tagline TEXT,
          hero_artwork TEXT,
          account_manager_id INTEGER,  -- Back to INTEGER
          activities TEXT DEFAULT '[]',
          internal_approval_required INTEGER DEFAULT 0,
          client_approval_required INTEGER DEFAULT 0,
          ai_validation_passed INTEGER DEFAULT 0,
          ai_validation_feedback TEXT,
          status TEXT DEFAULT 'draft',
          client_id INTEGER,
          created_by INTEGER,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (client_id) REFERENCES clients(id),
          FOREIGN KEY (created_by) REFERENCES users(id),
          FOREIGN KEY (account_manager_id) REFERENCES users(id)
        )
      `);

      // Copy data back (this might lose data for invalid integers)
      await client.query(`
        INSERT INTO campaigns_new (
          id, name, type, budget, product_service, objective, narrative, concept,
          tagline, hero_artwork, account_manager_id, activities,
          internal_approval_required, client_approval_required,
          ai_validation_passed, ai_validation_feedback, status,
          client_id, created_by, created_at, updated_at
        )
        SELECT 
          id, name, type, budget, product_service, objective, narrative, concept,
          tagline, hero_artwork, CASE WHEN account_manager_id GLOB '[0-9]*' THEN CAST(account_manager_id AS INTEGER) ELSE NULL END, activities,
          internal_approval_required, client_approval_required,
          ai_validation_passed, ai_validation_feedback, status,
          client_id, created_by, created_at, updated_at
        FROM campaigns
      `);

      await client.query('DROP TABLE campaigns');
      await client.query('ALTER TABLE campaigns_new RENAME TO campaigns');
    } else {
      await client.query(`
        ALTER TABLE campaigns 
        ALTER COLUMN account_manager_id TYPE INTEGER USING account_manager_id::INTEGER
      `);
    }

    console.log('Rollback of migration 007_fix_account_manager_id completed');
  } catch (error) {
    console.error('Rollback of migration 007_fix_account_manager_id failed:', error);
    throw error;
  } finally {
    client.release();
  }
}

module.exports = { up, down };