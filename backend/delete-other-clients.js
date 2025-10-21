const { MongoClient } = require('mongodb');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || process.env.DATABASE_URL;

async function deleteOtherClients() {
  let client;
  
  try {
    console.log('🔗 Connecting to MongoDB...');
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    
    const db = client.db();
    const clientsCollection = db.collection('clients');
    
    // First, let's see what clients exist
    console.log('📋 Current clients in database:');
    const allClients = await clientsCollection.find({}).toArray();
    
    if (allClients.length === 0) {
      console.log('❌ No clients found in database');
      return;
    }
    
    allClients.forEach((client, index) => {
      console.log(`${index + 1}. ID: ${client._id || client.id}, Name: "${client.name}", Email: ${client.email || 'N/A'}`);
    });
    
    // Find the client named "one" (case insensitive)
    const keepClient = allClients.find(client => 
      client.name && client.name.toLowerCase() === 'one'
    );
    
    if (!keepClient) {
      console.log('❌ No client with name "one" found. Available clients:');
      allClients.forEach(client => {
        console.log(`   - "${client.name}"`);
      });
      return;
    }
    
    console.log(`✅ Found client to keep: "${keepClient.name}" (ID: ${keepClient._id || keepClient.id})`);
    
    // Get clients to delete (all except "one")
    const clientsToDelete = allClients.filter(client => 
      !client.name || client.name.toLowerCase() !== 'one'
    );
    
    if (clientsToDelete.length === 0) {
      console.log('✅ No other clients to delete. Only "one" exists.');
      return;
    }
    
    console.log(`⚠️  Will delete ${clientsToDelete.length} clients:`);
    clientsToDelete.forEach(client => {
      console.log(`   - "${client.name}" (ID: ${client._id || client.id})`);
    });
    
    // Delete the clients
    const clientIdsToDelete = clientsToDelete.map(client => client._id || client.id);
    
    console.log('🗑️  Deleting clients...');
    const deleteResult = await clientsCollection.deleteMany({
      $or: [
        { _id: { $in: clientIdsToDelete } },
        { id: { $in: clientIdsToDelete } }
      ]
    });
    
    console.log(`✅ Successfully deleted ${deleteResult.deletedCount} clients`);
    
    // Also delete associated data for these clients
    console.log('🗑️  Cleaning up associated data...');
    
    // Delete reports for these clients
    const reportDeleteResult = await db.collection('reports').deleteMany({
      clientId: { $in: clientIdsToDelete.map(id => id.toString()) }
    });
    console.log(`   📊 Deleted ${reportDeleteResult.deletedCount} reports`);
    
    // Delete social media tokens for these clients
    const tokenDeleteResult = await db.collection('social_media_tokens').deleteMany({
      clientId: { $in: clientIdsToDelete.map(id => id.toString()) }
    });
    console.log(`   🔑 Deleted ${tokenDeleteResult.deletedCount} social media tokens`);
    
    // Show remaining clients
    console.log('\n📋 Remaining clients:');
    const remainingClients = await clientsCollection.find({}).toArray();
    remainingClients.forEach((client, index) => {
      console.log(`${index + 1}. ID: ${client._id || client.id}, Name: "${client.name}", Email: ${client.email || 'N/A'}`);
    });
    
    console.log('\n✅ Cleanup completed successfully!');
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    if (client) {
      await client.close();
      console.log('🔐 Database connection closed');
    }
  }
}

// Run the cleanup
deleteOtherClients();