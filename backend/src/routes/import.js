const express = require('express');
const multer = require('multer');
const xlsx = require('xlsx');
const csv = require('csv-parser');
const { processImportData } = require('../services/importService');
const { getDb } = require('../database-mongo');
const router = express.Router();

// Authentication middleware (imported from auth.js logic)
const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-here';

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

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

const upload = multer({ dest: 'uploads/' });

router.post('/import', authenticateToken, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    const { clientId } = req.body;
    if (!clientId) {
      return res.status(400).json({ error: 'Client ID is required' });
    }
    
    const { originalname, path: filePath } = req.file;
    const ext = originalname.toLowerCase().split('.').pop();
    
    let data = [];
    
    if (ext === 'xlsx' || ext === 'xls') {
      // Parse Excel file
      console.log(`Processing Excel file: ${originalname}`);
      const workbook = xlsx.readFile(filePath);
      
      // Check if there are multiple sheets and use the first one with data
      let sheetName = workbook.SheetNames[0];
      console.log(`Available sheets: ${workbook.SheetNames.join(', ')}`);
      
      // Prefer "Report Data" sheet if it exists (based on your file description)
      if (workbook.SheetNames.includes('Report Data')) {
        sheetName = 'Report Data';
        console.log(`Using "Report Data" sheet`);
      }
      
      const sheet = workbook.Sheets[sheetName];
      data = xlsx.utils.sheet_to_json(sheet);
      
      console.log(`Parsed ${data.length} rows from sheet "${sheetName}"`);
      if (data.length > 0) {
        console.log('Sample row keys:', Object.keys(data[0]));
      }
      
    } else if (ext === 'csv') {
      // Parse CSV file
      console.log(`Processing CSV file: ${originalname}`);
      const fs = require('fs');
      const csvData = [];
      
      await new Promise((resolve, reject) => {
        fs.createReadStream(filePath)
          .pipe(csv())
          .on('data', (row) => csvData.push(row))
          .on('end', resolve)
          .on('error', reject);
      });
      
      data = csvData;
      console.log(`Parsed ${data.length} rows from CSV`);
    } else {
      return res.status(400).json({ 
        error: 'Unsupported file format. Please upload .xlsx, .xls, or .csv files',
        supportedFormats: ['.xlsx', '.xls', '.csv']
      });
    }
    
    if (data.length === 0) {
      return res.status(400).json({ 
        error: 'No data found in the uploaded file. Please check the file format and content.' 
      });
    }
    
    console.log(`Processing ${data.length} rows of data...`);
    const result = await processImportData(data, clientId);
    
    // Clean up uploaded file
    require('fs').unlinkSync(filePath);
    
    console.log(`Import completed: ${result.inserted} inserted, ${result.skipped} skipped`);
    res.json(result);
  } catch (error) {
    console.error('Import error:', error);
    
    // Clean up uploaded file on error
    if (req.file && req.file.path) {
      try {
        require('fs').unlinkSync(req.file.path);
      } catch (cleanupError) {
        console.error('Error cleaning up file:', cleanupError);
      }
    }
    
    res.status(500).json({ 
      error: error.message,
      details: 'Please check the file format and ensure it contains the required columns: reportDate (or report_date), registeredOnboarded, linkedAccounts, totalAdvanceApplications, totalAdvanceApplicants, etc.'
    });
  }
});

router.get('/template.csv', authenticateToken, async (req, res) => {
  try {
    // Use static template instead of database query to avoid connection issues
    const csv = `reportDate,month_label,registeredOnboarded,subscription_completion,trial_started,subscription_started,total_revenue,conversion_rate,campaign_performance,customer_acquisition_cost,lifetime_value,churn_rate,net_promoter_score,notes
2024-01-01,January,1000,800,500,400,50000.00,40.0,75.0,125.00,2500.00,5.0,8.5,Sample data for January
2024-02-01,February,1200,950,600,480,60000.00,40.0,78.0,130.00,2600.00,4.8,8.7,Sample data for February
2024-03-01,March,1100,880,550,440,55000.00,40.0,76.0,127.50,2550.00,4.9,8.6,Sample data for March`;
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="finance_template.csv"');
    res.send(csv);
  } catch (error) {
    console.error('Template error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
