require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs-extra');

// Import security middleware
const { securityHeaders, logAuthentication } = require('./middleware/security');
const databaseEncryption = require('./middleware/database-encryption');

const app = express();
const PORT = process.env.PORT || 2345;

// Security middleware
app.use(securityHeaders);
app.use(logAuthentication);

// CORS configuration for Netlify frontend
app.use(cors({
  origin: [
    'https://findashr.netlify.app',
    'https://actionlabs.netlify.app',
    'http://localhost:3000',
    'http://localhost:2345'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Encrypted']
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Ensure uploads directory exists
fs.ensureDirSync('uploads');

// Initialize database on startup
const initializeDatabase = async () => {
  try {
    console.log('📊 Initializing database...');
    // Run migrations if they exist
    if (fs.existsSync(path.join(__dirname, 'migrations/run.js'))) {
      const runMigrations = require('./migrations/run.js');
      await runMigrations();
    }
    console.log('✅ Database initialized successfully');
  } catch (error) {
    console.warn('⚠️ Database initialization warning:', error.message);
    // Don't fail startup if migrations have issues
  }
};

// Routes
app.use('/api', require('./routes/import'));
app.use('/api/reports', require('./routes/reports-mongo'));  // Use MongoDB for reports
app.use('/api/columns', require('./routes/columns'));
app.use('/api/export', require('./routes/export'));
app.use('/api/backup', require('./routes/backup'));
app.use('/api/analytics', require('./routes/analytics-mongo'));  // Use MongoDB for analytics
app.use('/api/notes', require('./routes/notes'));

// Initialize media routes after other setup
const mediaRoutes = require('./routes/media');
app.use('/api/media', mediaRoutes);

// Initialize tasks routes
app.use('/api/tasks', require('./routes/tasks'));

// Initialize clients routes - Use MongoDB version
app.use('/api/clients', require('./routes/clients-mongo'));

// Initialize auth routes
app.use('/api/auth', require('./routes/auth'));

// Initialize roles management routes
app.use('/api/roles', require('./routes/roles'));

// Initialize leave management routes
app.use('/api/leave', require('./routes/leave'));

// Initialize chat routes
app.use('/api/chat', require('./routes/chat'));

// Initialize TikTok integration routes
app.use('/api/tiktok', require('./routes/tiktok'));

// Initialize Meta integration routes
app.use('/api/meta', require('./routes/meta'));

// Initialize roadmap routes
app.use('/api/roadmap', require('./routes/roadmap'));

// Initialize campaigns routes
app.use('/api/campaigns', require('./routes/campaigns'));

// Initialize campaign assistant routes (Ollama AI-powered)
app.use('/api/campaign-assistant', require('./routes/campaign-assistant'));

// Initialize enhanced campaign assistant routes (Full GFH file analysis + Ollama)
app.use('/api/enhanced-campaign-assistant', require('./routes/enhancedCampaignAssistant'));

// Initialize marketing analysis routes (CSV upload and comprehensive analysis)
app.use('/api/marketing-analysis', require('./routes/marketingAnalysis'));

// Initialize campaign performance routes
app.use('/api/campaign-performance', require('./routes/campaign-performance'));

// Initialize notifications routes
app.use('/api/notifications', require('./routes/notifications'));

// Initialize KNIME integration routes (chatbot fallback)
app.use('/api/knime', require('./routes/knime'));

// Health check with encryption status
app.get('/api/health', async (req, res) => {
  try {
    const encryptionStatus = await databaseEncryption.validateEncryptionSetup();
    
    res.json({
      status: 'OK',
      timestamp: new Date().toISOString(),
      encryption: {
        available: true,
        validated: encryptionStatus,
        version: '1.0.0'
      },
      server: {
        port: PORT,
        environment: process.env.NODE_ENV || 'development'
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'ERROR',
      error: 'Health check failed',
      encryption: { available: false, validated: false }
    });
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Start server
app.listen(PORT, '0.0.0.0', async () => {
  console.log(`🚀 Finance Dashboard Backend running on port ${PORT}`);
  console.log(`🏥 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🌐 Network access: http://192.168.100.137:${PORT}/api/health`);
  
  // Validate encryption setup
  console.log('🔒 Validating encryption system...');
  const encryptionValid = await databaseEncryption.validateEncryptionSetup();
  if (encryptionValid) {
    console.log('✅ Encryption system ready');
  } else {
    console.warn('⚠️  Encryption validation failed - check configuration');
  }
  
  // Initialize MongoDB database
  try {
    const mongoDb = require('./database-mongo');
    console.log('📊 Using MongoDB Atlas for production data');
    await mongoDb.connect();
    
    // Initialize sample data if needed
    const initMongoData = require('../init-mongo-data');
    await initMongoData();
    
    console.log('✅ MongoDB initialized with sample data');
    console.log('🔒 Sensitive data will be encrypted automatically');
    
    // Also initialize local database for migrations
    await initializeDatabase();
    
  } catch (error) {
    console.error('❌ Error with database setup:', error);
    console.log('⚠️  Server will continue but database operations may fail');
  }
}).on('error', (err) => {
  console.error('❌ Server error:', err);
  if (err.code === 'EADDRINUSE') {
    console.log(`⚠️  Port ${PORT} is already in use. Please close other instances or use a different port.`);
  }
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('🚨 Unhandled Rejection at:', promise, 'reason:', reason);
  // Don't exit the process
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('🚨 Uncaught Exception:', error);
  // Don't exit the process in development
  if (process.env.NODE_ENV === 'production') {
    process.exit(1);
  }
});
