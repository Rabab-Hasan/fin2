const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'data', 'finance_dashboard.db');
const db = Database(dbPath);

console.log('=== Tasks Table Schema ===');
try {
  const result = db.prepare("PRAGMA table_info(tasks)").all();
  console.log('Columns in tasks table:');
  result.forEach((col, index) => {
    console.log(`${index + 1}. ${col.name} (${col.type}) ${col.notnull ? 'NOT NULL' : 'NULL'} ${col.pk ? 'PRIMARY KEY' : ''}`);
  });
} catch (error) {
  console.error('Error reading tasks schema:', error.message);
}

console.log('\n=== Check if priority column exists ===');
try {
  const columns = db.prepare("PRAGMA table_info(tasks)").all();
  const hasPriority = columns.some(col => col.name === 'priority');
  console.log('Has priority column:', hasPriority);
  
  if (!hasPriority) {
    console.log('\n=== Available columns ===');
    columns.forEach(col => console.log(`- ${col.name}`));
  }
} catch (error) {
  console.error('Error checking priority column:', error.message);
}

db.close();