const { MongoClient } = require('mongodb');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || process.env.DATABASE_URL;

async function checkEmailCase() {
  let client;
  
  try {
    console.log('🔗 Connecting to MongoDB...');
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    
    const db = client.db();
    const usersCollection = db.collection('users');
    
    // Check for different cases
    const variations = [
      'm@One.com',
      'm@one.com',
      'M@One.com',
      'M@ONE.COM'
    ];
    
    console.log('🔍 Checking email variations:');
    
    for (const email of variations) {
      const user = await usersCollection.findOne({ email: email });
      console.log(`   "${email}": ${user ? '✅ FOUND' : '❌ NOT FOUND'}`);
      if (user) {
        console.log(`      Name: ${user.name}`);
        console.log(`      Stored email: "${user.email}"`);
        console.log(`      User type: ${user.user_type}`);
      }
    }
    
    // Show all users and their exact email values
    console.log('\n📋 All users and their exact emails:');
    const allUsers = await usersCollection.find({}).toArray();
    
    allUsers.forEach((user, index) => {
      console.log(`${index + 1}. Name: "${user.name}"`);
      console.log(`   Email: "${user.email}" (${user.email.length} chars)`);
      console.log(`   Type: ${user.user_type || user.role}`);
      console.log('');
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

checkEmailCase();