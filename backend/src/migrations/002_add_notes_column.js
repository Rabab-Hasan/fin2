const db = require('../database-sqlite');

async function addNotesColumn() {
  const client = await db.connect();
  
  try {
    // Add notes column to reports table
    await client.query(`
      ALTER TABLE reports ADD COLUMN notes TEXT DEFAULT ''
    `);
    
    console.log('Notes column added to reports table successfully');
  } catch (err) {
    // Column might already exist, ignore error
    if (err.message && err.message.includes('duplicate column name')) {
      console.log('Notes column already exists');
    } else {
      console.error('Error adding notes column:', err);
      throw err;
    }
  } finally {
    client.release();
  }
}

module.exports = { addNotesColumn };
