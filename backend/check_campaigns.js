const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'data/finance_dashboard.db');
console.log('=== CHECKING CAMPAIGNS TABLE ===');
console.log('Database path:', dbPath);

const db = new sqlite3.Database(dbPath);

// Get all table names
db.all("SELECT name FROM sqlite_master WHERE type='table'", (err, tables) => {
  if (err) {
    console.error('Error getting tables:', err);
    db.close();
    return;
  }
  
  console.log('\nAll tables in database:');
  tables.forEach(table => console.log(`- ${table.name}`));
  
  // Check specifically for campaigns
  const campaignsTable = tables.find(t => t.name === 'campaigns');
  if (campaignsTable) {
    console.log('\n=== CAMPAIGNS TABLE FOUND ===');
    
    // Get table structure
    db.all("PRAGMA table_info(campaigns)", (err, columns) => {
      if (err) {
        console.error('Error getting table info:', err);
      } else {
        console.log('\nCampaigns table columns:');
        columns.forEach(col => {
          console.log(`- ${col.name}: ${col.type} ${col.notnull ? '(NOT NULL)' : ''}`);
        });
        
        // Check for data
        db.get("SELECT COUNT(*) as count FROM campaigns", (err, result) => {
          if (err) {
            console.error('Error counting campaigns:', err);
          } else {
            console.log(`\nTotal campaigns: ${result.count}`);
          }
          db.close();
        });
      }
    });
  } else {
    console.log('\n❌ CAMPAIGNS TABLE NOT FOUND');
    db.close();
  }
});