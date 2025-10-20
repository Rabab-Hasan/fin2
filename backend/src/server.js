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

// Standard middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Ensure uploads directory exists
fs.ensureDirSync('uploads');

// Routes
app.use('/api', require('./routes/import'));
app.use('/api/reports', require('./routes/reports'));
app.use('/api/columns', require('./routes/columns'));
app.use('/api/export', require('./routes/export'));
app.use('/api/backup', require('./routes/backup'));
app.use('/api/analytics', require('./routes/analytics'));
app.use('/api/notes', require('./routes/notes'));

// Initialize media routes after other setup
const mediaRoutes = require('./routes/media');
app.use('/api/media', mediaRoutes);

// Initialize tasks routes
app.use('/api/tasks', require('./routes/tasks'));

// Initialize clients routes
app.use('/api/clients', require('./routes/clients'));

// Initialize auth routes
app.use('/api/auth', require('./routes/auth'));

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
  
  // Initialize SQLite database
  try {
    console.log('📊 Using SQLite database for development');
    console.log('� Sensitive data will be encrypted automatically');
    
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
