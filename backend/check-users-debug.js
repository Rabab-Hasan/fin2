// Script to check user details in production MongoDB
const { MongoClient } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://rhasan:GlassDoor2025@cluster0.tj04exd.mongodb.net/genius_db?retryWrites=true&w=majority&appName=Cluster0';
const DATABASE_NAME = 'genius_db';

async function checkUsers() {
  let client;
  
  try {
    console.log('🔗 Connecting to MongoDB...');
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    const db = client.db(DATABASE_NAME);
    
    const usersCollection = db.collection('users');
    
    // Get all users
    const users = await usersCollection.find({}).toArray();
    
    console.log('\n📊 Users in database:');
    users.forEach((user, index) => {
      console.log(`\n${index + 1}. User:`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Name: ${user.name || 'N/A'}`);
      console.log(`   User Type: ${user.user_type || 'N/A'}`);
      console.log(`   Role: ${user.role || 'N/A'}`);
      console.log(`   Password field: ${user.password ? 'EXISTS (hashed)' : user.password_hash ? 'EXISTS (password_hash)' : 'MISSING'}`);
      console.log(`   Created: ${user.created_at || 'N/A'}`);
    });
    
    // Check specifically for hr@example.com
    console.log('\n🔍 Checking hr@example.com specifically:');
    const hrUser = await usersCollection.findOne({ email: 'hr@example.com' });
    if (hrUser) {
      console.log('✅ Found hr@example.com');
      console.log('Password field keys:', Object.keys(hrUser).filter(key => key.includes('password')));
    } else {
      console.log('❌ hr@example.com not found');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    if (client) {
      await client.close();
    }
  }
}

checkUsers();