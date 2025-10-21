// Script to add sample user to production MongoDB
const { MongoClient } = require('mongodb');
const bcrypt = require('bcryptjs');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://rhasan:GlassDoor2025@cluster0.tj04exd.mongodb.net/genius_db?retryWrites=true&w=majority&appName=Cluster0';
const DATABASE_NAME = 'genius_db';

async function addSampleUser() {
  let client;
  
  try {
    console.log('🔗 Connecting to MongoDB...');
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    const db = client.db(DATABASE_NAME);
    
    const usersCollection = db.collection('users');
    
    // Check if sample user already exists
    const existingUser = await usersCollection.findOne({ email: 'hr@example.com' });
    
    if (existingUser) {
      console.log('👤 Sample user already exists');
      return;
    }
    
    // Create sample user
    console.log('👤 Creating sample user...');
    const hashedPassword = await bcrypt.hash('password', 10);
    
    const sampleUser = {
      id: 'sample-user-1',
      email: 'hr@example.com',
      password: hashedPassword,
      user_type: 'employee',
      role: 'admin',
      name: 'HR Sample User',
      association: null,
      created_at: new Date(),
      updated_at: new Date()
    };
    
    await usersCollection.insertOne(sampleUser);
    console.log('✅ Sample user created successfully');
    console.log('📧 Email: hr@example.com');
    console.log('🔑 Password: password');
    
  } catch (error) {
    console.error('❌ Error adding sample user:', error);
  } finally {
    if (client) {
      await client.close();
    }
  }
}

addSampleUser();