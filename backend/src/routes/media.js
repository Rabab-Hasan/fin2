const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const crypto = require('crypto');
const pool = require('../database-sqlite');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../uploads/media');
    // Create directory if it doesn't exist
    fs.mkdir(uploadPath, { recursive: true })
      .then(() => cb(null, uploadPath))
      .catch(cb);
  },
  filename: (req, file, cb) => {
    // Generate unique filename
    const uniqueSuffix = crypto.randomBytes(16).toString('hex');
    const ext = path.extname(file.originalname);
    cb(null, `${uniqueSuffix}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow images, videos, and documents
    const allowedTypes = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp',
      'video/mp4', 'video/avi', 'video/mov', 'video/wmv',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only images, videos, and documents are allowed.'));
    }
  }
});

// Initialize media assets table
async function initializeMediaTable() {
  try {
    const client = await pool.connect();
    await client.query(`
      CREATE TABLE IF NOT EXISTS media_assets (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        original_name TEXT NOT NULL,
        type TEXT NOT NULL,
        mime_type TEXT NOT NULL,
        size INTEGER NOT NULL,
        file_path TEXT NOT NULL,
        url TEXT NOT NULL,
        thumbnail_url TEXT,
        stage TEXT NOT NULL,
        tags TEXT,
        description TEXT,
        status TEXT DEFAULT 'active',
        upload_date DATETIME DEFAULT CURRENT_TIMESTAMP,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    client.release();
    console.log('Media assets table initialized');
  } catch (error) {
    console.error('Error initializing media assets table:', error);
  }
}

// Initialize table on module load
// (Note: This will be called when the route is first accessed)

// Helper function to determine file type
function getFileType(mimetype) {
  if (mimetype.startsWith('image/')) return 'image';
  if (mimetype.startsWith('video/')) return 'video';
  return 'document';
}

// Helper function to generate thumbnail for images
async function generateThumbnail(filePath, filename) {
  // For now, return the same URL for images
  // In production, you'd want to generate actual thumbnails
  const ext = path.extname(filename).toLowerCase();
  if (['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(ext)) {
    return `/api/media/file/${filename}`;
  }
  return null;
}

// GET /api/media - Get all media assets
router.get('/', async (req, res) => {
  try {
    const { stage, search, status = 'active' } = req.query;
    
    let query = 'SELECT * FROM media_assets WHERE status = ?';
    let params = [status];
    
    if (stage && stage !== 'all') {
      query += ' AND stage = ?';
      params.push(stage);
    }
    
    if (search) {
      query += ' AND (name LIKE ? OR tags LIKE ? OR description LIKE ?)';
      const searchPattern = `%${search}%`;
      params.push(searchPattern, searchPattern, searchPattern);
    }
    
    query += ' ORDER BY upload_date DESC';
    
    const client = await pool.connect();
    const result = await client.query(query, params);
    client.release();
    
    // Parse tags for each asset
    const assetsWithParsedTags = result.rows.map(asset => ({
      ...asset,
      tags: asset.tags ? asset.tags.split(',').map(tag => tag.trim()) : []
    }));
    
    res.json({ assets: assetsWithParsedTags });
  } catch (error) {
    console.error('Error fetching media assets:', error);
    res.status(500).json({ error: 'Failed to fetch media assets' });
  }
});

// GET /api/media/:id - Get specific media asset
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const client = await pool.connect();
    const result = await client.query('SELECT * FROM media_assets WHERE id = ?', [id]);
    client.release();
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Media asset not found' });
    }
    
    const asset = result.rows[0];
    asset.tags = asset.tags ? asset.tags.split(',').map(tag => tag.trim()) : [];
    
    res.json({ asset });
  } catch (error) {
    console.error('Error fetching media asset:', error);
    res.status(500).json({ error: 'Failed to fetch media asset' });
  }
});

// POST /api/media/upload - Upload new media asset
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    const { stage, tags, description, status = 'active' } = req.body;
    
    if (!stage) {
      return res.status(400).json({ error: 'Stage is required' });
    }
    
    const id = crypto.randomBytes(16).toString('hex');
    const fileType = getFileType(req.file.mimetype);
    const url = `/api/media/file/${req.file.filename}`;
    const thumbnailUrl = await generateThumbnail(req.file.path, req.file.filename);
    
    // Insert into database
    const client = await pool.connect();
    await client.query(`
      INSERT INTO media_assets (
        id, name, original_name, type, mime_type, size, file_path, url, 
        thumbnail_url, stage, tags, description, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      id,
      req.file.filename,
      req.file.originalname,
      fileType,
      req.file.mimetype,
      req.file.size,
      req.file.path,
      url,
      thumbnailUrl,
      stage,
      tags || '',
      description || '',
      status
    ]);
    
    // Fetch the created asset
    const result = await client.query('SELECT * FROM media_assets WHERE id = ?', [id]);
    client.release();
    const asset = result.rows[0];
    asset.tags = asset.tags ? asset.tags.split(',').map(tag => tag.trim()) : [];
    
    res.status(201).json({ 
      message: 'File uploaded successfully',
      asset 
    });
  } catch (error) {
    console.error('Error uploading media asset:', error);
    res.status(500).json({ error: 'Failed to upload media asset' });
  }
});

// PUT /api/media/:id - Update media asset metadata
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { stage, tags, description, status } = req.body;
    
    const client = await pool.connect();
    
    // Check if asset exists
    const existingResult = await client.query('SELECT * FROM media_assets WHERE id = ?', [id]);
    if (existingResult.rows.length === 0) {
      client.release();
      return res.status(404).json({ error: 'Media asset not found' });
    }
    
    // Update asset
    await client.query(`
      UPDATE media_assets 
      SET stage = ?, tags = ?, description = ?, status = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [stage, tags || '', description || '', status || 'active', id]);
    
    // Fetch updated asset
    const result = await client.query('SELECT * FROM media_assets WHERE id = ?', [id]);
    client.release();
    const asset = result.rows[0];
    asset.tags = asset.tags ? asset.tags.split(',').map(tag => tag.trim()) : [];
    
    res.json({ 
      message: 'Media asset updated successfully',
      asset 
    });
  } catch (error) {
    console.error('Error updating media asset:', error);
    res.status(500).json({ error: 'Failed to update media asset' });
  }
});

// DELETE /api/media/:id - Delete media asset
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const client = await pool.connect();
    
    // Get asset info before deletion
    const result = await client.query('SELECT * FROM media_assets WHERE id = ?', [id]);
    if (result.rows.length === 0) {
      client.release();
      return res.status(404).json({ error: 'Media asset not found' });
    }
    
    const asset = result.rows[0];
    
    // Delete file from filesystem
    try {
      await fs.unlink(asset.file_path);
    } catch (fileError) {
      console.warn('Failed to delete file from filesystem:', fileError);
    }
    
    // Delete from database
    await client.query('DELETE FROM media_assets WHERE id = ?', [id]);
    client.release();
    
    res.json({ message: 'Media asset deleted successfully' });
  } catch (error) {
    console.error('Error deleting media asset:', error);
    res.status(500).json({ error: 'Failed to delete media asset' });
  }
});

// GET /api/media/file/:filename - Serve media files
router.get('/file/:filename', async (req, res) => {
  try {
    const { filename } = req.params;
    const filePath = path.join(__dirname, '../uploads/media', filename);
    
    // Check if file exists
    try {
      await fs.access(filePath);
    } catch {
      return res.status(404).json({ error: 'File not found' });
    }
    
    // Get file info from database for proper content type
    const client = await pool.connect();
    const result = await client.query('SELECT mime_type FROM media_assets WHERE name = ?', [filename]);
    client.release();
    if (result.rows.length > 0) {
      res.setHeader('Content-Type', result.rows[0].mime_type);
    }
    
    res.sendFile(filePath);
  } catch (error) {
    console.error('Error serving media file:', error);
    res.status(500).json({ error: 'Failed to serve media file' });
  }
});

// GET /api/media/stats - Get media asset statistics
router.get('/stats/overview', async (req, res) => {
  try {
    const client = await pool.connect();
    const totalResult = await client.query('SELECT COUNT(*) as count FROM media_assets WHERE status = "active"');
    const stageResult = await client.query(`
      SELECT stage, COUNT(*) as count 
      FROM media_assets 
      WHERE status = "active" 
      GROUP BY stage
    `);
    const typeResult = await client.query(`
      SELECT type, COUNT(*) as count 
      FROM media_assets 
      WHERE status = "active" 
      GROUP BY type
    `);
    const sizeResult = await client.query('SELECT SUM(size) as total_size FROM media_assets WHERE status = "active"');
    client.release();
    
    res.json({
      total_assets: totalResult.rows[0].count,
      total_size: sizeResult.rows[0].total_size || 0,
      assets_by_stage: stageResult.rows,
      assets_by_type: typeResult.rows
    });
  } catch (error) {
    console.error('Error fetching media stats:', error);
    res.status(500).json({ error: 'Failed to fetch media statistics' });
  }
});

module.exports = router;
module.exports.initializeMediaTable = initializeMediaTable;