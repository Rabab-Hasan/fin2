const bcrypt = require('bcryptjs');
const { Database } = require('sqlite3').verbose();
const path = require('path');

const sqliteDbPath = path.join(__dirname, 'data/finance_dashboard.db');

async function migrateUsersFromMongoToSQLite() {
  console.log('🔄 Starting user migration...');
  
  let sqliteDb;
  
  try {
    // Connect to SQLite
    sqliteDb = new Database(sqliteDbPath);
    console.log('✓ Connected to SQLite');

    console.log('No MongoDB connection, creating default admin user...');
    await createDefaultAdminUserInSQLite(sqliteDb);

    console.log('✅ User setup completed successfully!');

  } catch (error) {
    console.error('❌ Setup failed:', error);
  } finally {
    if (sqliteDb) {
      sqliteDb.close();
    }
  }
}

async function createDefaultAdminUser() {
  const sqliteDb = new Database(sqliteDbPath);
  await createDefaultAdminUserInSQLite(sqliteDb);
  sqliteDb.close();
}

async function createDefaultAdminUserInSQLite(sqliteDb) {
  return new Promise(async (resolve, reject) => {
    try {
      const hashedPassword = await bcrypt.hash('admin123', 10);
      
      sqliteDb.run(`
        INSERT OR REPLACE INTO users (email, password, name, user_type, association)
        VALUES (?, ?, ?, ?, ?)
      `, [
        'admin@example.com',
        hashedPassword,
        'Administrator',
        'admin',
        null
      ], function(err) {
        if (err) {
          console.error('❌ Error creating default admin user:', err);
          reject(err);
        } else {
          console.log('✓ Created default admin user (admin@example.com / admin123)');
          resolve();
        }
      });
    } catch (error) {
      reject(error);
    }
  });
}

// Run migration if this file is executed directly
if (require.main === module) {
  migrateUsersFromMongoToSQLite().then(() => {
    console.log('Migration script completed');
    process.exit(0);
  }).catch(error => {
    console.error('Migration script failed:', error);
    process.exit(1);
  });
}

module.exports = { migrateUsersFromMongoToSQLite };