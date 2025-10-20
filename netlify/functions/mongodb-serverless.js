// Serverless-compatible MongoDB connection
const { MongoClient } = require('mongodb');

let cachedClient = null;
let cachedDb = null;

async function connectToDatabase() {
  // Return cached connection if available
  if (cachedClient && cachedDb) {
    return { client: cachedClient, db: cachedDb };
  }

  const MONGODB_URI = process.env.MONGODB_URI;
  
  if (!MONGODB_URI) {
    console.warn('⚠️ No MongoDB URI provided, skipping MongoDB connection');
    return { client: null, db: null };
  }

  try {
    console.log('🔗 Connecting to MongoDB Atlas for serverless...');
    
    // Create new client with serverless-optimized settings
    const client = new MongoClient(MONGODB_URI, {
      maxPoolSize: 1, // Limit pool size for serverless
      serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
      socketTimeoutMS: 5000,
      bufferMaxEntries: 0, // Disable mongoose buffering
      useUnifiedTopology: true,
    });

    await client.connect();
    const db = client.db('genius_db');

    // Cache the connection
    cachedClient = client;
    cachedDb = db;

    console.log('✅ Connected to MongoDB Atlas - serverless mode');
    return { client, db };
    
  } catch (error) {
    console.error('❌ MongoDB connection failed in serverless:', error);
    return { client: null, db: null };
  }
}

// Export for use in routes
module.exports = {
  connectToDatabase,
  getClient: () => cachedClient,
  getDb: () => cachedDb
};