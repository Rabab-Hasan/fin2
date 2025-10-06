const db = require('../database-sqlite');

async function addVisibilityColumn() {
  try {
    const pool = await db.connect();
    
    // Add visible_to_client column (defaults to true for existing tasks)
    await pool.query(`
      ALTER TABLE tasks 
      ADD COLUMN visible_to_client INTEGER DEFAULT 1 CHECK (visible_to_client IN (0, 1))
    `);
    
    // Create index for the new column
    await pool.query('CREATE INDEX IF NOT EXISTS idx_tasks_visible_to_client ON tasks(visible_to_client)');
    
    console.log('✅ Added visible_to_client column to tasks table');
    pool.release();
  } catch (error) {
    console.error('Error adding visibility column:', error);
    // Column might already exist - check and continue
    if (error.message.includes('duplicate column name')) {
      console.log('👍 visible_to_client column already exists');
    } else {
      throw error;
    }
  }
}

// Run migration if called directly
if (require.main === module) {
  addVisibilityColumn();
}

module.exports = addVisibilityColumn;