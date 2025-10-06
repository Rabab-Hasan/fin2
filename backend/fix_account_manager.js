const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Create SQLite database for development  
const dbPath = path.join(__dirname, 'data/finance_dashboard.db');
const db = new sqlite3.Database(dbPath);

console.log('Starting SQLite migration to fix account_manager_id...');

db.serialize(() => {
  // Check if campaigns table exists and has data
  db.get("SELECT count(*) as count FROM sqlite_master WHERE type='table' AND name='campaigns'", (err, row) => {
    if (err) {
      console.error('Error checking campaigns table:', err);
      return;
    }
    
    if (row.count === 0) {
      console.log('No campaigns table found, skipping migration');
      db.close();
      return;
    }

    // Create new campaigns table with TEXT account_manager_id
    db.run(`
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
        account_manager_id TEXT,
        activities TEXT DEFAULT '[]',
        internal_approval_required INTEGER DEFAULT 0,
        client_approval_required INTEGER DEFAULT 0,
        ai_validation_passed INTEGER DEFAULT 0,
        ai_validation_feedback TEXT,
        status TEXT DEFAULT 'draft',
        client_id INTEGER,
        created_by INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `, (err) => {
      if (err) {
        console.error('Error creating new campaigns table:', err);
        return;
      }

      // Copy existing data if any exists
      db.get("SELECT count(*) as count FROM campaigns", (err, row) => {
        if (err) {
          console.error('Error checking campaigns data:', err);
          return;
        }

        if (row.count > 0) {
          console.log(`Found ${row.count} existing campaigns, copying data...`);
          db.run(`
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
          `, (err) => {
            if (err) {
              console.error('Error copying campaigns data:', err);
              return;
            }
            completeReplacement();
          });
        } else {
          console.log('No existing campaigns data to copy');
          completeReplacement();
        }
      });
    });

    function completeReplacement() {
      // Drop old table and rename new one
      db.run('DROP TABLE campaigns', (err) => {
        if (err) {
          console.error('Error dropping old campaigns table:', err);
          return;
        }

        db.run('ALTER TABLE campaigns_new RENAME TO campaigns', (err) => {
          if (err) {
            console.error('Error renaming new campaigns table:', err);
            return;
          }

          console.log('Migration completed successfully! account_manager_id is now TEXT type');
          db.close();
        });
      });
    }
  });
});