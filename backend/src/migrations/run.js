const { createTables } = require('./001_initial');
const fs = require('fs');

async function runMigrations() {
  try {
    console.log('Running migrations...');
    
    // Check if using SQLite
    const usePostgres = process.env.DB_HOST && process.env.DB_HOST !== 'localhost' || 
                       process.env.DB_PASSWORD && process.env.DB_PASSWORD !== 'password';
    
    if (!usePostgres) {
      // Use SQLite migrations
      const { createTables: createTablesSQLite } = require('./001_initial_sqlite');
      await createTablesSQLite();
    } else {
      await createTables();
    }
    
    console.log('Migrations completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

runMigrations();
