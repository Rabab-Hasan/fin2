const express = require('express');
const router = express.Router();
const db = require('../database-sqlite');
const path = require('path');

// Create campaigns table if it doesn't exist
const createCampaignsTable = () => {
  const createTableSQL = `
    CREATE TABLE IF NOT EXISTS campaigns (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      budget DECIMAL(10,2) NOT NULL,
      product TEXT NOT NULL,
      objective TEXT NOT NULL,
      narrative TEXT NOT NULL,
      concept TEXT NOT NULL,
      tagline TEXT NOT NULL,
      hero_artwork_path TEXT,
      manager_id TEXT NOT NULL,
      manager_name TEXT NOT NULL,
      activities TEXT NOT NULL, -- JSON string of activities array
      requires_internal_approval BOOLEAN DEFAULT 0,
      requires_client_approval BOOLEAN DEFAULT 0,
      ai_validated BOOLEAN DEFAULT 0,
      ai_score INTEGER,
      ai_suggestions TEXT, -- JSON string of suggestions array
      client_id TEXT NOT NULL,
      status TEXT DEFAULT 'draft', -- draft, active, paused, completed
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `;
  
  try {
    db.exec(createTableSQL);
    console.log('Campaigns table created or verified successfully');
  } catch (error) {
    console.error('Error creating campaigns table:', error);
  }
};

// Initialize table
createCampaignsTable();

// GET /api/campaigns - Get all campaigns for a client
router.get('/', (req, res) => {
  try {
    const { clientId } = req.query;
    
    if (!clientId) {
      return res.status(400).json({ error: 'Client ID is required' });
    }

    const campaigns = db.prepare(`
      SELECT * FROM campaigns 
      WHERE client_id = ? 
      ORDER BY created_at DESC
    `).all(clientId);

    // Parse JSON fields
    const formattedCampaigns = campaigns.map(campaign => ({
      ...campaign,
      activities: JSON.parse(campaign.activities || '[]'),
      ai_suggestions: campaign.ai_suggestions ? JSON.parse(campaign.ai_suggestions) : []
    }));

    res.json({ campaigns: formattedCampaigns });
  } catch (error) {
    console.error('Get campaigns error:', error);
    res.status(500).json({ error: 'Failed to fetch campaigns' });
  }
});

// GET /api/campaigns/:id - Get a specific campaign
router.get('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { clientId } = req.query;

    if (!clientId) {
      return res.status(400).json({ error: 'Client ID is required' });
    }

    const campaign = db.prepare(`
      SELECT * FROM campaigns 
      WHERE id = ? AND client_id = ?
    `).get(id, clientId);

    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    // Parse JSON fields
    const formattedCampaign = {
      ...campaign,
      activities: JSON.parse(campaign.activities || '[]'),
      ai_suggestions: campaign.ai_suggestions ? JSON.parse(campaign.ai_suggestions) : []
    };

    res.json(formattedCampaign);
  } catch (error) {
    console.error('Get campaign error:', error);
    res.status(500).json({ error: 'Failed to fetch campaign' });
  }
});

// POST /api/campaigns - Create a new campaign
router.post('/', (req, res) => {
  try {
    const {
      name,
      type,
      budget,
      product,
      objective,
      narrative,
      concept,
      tagline,
      managerId,
      managerName,
      activities = [],
      requiresInternalApproval = false,
      requiresClientApproval = false,
      aiValidated = false,
      aiScore,
      aiSuggestions = [],
      clientId
    } = req.body;

    // Validation
    if (!name || !type || !budget || !product || !objective || !narrative || !concept || !tagline || !managerId || !managerName || !clientId) {
      return res.status(400).json({ 
        error: 'Missing required fields: name, type, budget, product, objective, narrative, concept, tagline, managerId, managerName, clientId' 
      });
    }

    // Insert campaign
    const insertSQL = `
      INSERT INTO campaigns (
        name, type, budget, product, objective, narrative, concept, tagline,
        manager_id, manager_name, activities, requires_internal_approval, 
        requires_client_approval, ai_validated, ai_score, ai_suggestions, 
        client_id, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const result = db.prepare(insertSQL).run(
      name,
      type,
      budget,
      product,
      objective,
      narrative,
      concept,
      tagline,
      managerId,
      managerName,
      JSON.stringify(activities),
      requiresInternalApproval ? 1 : 0,
      requiresClientApproval ? 1 : 0,
      aiValidated ? 1 : 0,
      aiScore || null,
      JSON.stringify(aiSuggestions),
      clientId,
      'active'
    );

    // Get the created campaign
    const campaign = db.prepare('SELECT * FROM campaigns WHERE id = ?').get(result.lastInsertRowid);

    // Parse JSON fields for response
    const formattedCampaign = {
      ...campaign,
      activities: JSON.parse(campaign.activities || '[]'),
      ai_suggestions: campaign.ai_suggestions ? JSON.parse(campaign.ai_suggestions) : []
    };

    res.status(201).json({
      message: 'Campaign created successfully',
      campaign: formattedCampaign
    });
  } catch (error) {
    console.error('Create campaign error:', error);
    res.status(500).json({ error: 'Failed to create campaign' });
  }
});

// PUT /api/campaigns/:id - Update a campaign
router.put('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      type,
      budget,
      product,
      objective,
      narrative,
      concept,
      tagline,
      managerId,
      managerName,
      activities,
      requiresInternalApproval,
      requiresClientApproval,
      aiValidated,
      aiScore,
      aiSuggestions,
      status,
      clientId
    } = req.body;

    if (!clientId) {
      return res.status(400).json({ error: 'Client ID is required' });
    }

    // Check if campaign exists and belongs to client
    const existingCampaign = db.prepare(`
      SELECT * FROM campaigns WHERE id = ? AND client_id = ?
    `).get(id, clientId);

    if (!existingCampaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    // Update campaign
    const updateSQL = `
      UPDATE campaigns SET
        name = COALESCE(?, name),
        type = COALESCE(?, type),
        budget = COALESCE(?, budget),
        product = COALESCE(?, product),
        objective = COALESCE(?, objective),
        narrative = COALESCE(?, narrative),
        concept = COALESCE(?, concept),
        tagline = COALESCE(?, tagline),
        manager_id = COALESCE(?, manager_id),
        manager_name = COALESCE(?, manager_name),
        activities = COALESCE(?, activities),
        requires_internal_approval = COALESCE(?, requires_internal_approval),
        requires_client_approval = COALESCE(?, requires_client_approval),
        ai_validated = COALESCE(?, ai_validated),
        ai_score = COALESCE(?, ai_score),
        ai_suggestions = COALESCE(?, ai_suggestions),
        status = COALESCE(?, status),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND client_id = ?
    `;

    db.prepare(updateSQL).run(
      name || null,
      type || null,
      budget || null,
      product || null,
      objective || null,
      narrative || null,
      concept || null,
      tagline || null,
      managerId || null,
      managerName || null,
      activities ? JSON.stringify(activities) : null,
      requiresInternalApproval !== undefined ? (requiresInternalApproval ? 1 : 0) : null,
      requiresClientApproval !== undefined ? (requiresClientApproval ? 1 : 0) : null,
      aiValidated !== undefined ? (aiValidated ? 1 : 0) : null,
      aiScore || null,
      aiSuggestions ? JSON.stringify(aiSuggestions) : null,
      status || null,
      id,
      clientId
    );

    // Get updated campaign
    const updatedCampaign = db.prepare('SELECT * FROM campaigns WHERE id = ?').get(id);

    // Parse JSON fields
    const formattedCampaign = {
      ...updatedCampaign,
      activities: JSON.parse(updatedCampaign.activities || '[]'),
      ai_suggestions: updatedCampaign.ai_suggestions ? JSON.parse(updatedCampaign.ai_suggestions) : []
    };

    res.json({
      message: 'Campaign updated successfully',
      campaign: formattedCampaign
    });
  } catch (error) {
    console.error('Update campaign error:', error);
    res.status(500).json({ error: 'Failed to update campaign' });
  }
});

// DELETE /api/campaigns/:id - Delete a campaign
router.delete('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { clientId } = req.query;

    if (!clientId) {
      return res.status(400).json({ error: 'Client ID is required' });
    }

    // Check if campaign exists and belongs to client
    const existingCampaign = db.prepare(`
      SELECT * FROM campaigns WHERE id = ? AND client_id = ?
    `).get(id, clientId);

    if (!existingCampaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    // Delete campaign
    db.prepare('DELETE FROM campaigns WHERE id = ? AND client_id = ?').run(id, clientId);

    res.json({ message: 'Campaign deleted successfully' });
  } catch (error) {
    console.error('Delete campaign error:', error);
    res.status(500).json({ error: 'Failed to delete campaign' });
  }
});

// POST /api/campaigns/:id/validate - AI validate a campaign
router.post('/:id/validate', (req, res) => {
  try {
    const { id } = req.params;
    const { clientId } = req.body;

    if (!clientId) {
      return res.status(400).json({ error: 'Client ID is required' });
    }

    // Get campaign
    const campaign = db.prepare(`
      SELECT * FROM campaigns WHERE id = ? AND client_id = ?
    `).get(id, clientId);

    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    // Simulate AI validation logic
    const aiScore = Math.floor(Math.random() * 20) + 80; // Score between 80-100
    const aiSuggestions = [
      'Consider expanding your target audience demographic analysis',
      'Budget allocation appears optimal for selected marketing activities',
      'Campaign narrative aligns well with current market trends',
      'Recommended to include A/B testing for creative elements'
    ];

    // Update campaign with AI validation results
    db.prepare(`
      UPDATE campaigns SET
        ai_validated = 1,
        ai_score = ?,
        ai_suggestions = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND client_id = ?
    `).run(aiScore, JSON.stringify(aiSuggestions), id, clientId);

    res.json({
      message: 'Campaign validated successfully',
      aiScore,
      aiSuggestions
    });
  } catch (error) {
    console.error('AI validation error:', error);
    res.status(500).json({ error: 'Failed to validate campaign' });
  }
});

module.exports = router;