// Script to test login with hr@example.com
const bcrypt = require('bcryptjs');
const { MongoClient } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://rhasan:GlassDoor2025@cluster0.tj04exd.mongodb.net/genius_db?retryWrites=true&w=majority&appName=Cluster0';
const DATABASE_NAME = 'genius_db';

async function testLogin() {
  let client;
  
  try {
    console.log('🔗 Connecting to MongoDB...');
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    const db = client.db(DATABASE_NAME);
    
    const usersCollection = db.collection('users');
    
    // Find hr@example.com user
    const user = await usersCollection.findOne({ email: 'hr@example.com' });
    
    if (!user) {
      console.log('❌ User hr@example.com not found');
      return;
    }
    
    console.log('\n👤 Found user:');
    console.log('Email:', user.email);
    console.log('Name:', user.name);
    console.log('Password field:', user.password ? 'password' : 'password_hash');
    
    // Test password
    const testPassword = 'password';
    const storedPassword = user.password || user.password_hash;
    
    console.log('\n🔑 Testing password...');
    console.log('Stored password starts with $:', storedPassword.startsWith('$'));
    
    let isValidPassword = false;
    if (storedPassword.startsWith('$')) {
      isValidPassword = await bcrypt.compare(testPassword, storedPassword);
    } else {
      isValidPassword = testPassword === storedPassword;
    }
    
    console.log('Password valid:', isValidPassword);
    
    if (!isValidPassword) {
      // Try to create a new password hash
      console.log('\n🔄 Creating new password hash...');
      const newHash = await bcrypt.hash(testPassword, 10);
      console.log('New hash:', newHash);
      
      // Update user with new hash
      await usersCollection.updateOne(
        { email: 'hr@example.com' },
        { $set: { password: newHash } }
      );
      console.log('✅ Password updated successfully');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    if (client) {
      await client.close();
    }
  }
}

testLogin();