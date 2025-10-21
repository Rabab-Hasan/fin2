const express = require('express');
const { getDb } = require('../database-mongo');
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

// GET /api/export/csv - Export all data as CSV
router.get('/csv', (req, res, next) => {
  // Check for token in query parameter for direct download links
  const token = req.query.token || req.headers['authorization']?.split(' ')[1];
  
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
}, async (req, res) => {
  try {
    const db = await getDb();
    
    // Get all reports data
    const reports = await db.collection('reports')
      .find({})
      .sort({ report_date: 1 })
      .toArray();
      
    if (reports.length === 0) {
      return res.status(404).json({ error: 'No data to export' });
    }
    
    // Build comprehensive column list from all data objects
    const allColumns = new Set(['id', 'report_date', 'month_label', 'clientId', 'notes']);
    reports.forEach(report => {
      if (report.data && typeof report.data === 'object') {
        Object.keys(report.data).forEach(key => allColumns.add(key));
      }
    });
    
    const headers = Array.from(allColumns);
    let csvContent = headers.join(',') + '\n';
    
    // Build CSV rows
    for (const report of reports) {
      const csvRow = headers.map(header => {
        let value;
        if (header === 'id' || header === 'report_date' || header === 'month_label' || 
            header === 'clientId' || header === 'notes') {
          value = report[header];
        } else {
          value = report.data?.[header];
        }
        return value !== undefined && value !== null ? `"${value}"` : '""';
      });
      csvContent += csvRow.join(',') + '\n';
    }
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="finance_data_export.csv"');
    res.send(csvContent);
  } catch (error) {
    console.error('Export CSV error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
