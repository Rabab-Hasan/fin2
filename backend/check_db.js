const pool = require('./src/database-sqlite');

async function checkDatabase() {
  const client = await pool.connect();
  
  try {
    console.log('=== CHECKING DATABASE SCHEMA ===');
    
    // Check table schema
    const schema = await client.query("PRAGMA table_info(reports)");
    console.log('Table columns:');
    schema.rows.forEach(col => {
      console.log(`- ${col.name} (${col.type})`);
    });
    
    console.log('\n=== CHECKING DATA ===');
    
    // Check if we have any data
    const count = await client.query("SELECT COUNT(*) as count FROM reports");
    console.log(`Total records: ${count.rows[0].count}`);
    
    if (count.rows[0].count > 0) {
      // Check a sample record
      const sample = await client.query("SELECT * FROM reports LIMIT 1");
      console.log('\nSample record:');
      console.log(JSON.stringify(sample.rows[0], null, 2));
      
      // Check specifically for BNPL columns
      const bnplCheck = await client.query(`
        SELECT report_date, 
               total_bnpl_applications, 
               total_bnpl_applicants,
               totalBnplApplication,
               totalBnplApplicants
        FROM reports 
        LIMIT 3
      `);
      console.log('\nBNPL Data check:');
      console.log(JSON.stringify(bnplCheck.rows, null, 2));
    }
    
  } catch (error) {
    console.error('Database check error:', error.message);
  } finally {
    client.release();
  }
}

checkDatabase();