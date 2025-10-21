const { getDb } = require('./src/database-mongo');

async function deleteClientData(clientId) {
  try {
    console.log(`🗑️ Starting deletion process for client: ${clientId}`);
    
    const db = await getDb();
    
    // Collections that might contain client data
    const collections = [
      'reports',           // Main reports data
      'clients',          // Client information
      'social_media_tokens', // OAuth tokens
      'notes',            // Client notes
      'tasks',            // Client tasks
      'campaigns',        // Campaign data
      'notifications'     // Client notifications
    ];
    
    let totalDeleted = 0;
    
    for (const collectionName of collections) {
      try {
        console.log(`\n📋 Checking collection: ${collectionName}`);
        
        // Count documents before deletion
        const beforeCount = await db.collection(collectionName).countDocuments({ clientId });
        
        if (beforeCount > 0) {
          console.log(`   Found ${beforeCount} records for client ${clientId}`);
          
          // Delete documents with clientId
          const result = await db.collection(collectionName).deleteMany({ clientId });
          console.log(`   ✅ Deleted ${result.deletedCount} records`);
          totalDeleted += result.deletedCount;
        } else {
          console.log(`   No records found for client ${clientId}`);
        }
        
        // Also check for client_id field (alternative naming)
        const beforeCountAlt = await db.collection(collectionName).countDocuments({ client_id: clientId });
        
        if (beforeCountAlt > 0) {
          console.log(`   Found ${beforeCountAlt} records with client_id field`);
          
          const resultAlt = await db.collection(collectionName).deleteMany({ client_id: clientId });
          console.log(`   ✅ Deleted ${resultAlt.deletedCount} records (client_id field)`);
          totalDeleted += resultAlt.deletedCount;
        }
        
      } catch (collectionError) {
        console.log(`   ⚠️ Collection ${collectionName} not found or error:`, collectionError.message);
      }
    }
    
    // Also check for any documents where the client ID might be in other fields
    console.log(`\n🔍 Checking for client ID in other fields...`);
    
    try {
      // Check users collection for client entries
      const userResult = await db.collection('users').deleteMany({ 
        $or: [
          { clientId },
          { client_id: clientId },
          { _id: clientId } // In case clientId is actually a user ID
        ]
      });
      if (userResult.deletedCount > 0) {
        console.log(`   ✅ Deleted ${userResult.deletedCount} user records`);
        totalDeleted += userResult.deletedCount;
      }
    } catch (error) {
      console.log(`   ⚠️ Error checking users collection:`, error.message);
    }
    
    console.log(`\n🎯 DELETION COMPLETE`);
    console.log(`   Total records deleted: ${totalDeleted}`);
    console.log(`   Client ID: ${clientId}`);
    
    if (totalDeleted === 0) {
      console.log(`   ⚠️ No records found for client ${clientId}`);
    } else {
      console.log(`   ✅ Successfully removed all data for client ${clientId}`);
    }
    
    return totalDeleted;
    
  } catch (error) {
    console.error('❌ Error deleting client data:', error);
    throw error;
  }
}

// Interactive script
async function main() {
  try {
    const args = process.argv.slice(2);
    
    if (args.length === 0) {
      console.log('❓ Please provide a client ID to delete');
      console.log('Usage: node delete-client-data.js <clientId>');
      console.log('\nAvailable clients:');
      
      // Show available clients
      const db = await getDb();
      const clients = await db.collection('clients').find({}).toArray();
      const reportClients = await db.collection('reports').distinct('clientId');
      
      console.log('\nClients in clients collection:');
      clients.forEach(client => {
        console.log(`  - ${client.id || client._id}: ${client.name || 'Unknown'}`);
      });
      
      console.log('\nClient IDs with reports:');
      reportClients.forEach(clientId => {
        console.log(`  - ${clientId}`);
      });
      
      process.exit(1);
    }
    
    const clientId = args[0];
    
    console.log(`⚠️  WARNING: This will DELETE ALL DATA for client: ${clientId}`);
    console.log('This action cannot be undone!');
    
    // In a real scenario, you'd want user confirmation
    // For now, we'll proceed if the client ID is provided
    
    const deletedCount = await deleteClientData(clientId);
    
    console.log(`\n✨ Operation completed. ${deletedCount} records deleted.`);
    process.exit(0);
    
  } catch (error) {
    console.error('💥 Script failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { deleteClientData };