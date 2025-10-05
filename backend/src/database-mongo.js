const { MongoClient } = require('mongodb');

// Use the working connection string from the original working version
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://rhasan:GlassDoor2025@cluster0.tj04exd.mongodb.net/genius_db?retryWrites=true&w=majority&appName=Cluster0';
const DATABASE_NAME = 'genius_db';

let client = null;
let db = null;

async function connect() {
  if (!client) {
    try {
      console.log('🔗 Connecting to MongoDB Atlas...');
      console.log('📍 Using connection URI:', MONGODB_URI.replace(/\/\/.*@/, '//<credentials>@'));
      
      client = new MongoClient(MONGODB_URI, {
        maxPoolSize: 10, // Set connection pool size
        serverSelectionTimeoutMS: 10000, // Increase timeout
        socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
        retryWrites: true
      });
      
      await client.connect();
      db = client.db(DATABASE_NAME);
      console.log('✅ Connected to MongoDB Atlas - genius_db');
      
      // Test the connection
      await db.admin().ping();
      console.log('📡 MongoDB connection verified');
    } catch (error) {
      console.error('❌ Failed to connect to MongoDB:', error.message);
      console.error('🔍 Error details:', {
        name: error.name,
        code: error.code,
        codeName: error.codeName
      });
      throw error;
    }
  }
  return db;
}

async function getDb() {
  if (!db) {
    await connect();
  }
  return db;
}

async function disconnect() {
  if (client) {
    await client.close();
    client = null;
    db = null;
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Handle process termination
process.on('SIGINT', async () => {
  await disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await disconnect();
  process.exit(0);
});

module.exports = {
  connect,
  getDb,
  disconnect
};