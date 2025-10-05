const { MongoClient } = require('mongodb');
require('dotenv').config();

async function fixAdminUser() {
  console.log('🔧 Fixing admin user...');
  
  try {
    // Connect to MongoDB
    const client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const db = client.db('genius_db');
    const usersCollection = db.collection('users');
    
    // Check current admin user
    const adminUser = await usersCollection.findOne({ email: 'admin@example.com' });
    console.log('📋 Current admin user:', JSON.stringify(adminUser, null, 2));
    
    // Update or create admin user
    const result = await usersCollection.updateOne(
      { email: 'admin@example.com' },
      {
        $set: {
          name: 'Super Admin',
          user_type: 'admin',
          association: null,
          updatedAt: new Date()
        },
        $setOnInsert: {
          password: 'admin123', // You can change this
          createdAt: new Date()
        }
      },
      { upsert: true }
    );
    
    console.log('📝 Update result:', result);
    
    // Verify the update
    const updatedUser = await usersCollection.findOne({ email: 'admin@example.com' });
    console.log('✅ Updated admin user:', JSON.stringify(updatedUser, null, 2));
    
    // List all users
    const allUsers = await usersCollection.find({}).toArray();
    console.log('\n👥 All users:');
    allUsers.forEach(user => {
      console.log(`- ${user.email}: ${user.user_type || 'undefined'} (association: ${user.association || 'none'})`);
    });
    
    await client.close();
    console.log('\n🎉 Admin user fixed successfully!');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

fixAdminUser();