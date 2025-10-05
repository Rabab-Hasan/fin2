const db = require('./database-sqlite');

async function createTasksTable() {
  try {
    const pool = await db.connect();
    
    // Create tasks table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS tasks (
          id TEXT PRIMARY KEY,
          title TEXT NOT NULL,
          description TEXT,
          status TEXT NOT NULL CHECK (status IN ('todo', 'in-progress', 'pending', 'completed')) DEFAULT 'todo',
          assignee TEXT,
          deadline TEXT,
          client_comments TEXT,
          action_labs_comments TEXT,
          link TEXT,
          parent_id TEXT,
          created_at TEXT NOT NULL DEFAULT (datetime('now')),
          updated_at TEXT NOT NULL DEFAULT (datetime('now')),
          FOREIGN KEY (parent_id) REFERENCES tasks(id) ON DELETE CASCADE
      )
    `);
    
    // Create indexes
    await pool.query('CREATE INDEX IF NOT EXISTS idx_tasks_parent_id ON tasks(parent_id)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_tasks_deadline ON tasks(deadline)');
    
    // Create trigger for updated_at
    await pool.query(`
      CREATE TRIGGER IF NOT EXISTS update_tasks_updated_at 
          AFTER UPDATE ON tasks
          FOR EACH ROW
      BEGIN
          UPDATE tasks SET updated_at = datetime('now') WHERE id = NEW.id;
      END
    `);
    
    console.log('Tasks table created successfully');
    pool.release();
  } catch (error) {
    console.error('Error creating tasks table:', error);
  }
}

createTasksTable();