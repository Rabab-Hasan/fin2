const { getDb } = require('./src/database-mongo');

async function updateUsersToAdmin() {
  try {
    console.log('🔧 Updating user roles to admin...\n');
    
    const db = await getDb();
    const usersCollection = db.collection('users');
    
    // Update Y. Alsarraj to admin
    const result1 = await usersCollection.updateOne(
      { email: 'y.alsarraj@action-labs.co' },
      { 
        $set: { 
          role: 'admin', 
          updated_at: new Date() 
        } 
      }
    );
    
    // Update O. Rana to admin (already admin but ensure consistency)
    const result2 = await usersCollection.updateOne(
      { email: 'o.rana@action-labs.co' },
      { 
        $set: { 
          role: 'admin', 
          updated_at: new Date() 
        } 
      }
    );
    
    console.log('✅ Y. Alsarraj role updated:', result1.modifiedCount > 0 ? 'SUCCESS' : 'NO CHANGE NEEDED');
    console.log('✅ O. Rana role updated:', result2.modifiedCount > 0 ? 'SUCCESS' : 'NO CHANGE NEEDED');
    
    // Verify the updates
    const user1 = await usersCollection.findOne({ email: 'y.alsarraj@action-labs.co' });
    const user2 = await usersCollection.findOne({ email: 'o.rana@action-labs.co' });
    
    console.log('\n📋 Verification:');
    console.log(`1. Y. Alsarraj (${user1.email}) - Role: ${user1.role}`);
    console.log(`2. O. Rana (${user2.email}) - Role: ${user2.role}`);
    
    console.log('\n🎉 Both users are now admins!');
    
  } catch (error) {
    console.error('❌ Error updating user roles:', error);
    throw error;
  }
}

updateUsersToAdmin()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('💥 Script failed:', error);
    process.exit(1);
  });