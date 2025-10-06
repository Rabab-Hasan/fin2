const express = require('express');
const router = express.Router();
const pool = require('../database');
const { getDb } = require('../database-mongo');
const { ObjectId } = require('mongodb');

// Notification types
const NOTIFICATION_TYPES = {
  CAMPAIGN_ASSIGNMENT: 'campaign_assignment',
  TASK_ASSIGNMENT: 'task_assignment',
  APPROVAL_REQUEST: 'approval_request',
  STATUS_UPDATE: 'status_update',
  SYSTEM: 'system'
};

// Create notification helper function
async function createNotification(userId, title, message, type = 'info', actionUrl = null, metadata = null) {
  try {
    console.log('📧 Creating notification for user:', userId, 'Title:', title);
    const client = await pool.connect();
    const result = await client.query(
      `INSERT INTO notifications (user_id, title, message, type, action_url, metadata, created_at) 
       VALUES ($1, $2, $3, $4, $5, $6, datetime('now'))`,
      [userId, title, message, type, actionUrl, JSON.stringify(metadata)]
    );
    client.release();
    console.log('📧 Notification created with ID:', result.lastID);
    return result.lastID;
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
}

// Create campaign assignment notification
async function createCampaignAssignmentNotification(accountManagerId, campaignName, campaignId, assignedBy) {
  try {
    // Get assignee details from MongoDB
    const mongoDb = await getDb();
    const usersCollection = mongoDb.collection('users');
    
    let manager = null;
    if (ObjectId.isValid(accountManagerId)) {
      manager = await usersCollection.findOne({ _id: new ObjectId(accountManagerId) });
    } else {
      manager = await usersCollection.findOne({ _id: accountManagerId });
    }

    if (manager) {
      const title = 'New Campaign Assignment';
      const message = `You have been assigned as Account Manager for "${campaignName}"`;
      const actionUrl = `/campaigns/${campaignId}`;
      const metadata = {
        campaignId,
        campaignName,
        assignedBy,
        assignedAt: new Date().toISOString()
      };

      return await createNotification(
        accountManagerId,
        title,
        message,
        NOTIFICATION_TYPES.CAMPAIGN_ASSIGNMENT,
        actionUrl,
        metadata
      );
    }
  } catch (error) {
    console.error('Error creating campaign assignment notification:', error);
    throw error;
  }
}

// GET /api/notifications - Get notifications for a user
router.get('/', async (req, res) => {
  try {
    const { userId, unreadOnly = false, limit = 50, offset = 0 } = req.query;

    console.log('📧 Fetching notifications for userId:', userId);

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    let query = `
      SELECT id, user_id, title, message, type, read_status, action_url, metadata, created_at, updated_at
      FROM notifications 
      WHERE user_id = $1
    `;
    
    const params = [userId];

    if (unreadOnly === 'true') {
      query += ` AND read_status = 0`;
    }

    query += ` ORDER BY created_at DESC LIMIT $2 OFFSET $3`;
    params.push(parseInt(limit), parseInt(offset));

    console.log('📧 Query:', query);
    console.log('📧 Params:', params);

    const client = await pool.connect();
    const result = await client.query(query, params);
    const notifications = result.rows || result;
    client.release();

    console.log('📧 Found notifications:', notifications?.length || 0);

    // Parse metadata for each notification
    const processedNotifications = notifications.map(notification => ({
      ...notification,
      metadata: notification.metadata ? JSON.parse(notification.metadata) : null,
      read_status: Boolean(notification.read_status)
    }));

    console.log('📧 Sending response with notifications:', processedNotifications);

    res.json({
      success: true,
      data: processedNotifications,
      total: processedNotifications.length
    });

  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch notifications' 
    });
  }
});

// GET /api/notifications/unread-count - Get unread notification count
router.get('/unread-count', async (req, res) => {
  try {
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    const client = await pool.connect();
    const result = await client.query(
      'SELECT COUNT(*) as count FROM notifications WHERE user_id = $1 AND read_status = 0',
      [userId]
    );
    client.release();

    const count = result.rows ? result.rows[0]?.count || 0 : result[0]?.count || 0;
    res.json({
      success: true,
      count: count
    });

  } catch (error) {
    console.error('Error fetching unread count:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch unread count' 
    });
  }
});

// PUT /api/notifications/:id/read - Mark notification as read
router.put('/:id/read', async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    const client = await pool.connect();
    await client.query(
      `UPDATE notifications 
       SET read_status = 1, updated_at = datetime('now') 
       WHERE id = $1 AND user_id = $2`,
      [id, userId]
    );
    client.release();

    res.json({
      success: true,
      message: 'Notification marked as read'
    });

  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to mark notification as read' 
    });
  }
});

// PUT /api/notifications/mark-all-read - Mark all notifications as read for a user
router.put('/mark-all-read', async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    const client = await pool.connect();
    await client.query(
      `UPDATE notifications 
       SET read_status = 1, updated_at = datetime('now') 
       WHERE user_id = $1 AND read_status = 0`,
      [userId]
    );
    client.release();

    res.json({
      success: true,
      message: 'All notifications marked as read'
    });

  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to mark all notifications as read' 
    });
  }
});

// DELETE /api/notifications/:id - Delete notification
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    const client = await pool.connect();
    await client.query(
      'DELETE FROM notifications WHERE id = $1 AND user_id = $2',
      [id, userId]
    );
    client.release();

    res.json({
      success: true,
      message: 'Notification deleted'
    });

  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to delete notification' 
    });
  }
});

// POST /api/notifications - Create notification (for testing or system use)
router.post('/', async (req, res) => {
  try {
    const { userId, title, message, type = 'info', actionUrl = null, metadata = null } = req.body;

    if (!userId || !title || !message) {
      return res.status(400).json({ error: 'User ID, title, and message are required' });
    }

    const notificationId = await createNotification(userId, title, message, type, actionUrl, metadata);

    res.json({
      success: true,
      id: notificationId,
      message: 'Notification created successfully'
    });

  } catch (error) {
    console.error('Error creating notification:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to create notification' 
    });
  }
});

// Export helper functions for use in other modules
module.exports = router;
module.exports.createNotification = createNotification;
module.exports.createCampaignAssignmentNotification = createCampaignAssignmentNotification;
module.exports.NOTIFICATION_TYPES = NOTIFICATION_TYPES;