const db = require('../database-sqlite');
const fs = require('fs');
const path = require('path');

async function addClientSupport() {
  const client = await db.connect();
  
  try {
    // Add client_id column to tasks table if it doesn't exist
    try {
      await client.query(`ALTER TABLE tasks ADD COLUMN client_id TEXT`);
      console.log('Added client_id column to tasks table');
    } catch (err) {
      if (err.message.includes('duplicate column name')) {
        console.log('client_id column already exists in tasks table');
      } else {
        throw err;
      }
    }
    
    // Create clients table
    await client.query(`
      CREATE TABLE IF NOT EXISTS clients (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT,
        phone TEXT,
        company TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      )
    `);
    
    // Create indexes
    await client.query('CREATE INDEX IF NOT EXISTS idx_tasks_client_id ON tasks(client_id)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_clients_name ON clients(name)');
    
    // Create trigger for clients updated_at
    await client.query(`
      CREATE TRIGGER IF NOT EXISTS update_clients_updated_at 
        AFTER UPDATE ON clients
        FOR EACH ROW
      BEGIN
        UPDATE clients SET updated_at = datetime('now') WHERE id = NEW.id;
      END
    `);
    
    // Insert sample clients if none exist
    const existingClients = await client.query('SELECT COUNT(*) as count FROM clients');
    if (existingClients.rows[0].count === 0) {
      await client.query(`
        INSERT INTO clients (id, name, email, phone, company) VALUES 
        ('1', 'ONE', 'contact@oneapp.com', '+1-555-0123', 'ONEAPP'),
        ('2', 'TechStart Inc', 'hello@techstart.com', '+1-555-0456', 'TechStart Inc')
      `);
      console.log('Inserted sample clients');
    }
    
    console.log('Client support migration completed successfully');
  } catch (err) {
    console.error('Error in client support migration:', err);
    throw err;
  } finally {
    client.release();
  }
}

module.exports = { addClientSupport };