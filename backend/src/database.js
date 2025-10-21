// Prioritize MongoDB Atlas for production data
const useMongoAsPrimary = process.env.MONGODB_URI || process.env.NODE_ENV === 'production';

if (useMongoAsPrimary) {
  console.log('Using MongoDB Atlas as primary database');
  module.exports = require('./database-mongo');
} else {
  // Check if PostgreSQL is configured
  const usePostgres = process.env.DB_HOST && process.env.DB_HOST !== 'localhost' || 
                     process.env.DB_PASSWORD && process.env.DB_PASSWORD !== 'password';

  if (usePostgres) {
    // Use PostgreSQL
    const { Pool } = require('pg');
    
    const pool = new Pool({
      user: process.env.DB_USER || 'postgres',
      host: process.env.DB_HOST || 'localhost',
      database: process.env.DB_NAME || 'finance_dashboard',
      password: process.env.DB_PASSWORD || 'password',
      port: process.env.DB_PORT || 5432,
    });
    
    module.exports = pool;
  } else {
    // Use SQLite for development
    console.log('Using SQLite database for development');
    module.exports = require('./database-sqlite');
  }
}
