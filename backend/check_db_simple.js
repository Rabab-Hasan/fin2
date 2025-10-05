const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'data/finance_dashboard.db');
const db = new sqlite3.Database(dbPath);

console.log('=== CHECKING DATABASE SCHEMA ===');

db.all("PRAGMA table_info(reports)", (err, rows) => {
  if (err) {
    console.error('Schema error:', err);
    return;
  }
  
  console.log('Table columns:');
  rows.forEach(col => {
    console.log(`- ${col.name} (${col.type})`);
  });
  
  console.log('\n=== CHECKING DATA COUNT ===');
  
  db.get("SELECT COUNT(*) as count FROM reports", (err, row) => {
    if (err) {
      console.error('Count error:', err);
      return;
    }
    
    console.log(`Total records: ${row.count}`);
    
    if (row.count > 0) {
      console.log('\n=== SAMPLE RECORD ===');
      db.get("SELECT * FROM reports LIMIT 1", (err, record) => {
        if (err) {
          console.error('Sample error:', err);
          return;
        }
        
        console.log('Sample record keys:');
        Object.keys(record).forEach(key => {
          console.log(`- ${key}: ${record[key]}`);
        });
        
        console.log('\n=== BNPL SPECIFIC CHECK ===');
        db.all(`
          SELECT report_date, 
                 total_bnpl_applications, 
                 total_bnpl_applicants
          FROM reports 
          LIMIT 3
        `, (err, bnplRows) => {
          if (err) {
            console.error('BNPL check error:', err);
          } else {
            console.log('BNPL data:');
            bnplRows.forEach((row, i) => {
              console.log(`Row ${i + 1}:`, {
                date: row.report_date,
                applications: row.total_bnpl_applications,
                applicants: row.total_bnpl_applicants
              });
            });
          }
          
          db.close();
        });
      });
    } else {
      db.close();
    }
  });
});