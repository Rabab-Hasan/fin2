const express = require('express');
const serverless = require('serverless-http');
const cors = require('cors');

// Create Express app for Netlify Functions
const app = express();

// Basic middleware
app.use(cors({
  origin: ['https://findashr.netlify.app', 'http://localhost:3000'],
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Set environment for serverless
process.env.NETLIFY = 'true';

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    service: 'Finance Dashboard API - Netlify Functions'
  });
});

// Simple auth endpoint for login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Simple hardcoded auth for now to get things working
    if (email === 'hr@example.com' && password === 'password') {
      const token = 'sample-jwt-token-' + Date.now();
      res.json({
        token,
        user: {
          email: 'hr@example.com',
          user_type: 'employee',
          association: null
        }
      });
    } else {
      res.status(401).json({ error: 'Invalid credentials' });
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Simple clients endpoint
app.get('/api/clients', async (req, res) => {
  try {
    res.json([
      { id: 1, name: 'Sample Client', status: 'active' }
    ]);
  } catch (error) {
    console.error('Clients error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Simple reports endpoint
app.get('/api/reports', async (req, res) => {
  try {
    res.json([
      { id: 1, name: 'Sample Report', date: new Date().toISOString() }
    ]);
  } catch (error) {
    console.error('Reports error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Netlify Function Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Export for Netlify Functions with minimal setup
const handler = serverless(app);

module.exports.handler = async (event, context) => {
  // Set context to not wait for empty event loop
  context.callbackWaitsForEmptyEventLoop = false;
  
  return handler(event, context);
};