const express = require('express');
const router = express.Router();
const pool = require('../database-sqlite');

// GET /api/roadmap/assets - Get media assets organized as roadmap for a client
router.get('/assets', async (req, res) => {
  try {
    const { clientId } = req.query;
    
    if (!clientId) {
      return res.status(400).json({ error: 'Client ID is required' });
    }
    
    const client = await pool.connect();
    
    // Fetch all media assets and transform them into roadmap format
    const result = await client.query(
      'SELECT * FROM media_assets WHERE status = "active" ORDER BY upload_date'
    );
    client.release();
    
    const assets = result.rows.map(row => {
      // Parse tags to extract channel information
      const tags = row.tags ? row.tags.split(',').map(tag => tag.trim()) : [];
      const channelTag = tags.find(tag => 
        ['instagram', 'facebook', 'tiktok', 'email', 'website', 'sms', 'youtube'].includes(tag.toLowerCase())
      );
      
      // Determine campaign from tags or use default
      const campaignTag = tags.find(tag => 
        ['credit-card', 'insurance', 'new-product'].includes(tag.toLowerCase())
      );
      
      return {
        id: row.id,
        title: row.name,
        dueDate: row.upload_date, // Use upload date as due date for now
        channel: channelTag ? channelTag.charAt(0).toUpperCase() + channelTag.slice(1) : 'Website',
        funnelStage: row.stage || 'awareness', // Use existing stage from media assets
        campaign: campaignTag || 'new-product',
        description: row.description || '',
        startDate: row.upload_date,
        type: row.type,
        url: row.url,
        thumbnailUrl: row.thumbnail_url,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      };
    });
    
    res.json({ assets });
  } catch (error) {
    console.error('Error fetching roadmap assets:', error);
    res.status(500).json({ error: 'Failed to fetch roadmap assets' });
  }
});

// POST /api/roadmap/assets - Update roadmap position for existing media asset
router.post('/assets', async (req, res) => {
  try {
    const { assetId, funnelStage, startDate, dueDate, campaign } = req.body;
    
    if (!assetId || !funnelStage) {
      return res.status(400).json({ error: 'Asset ID and funnel stage are required' });
    }
    
    const client = await pool.connect();
    
    // Update the media asset with roadmap information
    await client.query(
      `UPDATE media_assets 
       SET stage = ?, 
           metadata = json_set(COALESCE(metadata, '{}'), '$.startDate', ?, '$.dueDate', ?, '$.campaign', ?)
       WHERE id = ?`,
      [funnelStage, startDate, dueDate, campaign, assetId]
    );
    
    client.release();
    
    res.json({ success: true, message: 'Asset roadmap position updated' });
  } catch (error) {
    console.error('Error updating roadmap asset:', error);
    res.status(500).json({ error: 'Failed to update roadmap asset' });
  }
});

// PUT /api/roadmap/assets/:id - Update media asset roadmap information
router.put('/assets/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      funnelStage,
      startDate,
      dueDate,
      campaign
    } = req.body;
    
    const client = await pool.connect();
    
    // Update the media asset with roadmap information
    await client.query(
      `UPDATE media_assets 
       SET stage = ?, 
           metadata = json_set(COALESCE(metadata, '{}'), '$.startDate', ?, '$.dueDate', ?, '$.campaign', ?),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [funnelStage, startDate, dueDate, campaign, id]
    );
    
    // Return the updated asset
    const result = await client.query('SELECT * FROM media_assets WHERE id = ?', [id]);
    client.release();
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Asset not found' });
    }
    
    const row = result.rows[0];
    const metadata = row.metadata ? JSON.parse(row.metadata) : {};
    
    const updatedAsset = {
      id: row.id,
      title: row.name,
      dueDate: metadata.dueDate || row.upload_date,
      channel: 'Website', // Default channel, could be enhanced
      funnelStage: row.stage || 'awareness',
      campaign: metadata.campaign || 'new-product',
      description: row.description || '',
      startDate: metadata.startDate || row.upload_date,
      type: row.type,
      url: row.url,
      thumbnailUrl: row.thumbnail_url,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
    
    res.json({ asset: updatedAsset });
  } catch (error) {
    console.error('Error updating roadmap asset:', error);
    res.status(500).json({ error: 'Failed to update roadmap asset' });
  }
});

// DELETE /api/roadmap/assets/:id - Remove asset from roadmap (reset stage)
router.delete('/assets/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const client = await pool.connect();
    
    // Reset the media asset's roadmap information instead of deleting
    await client.query(
      `UPDATE media_assets 
       SET stage = 'awareness', 
           metadata = json_remove(COALESCE(metadata, '{}'), '$.startDate', '$.dueDate', '$.campaign')
       WHERE id = ?`,
      [id]
    );
    
    client.release();
    
    res.json({ message: 'Asset removed from roadmap successfully' });
  } catch (error) {
    console.error('Error removing roadmap asset:', error);
    res.status(500).json({ error: 'Failed to remove roadmap asset' });
  }
});

// GET /api/roadmap/export - Export roadmap from media assets
router.get('/export', async (req, res) => {
  try {
    const { format, clientId } = req.query;
    
    if (!clientId || !format) {
      return res.status(400).json({ error: 'Client ID and format are required' });
    }
    
    // Fetch media assets organized as roadmap
    const client = await pool.connect();
    const result = await client.query(
      'SELECT * FROM media_assets WHERE status = "active" ORDER BY stage, upload_date'
    );
    client.release();
    
    const assets = result.rows.map(row => {
      const metadata = row.metadata ? JSON.parse(row.metadata) : {};
      return {
        id: row.id,
        title: row.name,
        dueDate: metadata.dueDate || row.upload_date,
        channel: 'Website', // Could be enhanced with channel detection
        funnelStage: row.stage || 'awareness',
        campaign: metadata.campaign || 'new-product',
        description: row.description || '',
        startDate: metadata.startDate || row.upload_date
      };
    });
    
    if (format === 'excel') {
      // For Excel export, return CSV format for simplicity
      const csvHeaders = 'Title,Due Date,Channel,Funnel Stage,Campaign,Description,Start Date\n';
      const csvRows = assets.map(asset => 
        `"${asset.title}","${asset.dueDate}","${asset.channel}","${asset.funnelStage}","${asset.campaign}","${asset.description}","${asset.startDate}"`
      ).join('\n');
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="roadmap.csv"');
      res.send(csvHeaders + csvRows);
    } else if (format === 'pdf') {
      // For PDF export, return JSON data that can be processed by frontend
      res.json({ 
        message: 'PDF export data prepared',
        assets,
        exportFormat: 'pdf'
      });
    } else {
      res.status(400).json({ error: 'Unsupported export format' });
    }
  } catch (error) {
    console.error('Error exporting roadmap:', error);
    res.status(500).json({ error: 'Failed to export roadmap' });
  }
});

// POST /api/roadmap/sync - Refresh roadmap data from CMS
router.post('/sync', async (req, res) => {
  try {
    const { clientId } = req.query;
    
    if (!clientId) {
      return res.status(400).json({ error: 'Client ID is required' });
    }
    
    // Count active media assets that can be organized into roadmap
    const client = await pool.connect();
    const result = await client.query(
      'SELECT COUNT(*) as count FROM media_assets WHERE status = "active"'
    );
    client.release();
    
    const assetCount = result.rows[0].count;
    
    res.json({ 
      message: `Roadmap refreshed with ${assetCount} assets from Content Management`,
      assetCount 
    });
  } catch (error) {
    console.error('Error syncing roadmap:', error);
    res.status(500).json({ error: 'Failed to sync roadmap' });
  }
});

module.exports = router;