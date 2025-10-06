const pool = require('../database');

async function createNotificationsTable() {
  
  try {
    console.log('Creating notifications table...');
    const client = await pool.connect();
    
    await client.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT NOT NULL,
        title TEXT NOT NULL,
        message TEXT NOT NULL,
        type TEXT DEFAULT 'info',
        read_status INTEGER DEFAULT 0,
        action_url TEXT,
        metadata TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create index for faster queries
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id)
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_notifications_read_status ON notifications(read_status)
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at)
    `);

    client.release();

    console.log('✅ Notifications table created successfully');
    
  } catch (error) {
    console.error('❌ Error creating notifications table:', error);
    throw error;
  }
}

// Run migration if called directly
if (require.main === module) {
  createNotificationsTable()
    .then(() => {
      console.log('Migration completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration failed:', error);
      process.exit(1);
    });
}

module.exports = { createNotificationsTable };