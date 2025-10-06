const express = require('express');
const router = express.Router();
const pool = require('../database');
const { getDb } = require('../database-mongo');
const { ObjectId } = require('mongodb');
const { createCampaignAssignmentNotification } = require('./notifications');

// Activity task templates - auto-generated tasks based on selected activities
const ACTIVITY_TASK_TEMPLATES = {
  'video_ads': [
    {
      title: 'Video Concept Development',
      description: 'Develop creative concept and storyboard for video advertisement',
      priority: 'high',
      estimatedHours: 8,
      subtasks: [
        'Create initial concept brief',
        'Develop storyboard',
        'Script writing',
        'Get concept approval'
      ]
    },
    {
      title: 'Video Production',
      description: 'Coordinate video shoot and production',
      priority: 'high',
      estimatedHours: 16,
      subtasks: [
        'Location scouting',
        'Talent casting',
        'Equipment setup',
        'Video shoot execution',
        'Post-production editing'
      ]
    }
  ],
  'photoshoot': [
    {
      title: 'Photo Concept & Planning',
      description: 'Plan photoshoot concept, styling, and logistics',
      priority: 'medium',
      estimatedHours: 6,
      subtasks: [
        'Define photo concept',
        'Location booking',
        'Model/talent selection',
        'Props and styling preparation'
      ]
    },
    {
      title: 'Photo Execution',
      description: 'Execute photoshoot and image processing',
      priority: 'medium',
      estimatedHours: 8,
      subtasks: [
        'Setup and lighting',
        'Photo session',
        'Image selection',
        'Photo editing and retouching'
      ]
    }
  ],
  'events': [
    {
      title: 'Event Planning',
      description: 'Plan and organize marketing event',
      priority: 'high',
      estimatedHours: 20,
      subtasks: [
        'Venue selection and booking',
        'Guest list management',
        'Catering arrangements',
        'AV equipment setup',
        'Event timeline creation'
      ]
    }
  ],
  'influencers': [
    {
      title: 'Influencer Campaign Management',
      description: 'Manage influencer partnerships and content',
      priority: 'medium',
      estimatedHours: 12,
      subtasks: [
        'Influencer research and outreach',
        'Contract negotiations',
        'Content brief creation',
        'Performance tracking and reporting'
      ]
    }
  ],
  'outdoor': [
    {
      title: 'Outdoor Advertising Campaign',
      description: 'Plan and execute outdoor advertising placement',
      priority: 'medium',
      estimatedHours: 10,
      subtasks: [
        'Location analysis and selection',
        'Design outdoor creative',
        'Permit acquisition',
        'Installation coordination'
      ]
    }
  ],
  'radio': [
    {
      title: 'Radio Campaign Production',
      description: 'Create and manage radio advertising campaign',
      priority: 'medium',
      estimatedHours: 8,
      subtasks: [
        'Radio script writing',
        'Voice talent selection',
        'Audio recording and editing',
        'Station booking and scheduling'
      ]
    }
  ],
  'pr': [
    {
      title: 'Public Relations Campaign',
      description: 'Manage PR strategy and media relations',
      priority: 'medium',
      estimatedHours: 15,
      subtasks: [
        'Press release creation',
        'Media list compilation',
        'Press kit preparation',
        'Media outreach and follow-up'
      ]
    }
  ],
  'sponsorships': [
    {
      title: 'Sponsorship Management',
      description: 'Manage sponsorship partnerships and activations',
      priority: 'medium',
      estimatedHours: 12,
      subtasks: [
        'Sponsorship opportunity research',
        'Partnership negotiations',
        'Activation planning',
        'ROI measurement and reporting'
      ]
    }
  ]
};

// AI validation function (placeholder - would integrate with actual AI service)
async function validateCampaignData(campaignData) {
  // This would integrate with an AI service like OpenAI, Claude, etc.
  // For now, we'll do basic validation with intelligent checks
  const validation = {
    isValid: true,
    feedback: '',
    suggestions: [],
    score: 0
  };

  let score = 0;

  // Basic validation checks
  if (!campaignData.name || campaignData.name.length < 3) {
    validation.isValid = false;
    validation.feedback += 'Campaign name must be at least 3 characters long. ';
  } else {
    score += 15;
  }

  if (!campaignData.objective || campaignData.objective.length < 10) {
    validation.isValid = false;
    validation.feedback += 'Campaign objective needs more detail (minimum 10 characters). ';
  } else {
    score += 20;
    if (campaignData.objective.length > 50) score += 5; // Bonus for detailed objective
  }

  if (!campaignData.activities || campaignData.activities.length === 0) {
    validation.isValid = false;
    validation.feedback += 'At least one marketing activity must be selected. ';
  } else {
    score += 20;
    if (campaignData.activities.length > 2) score += 10; // Bonus for diverse activities
  }

  if (campaignData.budget) {
    if (campaignData.budget < 100) {
      validation.suggestions.push('Consider if the budget is sufficient for the selected activities.');
    } else {
      score += 15;
    }
  }

  if (campaignData.narrative && campaignData.narrative.length > 20) {
    score += 10;
  }

  if (campaignData.concept && campaignData.concept.length > 20) {
    score += 10;
  }

  if (campaignData.tagline && campaignData.tagline.length > 5) {
    score += 10;
  }

  validation.score = Math.min(score, 100);

  // Mock AI suggestions based on score
  if (validation.isValid) {
    if (validation.score >= 90) {
      validation.feedback = 'Excellent campaign strategy! Well-structured with clear objectives and comprehensive activity selection.';
    } else if (validation.score >= 70) {
      validation.feedback = 'Good campaign foundation. Consider adding more detail to narrative and concept sections.';
      validation.suggestions.push('Consider expanding the campaign narrative to better tell your brand story.');
    } else {
      validation.feedback = 'Campaign strategy needs improvement. Add more details and consider additional activities.';
      validation.suggestions.push('Expand your marketing mix with complementary activities.');
      validation.suggestions.push('Provide more detailed objective and success metrics.');
    }

    validation.suggestions.push('Consider adding performance metrics to track campaign success.');
    
    // Activity-specific suggestions
    if (campaignData.activities.includes('video_ads') && campaignData.activities.includes('influencers')) {
      validation.suggestions.push('Great synergy! Video content can be repurposed for influencer partnerships.');
    }
  }

  return validation;
}

// Create auto-generated tasks for campaign
async function createCampaignTasks(campaignId, activities, clientId, createdBy) {
  const client = await pool.connect();
  const createdTasks = [];

  try {
    for (const activity of activities) {
      const taskTemplates = ACTIVITY_TASK_TEMPLATES[activity] || [];
      
      for (const template of taskTemplates) {
        // Create main task using correct schema
        const taskId = `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const currentTime = new Date().toISOString();
        
        await client.query(`
          INSERT INTO tasks (
            id, title, description, status, assignee, deadline,
            client_comments, action_labs_comments, link, parent_id, client_id,
            visible_to_client, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          taskId,
          template.title,
          template.description,
          'todo', // default status
          null, // no assignee initially
          null, // no deadline initially
          null, // no client comments
          `Campaign Task - ${activity} - Priority: ${template.priority}`, // action labs comments
          null, // no link initially
          null, // no parent task
          clientId,
          1, // visible to client by default
          currentTime,
          currentTime
        ]);

        // Link task to campaign using the generated taskId
        await client.query(`
          INSERT INTO campaign_tasks (campaign_id, task_id, activity_type)
          VALUES (?, ?, ?)
        `, [campaignId, taskId, activity]);

        // Create subtasks if they exist
        if (template.subtasks && template.subtasks.length > 0) {
          for (const subtaskTitle of template.subtasks) {
            const subtaskResult = await client.query(`
              INSERT INTO tasks (
                title, description, priority, parent_task_id,
                client_id, created_by, visible_to_client, category
              ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
              RETURNING id
            `, [
              subtaskTitle,
              `Subtask of ${template.title}`,
              'medium',
              taskId,
              clientId,
              createdBy,
              1,
              activity
            ]);

            // Link subtask to campaign as well
            await client.query(`
              INSERT INTO campaign_tasks (campaign_id, task_id, activity_type)
              VALUES ($1, $2, $3)
            `, [campaignId, subtaskResult.rows[0].id, activity]);
          }
        }

        createdTasks.push({
          id: taskId,
          title: template.title,
          activity: activity
        });
      }
    }

    client.release();
    return createdTasks;
  } catch (error) {
    client.release();
    throw error;
  }
}

// GET /api/campaigns - Get all campaigns for a client
router.get('/', async (req, res) => {
  try {
    const { client_id } = req.query;
    
    if (!client_id) {
      return res.status(400).json({ error: 'Client ID is required' });
    }

    const client = await pool.connect();
    const result = await client.query(`
      SELECT c.*, u.name as account_manager_name
      FROM campaigns c
      LEFT JOIN users u ON c.account_manager_id = u.id
      WHERE c.client_id = $1
      ORDER BY c.created_at DESC
    `, [client_id]);

    client.release();

    // Parse activities JSON for each campaign
    const campaigns = result.rows.map(campaign => ({
      ...campaign,
      activities: campaign.activities ? JSON.parse(campaign.activities) : []
    }));

    res.json(campaigns);
  } catch (error) {
    console.error('Error fetching campaigns:', error);
    res.status(500).json({ error: 'Failed to fetch campaigns' });
  }
});

// POST /api/campaigns/:id/validate - AI validation endpoint
router.post('/:id/validate', async (req, res) => {
  try {
    const { id } = req.params;
    const campaignData = req.body;

    const validation = await validateCampaignData(campaignData);

    // Update campaign with validation results if campaign exists
    if (id !== 'new') {
      const client = await pool.connect();
      await client.query(`
        UPDATE campaigns 
        SET ai_validation_passed = $1, ai_validation_feedback = $2, updated_at = CURRENT_TIMESTAMP
        WHERE id = $3
      `, [validation.isValid ? 1 : 0, validation.feedback, id]);
      client.release();
    }

    res.json(validation);
  } catch (error) {
    console.error('Error validating campaign:', error);
    res.status(500).json({ error: 'Failed to validate campaign' });
  }
});

// GET /api/campaigns/:id - Get a specific campaign
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const client = await pool.connect();
    const result = await client.query(`
      SELECT c.*, u.name as account_manager_name
      FROM campaigns c
      LEFT JOIN users u ON c.account_manager_id = u.id
      WHERE c.id = $1
    `, [id]);

    if (result.rows.length === 0) {
      client.release();
      return res.status(404).json({ error: 'Campaign not found' });
    }

    const campaign = {
      ...result.rows[0],
      activities: result.rows[0].activities ? JSON.parse(result.rows[0].activities) : []
    };

    // Get campaign tasks
    const tasksResult = await client.query(`
      SELECT t.*, ct.activity_type, ct.is_auto_generated
      FROM tasks t
      JOIN campaign_tasks ct ON t.id = ct.task_id
      WHERE ct.campaign_id = $1
      ORDER BY t.created_at DESC
    `, [id]);

    campaign.tasks = tasksResult.rows;

    // Get approval status
    const approvalsResult = await client.query(`
      SELECT * FROM campaign_approvals WHERE campaign_id = $1
    `, [id]);

    campaign.approvals = approvalsResult.rows;

    client.release();
    res.json(campaign);
  } catch (error) {
    console.error('Error fetching campaign:', error);
    res.status(500).json({ error: 'Failed to fetch campaign' });
  }
});

// POST /api/campaigns - Create new campaign
router.post('/', async (req, res) => {
  try {
    const {
      name,
      type,
      budget,
      productService,
      objective,
      narrative,
      concept,
      tagline,
      heroArtwork,
      accountManagerId,
      activities,
      internalApprovalRequired,
      clientApprovalRequired,
      clientId,
      createdBy
    } = req.body;

    // Validate required fields
    if (!name || !accountManagerId || !clientId) {
      return res.status(400).json({ 
        error: 'Campaign name, account manager, and client are required' 
      });
    }

    // AI validation
    const aiValidation = await validateCampaignData({
      name, objective, activities, budget, narrative, concept, tagline
    });

    const client = await pool.connect();

    // Check if account manager exists (MongoDB users)
    let isValidManager = false;
    try {
      console.log('Validating account manager ID:', accountManagerId, 'Type:', typeof accountManagerId);
      const mongoDb = await getDb();
      const usersCollection = mongoDb.collection('users');
      
      // Try multiple approaches to find the user
      let manager = null;
      
      // Define valid account manager roles and user_types
      const validRoles = ['employee', 'admin', 'hr', 'manager', 'supervisor', 'head_of_marketing'];
      const validUserTypes = ['employee', 'admin'];
      
      // First find the user by ID (either ObjectId or string)
      let userFound = null;
      
      try {
        if (ObjectId.isValid(accountManagerId)) {
          userFound = await usersCollection.findOne({ _id: new ObjectId(accountManagerId) });
          console.log('Found user with ObjectId:', !!userFound);
        }
        
        if (!userFound) {
          userFound = await usersCollection.findOne({ _id: accountManagerId });
          console.log('Found user with string ID:', !!userFound);
        }
        
        if (userFound) {
          console.log('User details:', {
            name: userFound.name,
            role: userFound.role,
            user_type: userFound.user_type,
            email: userFound.email
          });
          
          // Check if user is eligible to be account manager
          const hasValidRole = userFound.role && validRoles.includes(userFound.role);
          const hasValidUserType = userFound.user_type && validUserTypes.includes(userFound.user_type);
          const isNotClient = userFound.role !== 'client' && userFound.user_type !== 'client';
          
          // Accept user if:
          // 1. They have a valid role, OR
          // 2. They have a valid user_type, OR  
          // 3. They're not a client (for backward compatibility)
          if (hasValidRole || hasValidUserType || (isNotClient && !userFound.role)) {
            manager = userFound;
            console.log('✅ User accepted as account manager:', {
              reason: hasValidRole ? `valid role: ${userFound.role}` : 
                      hasValidUserType ? `valid user_type: ${userFound.user_type}` : 
                      'not a client user'
            });
          } else {
            console.log('❌ User rejected as account manager:', {
              role: userFound.role,
              user_type: userFound.user_type,
              reason: 'Not eligible for account management'
            });
          }
        } else {
          console.log('❌ No user found with ID:', accountManagerId);
        }
        
      } catch (error) {
        console.log('Error finding user:', error.message);
      }
      
      isValidManager = !!manager;
      if (manager) {
        console.log('Found manager:', manager.name || manager.username, 'Role:', manager.role);
      } else {
        console.log('No manager found with ID:', accountManagerId);
        // Let's also log all users to debug
        const allUsers = await usersCollection.find({}, { projection: { _id: 1, name: 1, username: 1, role: 1 } }).toArray();
        console.log('Available users:', allUsers.map(u => ({ id: u._id, name: u.name || u.username, role: u.role })));
      }
      
    } catch (mongoError) {
      console.error('MongoDB user validation error:', mongoError);
      isValidManager = false;
    }

    if (!isValidManager) {
      client.release();
      return res.status(400).json({ 
        error: `Account manager validation failed. Please check the server logs for details and try again.` 
      });
    }

    // Create campaign
    const campaignResult = await client.query(`
      INSERT INTO campaigns (
        name, type, budget, product_service, objective, narrative, concept,
        tagline, hero_artwork, account_manager_id, activities,
        internal_approval_required, client_approval_required,
        ai_validation_passed, ai_validation_feedback,
        client_id, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
      RETURNING id
    `, [
      name, type, budget, productService, objective, narrative, concept,
      tagline, heroArtwork, accountManagerId, JSON.stringify(activities || []),
      internalApprovalRequired ? 1 : 0, clientApprovalRequired ? 1 : 0,
      aiValidation.isValid ? 1 : 0, aiValidation.feedback,
      clientId, createdBy
    ]);

    const campaignId = campaignResult.rows[0].id;

    // Create approval records if required
    if (internalApprovalRequired) {
      await client.query(`
        INSERT INTO campaign_approvals (campaign_id, approval_type)
        VALUES ($1, 'internal')
      `, [campaignId]);
    }

    if (clientApprovalRequired) {
      await client.query(`
        INSERT INTO campaign_approvals (campaign_id, approval_type)
        VALUES ($1, 'client')
      `, [campaignId]);
    }

    client.release();

    // Generate auto tasks based on activities
    let createdTasks = [];
    if (activities && activities.length > 0) {
      try {
        createdTasks = await createCampaignTasks(campaignId, activities, clientId, createdBy);
      } catch (taskError) {
        console.error('Error creating campaign tasks:', taskError);
        // Don't fail the campaign creation if task creation fails
      }
    }

    // Send notification to account manager
    try {
      await createCampaignAssignmentNotification(accountManagerId, name, campaignId, createdBy);
      console.log('✅ Campaign assignment notification sent to:', accountManagerId);
    } catch (notificationError) {
      console.error('⚠️ Failed to send campaign assignment notification:', notificationError);
      // Don't fail the campaign creation if notification fails
    }

    res.status(201).json({
      success: true,
      campaignId,
      message: 'Campaign created successfully',
      aiValidation,
      tasksCreated: createdTasks.length,
      tasks: createdTasks
    });

  } catch (error) {
    console.error('Error creating campaign:', error);
    res.status(500).json({ error: 'Failed to create campaign' });
  }
});

// GET /api/campaigns/:id/tasks - Get tasks for a specific campaign
router.get('/:id/tasks', async (req, res) => {
  try {
    const { id: campaignId } = req.params;
    const { client_id } = req.query;

    if (!client_id) {
      return res.status(400).json({ error: 'Client ID is required' });
    }

    const client = await pool.connect();
    
    // Get campaign tasks with full task details
    const result = await client.query(`
      SELECT t.*, ct.activity_type, c.name as campaign_name
      FROM tasks t
      INNER JOIN campaign_tasks ct ON t.id = ct.task_id
      INNER JOIN campaigns c ON ct.campaign_id = c.id
      WHERE ct.campaign_id = ? AND t.client_id = ?
      ORDER BY t.created_at ASC
    `, [campaignId, client_id]);

    client.release();
    
    const tasks = result.map(task => ({
      id: task.id,
      title: task.title,
      description: task.description,
      status: task.status,
      assignee: task.assignee,
      deadline: task.deadline,
      clientComments: task.client_comments,
      actionLabsComments: task.action_labs_comments,
      link: task.link,
      parentId: task.parent_id,
      visibleToClient: task.visible_to_client === 1,
      createdAt: task.created_at,
      updatedAt: task.updated_at,
      activityType: task.activity_type,
      campaignName: task.campaign_name
    }));

    res.json({ tasks });

  } catch (error) {
    console.error('Error fetching campaign tasks:', error);
    res.status(500).json({ error: 'Failed to fetch campaign tasks' });
  }
});

// Link a task to a campaign
router.post('/tasks/link', async (req, res) => {
  try {
    const { campaignId, taskId, activityType = 'custom' } = req.body;

    if (!campaignId || !taskId) {
      return res.status(400).json({ error: 'Campaign ID and Task ID are required' });
    }

    // Check if campaign exists
    const campaignResult = await pool.query('SELECT id FROM campaigns WHERE id = ?', [campaignId]);
    if (campaignResult.length === 0) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    // Check if link already exists
    const existingLink = await pool.query(
      'SELECT * FROM campaign_tasks WHERE campaign_id = ? AND task_id = ?',
      [campaignId, taskId]
    );

    if (existingLink.length > 0) {
      return res.status(409).json({ error: 'Task is already linked to this campaign' });
    }

    // Create the link
    await pool.query(
      'INSERT INTO campaign_tasks (campaign_id, task_id, activity_type) VALUES (?, ?, ?)',
      [campaignId, taskId, activityType]
    );

    res.json({ 
      success: true, 
      message: 'Task linked to campaign successfully',
      campaignId,
      taskId,
      activityType
    });

  } catch (error) {
    console.error('Error linking task to campaign:', error);
    res.status(500).json({ error: 'Failed to link task to campaign' });
  }
});

module.exports = router;