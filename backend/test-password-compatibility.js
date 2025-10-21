const { MongoClient } = require('mongodb');
const bcrypt = require('bcrypt');
const bcryptjs = require('bcryptjs');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || process.env.DATABASE_URL;

async function testPasswordCompatibility() {
  let client;
  
  try {
    console.log('🔗 Connecting to MongoDB...');
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    
    const db = client.db();
    const usersCollection = db.collection('users');
    
    // Get the m@One.com user
    const oneUser = await usersCollection.findOne({ email: 'm@One.com' });
    
    if (!oneUser) {
      console.log('❌ User m@One.com not found!');
      return;
    }
    
    console.log('👤 Found user:', oneUser.name);
    console.log('📧 Email:', oneUser.email);
    console.log('🔑 Password hash:', oneUser.password);
    console.log('👥 User type:', oneUser.user_type);
    
    const testPassword = 'One2025!';
    
    // Test with bcrypt (what we used to create)
    console.log('\n🧪 Testing with bcrypt (library we used):');
    const bcryptResult = await bcrypt.compare(testPassword, oneUser.password);
    console.log('   Result:', bcryptResult ? '✅ SUCCESS' : '❌ FAILED');
    
    // Test with bcryptjs (what auth endpoint uses)
    console.log('\n🧪 Testing with bcryptjs (library auth endpoint uses):');
    const bcryptjsResult = await bcryptjs.compare(testPassword, oneUser.password);
    console.log('   Result:', bcryptjsResult ? '✅ SUCCESS' : '❌ FAILED');
    
    if (!bcryptjsResult) {
      console.log('\n🔧 Creating new password hash with bcryptjs...');
      const newHash = await bcryptjs.hash(testPassword, 10);
      
      console.log('   New hash:', newHash);
      
      // Update the user with the new hash
      await usersCollection.updateOne(
        { email: 'm@One.com' },
        { 
          $set: { 
            password: newHash,
            updatedAt: new Date()
          }
        }
      );
      
      console.log('✅ Updated password hash in database');
      
      // Test again
      console.log('\n🧪 Testing new hash with bcryptjs:');
      const newUser = await usersCollection.findOne({ email: 'm@One.com' });
      const finalTest = await bcryptjs.compare(testPassword, newUser.password);
      console.log('   Result:', finalTest ? '✅ SUCCESS' : '❌ FAILED');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    if (client) {
      await client.close();
      console.log('🔐 Database connection closed');
    }
  }
}

testPasswordCompatibility();