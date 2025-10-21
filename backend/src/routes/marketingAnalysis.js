const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const MarketingAnalyzer = require('../services/marketingAnalyzer');

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

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../../uploads/marketing');
    // Ensure upload directory exists
    require('fs').mkdirSync(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Generate unique filename with timestamp
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'marketing-' + uniqueSuffix + '.csv');
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
  fileFilter: function (req, file, cb) {
    // Only allow CSV files
    if (file.mimetype === 'text/csv' || file.originalname.toLowerCase().endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed'), false);
    }
  }
});

/**
 * Upload and analyze marketing CSV file
 * POST /api/marketing-analysis/upload-and-analyze
 */
router.post('/upload-and-analyze', authenticateToken, upload.single('csvFile'), async (req, res) => {
  try {
    console.log('📤 Marketing file upload and analysis request received');

    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No CSV file provided'
      });
    }

    console.log('📁 File uploaded:', req.file.filename);
    console.log('📊 Starting marketing analysis...');

    const analyzer = new MarketingAnalyzer();
    const results = await analyzer.runCompleteAnalysis(req.file.path);

    // Clean up uploaded file after analysis
    try {
      await fs.unlink(req.file.path);
      console.log('🗑️ Temporary file cleaned up');
    } catch (cleanupError) {
      console.warn('⚠️ Failed to clean up temporary file:', cleanupError);
    }

    console.log('✅ Marketing analysis completed successfully');

    res.json({
      success: true,
      analysis: results,
      metadata: {
        fileName: req.file.originalname,
        fileSize: req.file.size,
        analyzedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ Marketing analysis error:', error);
    
    // Clean up file on error
    if (req.file && req.file.path) {
      try {
        await fs.unlink(req.file.path);
      } catch (cleanupError) {
        console.warn('⚠️ Failed to clean up file on error:', cleanupError);
      }
    }

    res.status(500).json({
      success: false,
      error: 'Analysis failed',
      details: error.message
    });
  }
});

/**
 * Analyze existing CSV file by file path
 * POST /api/marketing-analysis/analyze-file
 */
router.post('/analyze-file', authenticateToken, async (req, res) => {
  try {
    const { filePath } = req.body;

    if (!filePath) {
      return res.status(400).json({
        success: false,
        error: 'File path is required'
      });
    }

    console.log('📊 Analyzing existing file:', filePath);

    // Check if file exists
    try {
      await fs.access(filePath);
    } catch (error) {
      return res.status(404).json({
        success: false,
        error: 'File not found'
      });
    }

    const analyzer = new MarketingAnalyzer();
    const results = await analyzer.runCompleteAnalysis(filePath);

    console.log('✅ File analysis completed successfully');

    res.json({
      success: true,
      analysis: results,
      metadata: {
        fileName: path.basename(filePath),
        analyzedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ File analysis error:', error);
    res.status(500).json({
      success: false,
      error: 'Analysis failed',
      details: error.message
    });
  }
});

/**
 * Get analysis results by ID (for cached results)
 * GET /api/marketing-analysis/results/:id
 */
router.get('/results/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // In a production system, you'd store results in a database
    // For now, we'll return a sample response
    res.json({
      success: true,
      message: 'Results retrieval not implemented yet',
      id
    });

  } catch (error) {
    console.error('❌ Results retrieval error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve results'
    });
  }
});

/**
 * Get sample data structure for validation
 * GET /api/marketing-analysis/sample-structure
 */
router.get('/sample-structure', (req, res) => {
  try {
    const sampleStructure = {
      requiredColumns: [
        'day (exact match)',
        'hour (exact match)', 
        'channel (exact match)',
        'creative_network (exact match)',
        'network_cost (exact match)',
        'installs (exact match)',
        'started onboarding_events (or similar with "onboarding" or "started")',
        'registered no account linked_events (or similar with "registered")',
        'linked_events (or similar with "linked")'
      ],
      optionalColumns: [
        'waus',
        'delinked account_events',
        'account_events'
      ],
      expectedFormat: {
        day: '10/1/2025 or YYYY-MM-DD',
        hour: 'YYYY-MM-DDTHH:MM:SS or numeric hour',
        channel: 'Facebook, Instagram, etc.',
        creative_network: 'Campaign name/creative',
        network_cost: 'Numeric value',
        installs: 'Numeric value',
        'started onboarding_events': 'Numeric value (onboarding events)',
        'registered no account linked_events': 'Numeric value (registrations)', 
        linked_events: 'Numeric value (account linking)'
      },
      actualCSVFormat: {
        note: 'Based on your sample data, the system will automatically map:',
        mappings: {
          'started onboarding_events': 'onboarding_events',
          'registered no account linked_events': 'registered', 
          'delinked account_events': 'delinked'
        }
      },
      sampleRow: {
        day: '10/1/2025',
        hour: '2025-10-01T00:00:00',
        channel: 'Facebook',
        creative_network: '50 For 50 | AS Launch (Traffic) | Apply | iOS | Meta | 100 pd',
        network_cost: 0,
        installs: 0,
        'started onboarding_events': 0,
        'registered no account linked_events': 0,
        waus: 0.04,
        'delinked account_events': 0
      }
    };

    res.json({
      success: true,
      structure: sampleStructure
    });

  } catch (error) {
    console.error('❌ Sample structure error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get sample structure'
    });
  }
});

/**
 * Validate CSV file structure before analysis
 * POST /api/marketing-analysis/validate-file
 */
router.post('/validate-file', authenticateToken, upload.single('csvFile'), async (req, res) => {
  try {
    console.log('🔍 Validating CSV file structure...');

    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No CSV file provided'
      });
    }

    const analyzer = new MarketingAnalyzer();
    
    try {
      // Just load and parse the first few rows for validation
      await analyzer.loadCSVFile(req.file.path);
      const sampleData = analyzer.rawData.slice(0, 5);

      if (sampleData.length === 0) {
        return res.json({
          success: false,
          error: 'File appears to be empty',
          validation: {
            isValid: false,
            issues: ['No data rows found']
          }
        });
      }

      const firstRow = sampleData[0];
      const columns = Object.keys(firstRow);
      
      // Check for required columns - handle the actual column names from your data
      const columnString = columns.join(' ').toLowerCase();
      const hasDay = columns.some(col => col.toLowerCase().includes('day'));
      const hasChannel = columns.some(col => col.toLowerCase().includes('channel'));
      const hasNetworkCost = columns.some(col => col.toLowerCase().includes('network_cost'));
      const hasInstalls = columns.some(col => col.toLowerCase().includes('installs'));
      const hasOnboarding = columnString.includes('onboarding') || columns.some(col => col.toLowerCase().includes('started'));
      const hasRegistered = columnString.includes('registered');
      const hasLinked = columnString.includes('linked');
      
      const missingColumns = [];
      if (!hasDay) missingColumns.push('day');
      if (!hasChannel) missingColumns.push('channel');  
      if (!hasNetworkCost) missingColumns.push('network_cost');
      if (!hasInstalls) missingColumns.push('installs');
      if (!hasOnboarding) missingColumns.push('onboarding_events (or started)');
      
      const hasAllRequired = missingColumns.length === 0;

      const validation = {
        isValid: hasAllRequired,
        rowCount: sampleData.length,
        columns: columns,
        missingColumns: missingColumns,
        sampleData: sampleData,
        issues: []
      };

      if (!hasAllRequired) {
        validation.issues.push(`Missing required columns: ${missingColumns.join(', ')}`);
      }

      // Check for data quality issues
      let hasDataIssues = false;
      sampleData.forEach((row, index) => {
        requiredColumns.forEach(col => {
          if (col in row) {
            const value = row[col];
            if (value === undefined || value === null || value === '') {
              validation.issues.push(`Row ${index + 1}: Missing value for ${col}`);
              hasDataIssues = true;
            }
          }
        });
      });

      if (hasDataIssues) {
        validation.isValid = false;
      }

      console.log('✅ Validation completed:', validation.isValid ? 'VALID' : 'INVALID');

      res.json({
        success: true,
        validation
      });

    } finally {
      // Clean up uploaded file
      try {
        await fs.unlink(req.file.path);
      } catch (cleanupError) {
        console.warn('⚠️ Failed to clean up validation file:', cleanupError);
      }
    }

  } catch (error) {
    console.error('❌ Validation error:', error);
    
    // Clean up file on error
    if (req.file && req.file.path) {
      try {
        await fs.unlink(req.file.path);
      } catch (cleanupError) {
        console.warn('⚠️ Failed to clean up file on error:', cleanupError);
      }
    }

    res.status(500).json({
      success: false,
      error: 'Validation failed',
      details: error.message
    });
  }
});

/**
 * Health check for marketing analysis service
 * GET /api/marketing-analysis/health
 */
router.get('/health', (req, res) => {
  res.json({
    success: true,
    service: 'Marketing Analysis API',
    status: 'healthy',
    timestamp: new Date().toISOString(),
    features: [
      'CSV file upload and analysis',
      'Performance metrics calculation',
      'Channel and campaign analysis',
      'User journey analysis',
      'Trend identification',
      'Insights generation',
      'File validation'
    ]
  });
});

module.exports = router;