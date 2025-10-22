const { getDb } = require('./src/database-mongo');

(async () => {
  try {
    console.log('🔍 Checking clients in database...');
    
    const db = await getDb();
    const clients = await db.collection('clients').find({}).toArray();
    
    console.log(`\n📊 Total clients found: ${clients.length}`);
    console.log('=====================================');
    
    clients.forEach((client, index) => {
      console.log(`\nClient ${index + 1}:`);
      console.log(`  ID: ${client._id}`);
      console.log(`  Name: ${client.name}`);
      console.log(`  Email: ${client.email || 'N/A'}`);
      console.log(`  Created: ${client.created_at || 'N/A'}`);
      console.log(`  Status: ${client.status || 'N/A'}`);
    });
    
    console.log('\n=====================================');
    console.log('✅ Client check complete');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error checking clients:', error);
    process.exit(1);
  }
})();