const express = require('express');
const { getBackupStatus, createBackup, checkIntegrity, recoverFromBackup } = require('../services/backupService');
const router = express.Router();

// Authentication middleware
const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-here';

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
}

// GET /api/backup/status - Get backup status
router.get('/status', authenticateToken, async (req, res) => {
  try {
    const status = await getBackupStatus();
    res.json(status);
  } catch (error) {
    console.error('Backup status error:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/backup/run - Create a backup
router.post('/run', authenticateToken, async (req, res) => {
  try {
    const { target = 'primary' } = req.query;
    
    if (!['primary', 'emergency'].includes(target)) {
      return res.status(400).json({ error: 'Target must be "primary" or "emergency"' });
    }
    
    const result = await createBackup(target);
    res.json(result);
  } catch (error) {
    console.error('Backup run error:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/backup/integrity - Check data integrity
router.post('/integrity', authenticateToken, async (req, res) => {
  try {
    const result = await checkIntegrity();
    res.json(result);
  } catch (error) {
    console.error('Backup integrity error:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/backup/recover - Recover from backup (admin only)
router.post('/recover', authenticateToken, async (req, res) => {
  try {
    const { source = 'primary' } = req.query;
    
    if (!['primary', 'emergency'].includes(source)) {
      return res.status(400).json({ error: 'Source must be "primary" or "emergency"' });
    }
    
    const result = await recoverFromBackup(source);
    res.json(result);
  } catch (error) {
    console.error('Backup recover error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
