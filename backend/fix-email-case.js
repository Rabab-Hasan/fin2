const { MongoClient } = require('mongodb');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || process.env.DATABASE_URL;

async function fixEmailCase() {
  let client;
  
  try {
    console.log('🔗 Connecting to MongoDB...');
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    
    const db = client.db();
    const usersCollection = db.collection('users');
    
    // Update the One user email to lowercase
    console.log('🔧 Updating m@One.com email to lowercase...');
    
    const updateResult = await usersCollection.updateOne(
      { email: 'm@One.com' },
      { 
        $set: { 
          email: 'm@one.com',
          updatedAt: new Date()
        }
      }
    );
    
    if (updateResult.matchedCount > 0) {
      console.log('✅ Successfully updated email to lowercase');
    } else {
      console.log('❌ No user found with email m@One.com');
    }
    
    // Verify the change
    console.log('\n🔍 Verifying the update:');
    const updatedUser = await usersCollection.findOne({ email: 'm@one.com' });
    
    if (updatedUser) {
      console.log('✅ Found user with lowercase email:');
      console.log(`   Name: ${updatedUser.name}`);
      console.log(`   Email: "${updatedUser.email}"`);
      console.log(`   Type: ${updatedUser.user_type}`);
    } else {
      console.log('❌ Could not find user with lowercase email');
    }
    
    // Show all users to confirm
    console.log('\n📋 All users after update:');
    const allUsers = await usersCollection.find({}).toArray();
    
    allUsers.forEach((user, index) => {
      console.log(`${index + 1}. ${user.name} - ${user.email} (${user.user_type || user.role})`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    if (client) {
      await client.close();
      console.log('🔐 Database connection closed');
    }
  }
}

fixEmailCase();