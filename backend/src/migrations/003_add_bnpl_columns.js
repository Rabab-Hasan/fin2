const db = require('../database-sqlite');

async function addBnplColumns() {
  const client = await db.connect();
  
  try {
    // Check if columns already exist by querying table info
    const tableInfoQuery = "PRAGMA table_info(reports)";
    const tableInfo = await client.query(tableInfoQuery);
    
    // Extract column names - SQLite PRAGMA returns objects with 'name' property
    const columnNames = tableInfo.map ? tableInfo.map(row => row.name) : [];
    
    if (!columnNames.includes('total_bnpl_applications')) {
      await client.query(`
        ALTER TABLE reports 
        ADD COLUMN total_bnpl_applications INTEGER DEFAULT 0
      `);
      console.log('Added total_bnpl_applications column');
    } else {
      console.log('total_bnpl_applications column already exists');
    }
    
    if (!columnNames.includes('total_bnpl_applicants')) {
      await client.query(`
        ALTER TABLE reports 
        ADD COLUMN total_bnpl_applicants INTEGER DEFAULT 0
      `);
      console.log('Added total_bnpl_applicants column');
    } else {
      console.log('total_bnpl_applicants column already exists');
    }
    
    console.log('BNPL columns verified/added successfully');
    
  } catch (err) {
    console.error('Error checking BNPL columns:', err);
    console.log('BNPL columns might already exist - this is fine');
  } finally {
    client.release();
  }
}

module.exports = { addBnplColumns };