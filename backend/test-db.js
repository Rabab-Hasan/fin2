const pool = require('./src/database');

async function testConnection() {
  try {
    console.log('Testing database connection...');
    const client = await pool.connect();
    
    const result = await client.query('SELECT NOW() as current_time, version() as version');
    console.log('✅ Database connected successfully!');
    console.log('Current time:', result.rows[0].current_time);
    console.log('PostgreSQL version:', result.rows[0].version);
    
    // Test if tables exist
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('reports', 'columns_registry')
    `);
    
    const tables = tablesResult.rows.map(row => row.table_name);
    console.log('Tables found:', tables);
    
    if (tables.includes('reports') && tables.includes('columns_registry')) {
      console.log('✅ All required tables exist!');
    } else {
      console.log('⚠️  Some tables missing. Run: npm run migrate');
    }
    
    client.release();
    process.exit(0);
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    console.log('\nTroubleshooting:');
    console.log('1. Make sure PostgreSQL is running');
    console.log('2. Check your .env file database settings');
    console.log('3. Create the database: CREATE DATABASE finance_dashboard;');
    process.exit(1);
  }
}

testConnection();
