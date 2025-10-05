const db = require('../database-sqlite');

async function addClientToReports() {
  const client = await db.connect();
  
  try {
    // Add client_id column to reports table if it doesn't exist
    try {
      await client.query(`ALTER TABLE reports ADD COLUMN client_id TEXT`);
      console.log('Added client_id column to reports table');
    } catch (err) {
      if (err.message.includes('duplicate column name')) {
        console.log('client_id column already exists in reports table');
      } else {
        throw err;
      }
    }
    
    // Add client_id column to columns_registry table if it doesn't exist
    try {
      await client.query(`ALTER TABLE columns_registry ADD COLUMN client_id TEXT`);
      console.log('Added client_id column to columns_registry table');
    } catch (err) {
      if (err.message.includes('duplicate column name')) {
        console.log('client_id column already exists in columns_registry table');
      } else {
        throw err;
      }
    }
    
    // Create indexes
    await client.query('CREATE INDEX IF NOT EXISTS idx_reports_client_id ON reports(client_id)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_columns_registry_client_id ON columns_registry(client_id)');
    
    // Assign all existing reports to client "1"
    const reportsResult = await client.query('UPDATE reports SET client_id = ? WHERE client_id IS NULL', ['1']);
    console.log('Updated', reportsResult.changes, 'reports to belong to client 1');
    
    // Assign all existing column registry entries to client "1"
    const columnsResult = await client.query('UPDATE columns_registry SET client_id = ? WHERE client_id IS NULL', ['1']);
    console.log('Updated', columnsResult.changes, 'column registry entries to belong to client 1');
    
    console.log('Reports client support migration completed successfully');
  } catch (err) {
    console.error('Error in reports client support migration:', err);
    throw err;
  } finally {
    client.release();
  }
}

module.exports = { addClientToReports };