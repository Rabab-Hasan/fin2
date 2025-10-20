// Serverless-compatible database setup for Netlify Functions
const isNetlify = process.env.NETLIFY || process.env.NETLIFY_DEV;

if (isNetlify) {
  // Use the serverless SQLite database for Netlify Functions
  console.log('🚀 Using SQLite database for Netlify Functions');
  module.exports = require('./database-serverless');
} else {
  // Use the original database logic for development
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
    module.exports = require('../../../backend/src/database-sqlite');
  }
}