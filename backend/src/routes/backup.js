const express = require('express');
const { getBackupStatus, createBackup, checkIntegrity, recoverFromBackup } = require('../services/backupService');
const router = express.Router();

// GET /api/backup/status - Get backup status
router.get('/status', async (req, res) => {
  try {
    const status = await getBackupStatus();
    res.json(status);
  } catch (error) {
    console.error('Backup status error:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/backup/run - Create a backup
router.post('/run', async (req, res) => {
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
router.post('/integrity', async (req, res) => {
  try {
    const result = await checkIntegrity();
    res.json(result);
  } catch (error) {
    console.error('Backup integrity error:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/backup/recover - Recover from backup (admin only)
router.post('/recover', async (req, res) => {
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
