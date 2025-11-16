const express = require('express');
const { MongoClient, ObjectId } = require('mongodb');
const jwt = require('jsonwebtoken');

const router = express.Router();

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://rababsairsi:pUoHEW6lGDJjJKSN@cluster0.zd6r2.mongodb.net/finance_dashboard?retryWrites=true&w=majority';
let db;

async function connectToMongoDB() {
  if (!db) {
    const client = new MongoClient(MONGODB_URI);
    await client.connect();
    db = client.db('finance_dashboard');
    console.log('📊 Connected to MongoDB for notifications');
  }
  return db;
}

// Auth middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key', (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid token' });
    }
    req.user = user;
    next();
  });
};

// Create notification
router.post('/', authenticateToken, async (req, res) => {
  try {
    const db = await connectToMongoDB();
    const notifications = db.collection('notifications');
    
    const { userId, title, message, type = 'info', priority = 'normal', clientName } = req.body;
    
    if (!userId || !title || !message) {
      return res.status(400).json({ error: 'User ID, title, and message are required' });
    }

    const notification = {
      userId: new ObjectId(userId),
      title,
      message,
      type, // 'info', 'success', 'warning', 'error'
      priority, // 'low', 'normal', 'high'
      clientName: clientName || null,
      read: false,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await notifications.insertOne(notification);
    
    res.status(201).json({
      success: true,
      notification: {
        ...notification,
        _id: result.insertedId
      }
    });
  } catch (error) {
    console.error('Create notification error:', error);
    res.status(500).json({ error: 'Failed to create notification' });
  }
});

// Get notifications for current user
router.get('/', authenticateToken, async (req, res) => {
  try {
    const db = await connectToMongoDB();
    const notifications = db.collection('notifications');
    
    const { page = 1, limit = 20, unreadOnly = false } = req.query;
    const skip = (page - 1) * limit;

    // Build query - use userId, _id, or id from token
    const userId = req.user.userId || req.user._id || req.user.id;
    const query = { userId: new ObjectId(userId) };
    if (unreadOnly === 'true') {
      query.read = false;
    }

    // Get notifications with pagination
    const notificationsList = await notifications
      .find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .toArray();

    // Get total count
    const total = await notifications.countDocuments(query);
    
    // Get unread count
    const unreadCount = await notifications.countDocuments({
      userId: new ObjectId(userId),
      read: false
    });

    res.json({
      success: true,
      notifications: notificationsList,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      },
      unreadCount
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

// Get unread notifications count
router.get('/count', authenticateToken, async (req, res) => {
  try {
    const db = await connectToMongoDB();
    const notifications = db.collection('notifications');
    
    const userId = req.user.userId || req.user._id || req.user.id;
    const unreadCount = await notifications.countDocuments({
      userId: new ObjectId(userId),
      read: false
    });

    res.json({
      success: true,
      unreadCount
    });
  } catch (error) {
    console.error('Get notification count error:', error);
    res.status(500).json({ error: 'Failed to get notification count' });
  }
});

// Mark notification as read
router.patch('/:id/read', authenticateToken, async (req, res) => {
  try {
    const db = await connectToMongoDB();
    const notifications = db.collection('notifications');
    
    const { id } = req.params;
    
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid notification ID' });
    }

    const userId = req.user.userId || req.user._id || req.user.id;
    const result = await notifications.updateOne(
      { 
        _id: new ObjectId(id),
        userId: new ObjectId(userId)
      },
      {
        $set: {
          read: true,
          updatedAt: new Date()
        }
      }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    res.json({
      success: true,
      message: 'Notification marked as read'
    });
  } catch (error) {
    console.error('Mark notification as read error:', error);
    res.status(500).json({ error: 'Failed to mark notification as read' });
  }
});

// Mark all notifications as read for current user
router.patch('/read-all', authenticateToken, async (req, res) => {
  try {
    const db = await connectToMongoDB();
    const notifications = db.collection('notifications');
    
    const userId = req.user.userId || req.user._id || req.user.id;
    const result = await notifications.updateMany(
      { 
        userId: new ObjectId(userId),
        read: false
      },
      {
        $set: {
          read: true,
          updatedAt: new Date()
        }
      }
    );

    res.json({
      success: true,
      message: `Marked ${result.modifiedCount} notifications as read`
    });
  } catch (error) {
    console.error('Mark all notifications as read error:', error);
    res.status(500).json({ error: 'Failed to mark all notifications as read' });
  }
});

// Delete notification
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const db = await connectToMongoDB();
    const notifications = db.collection('notifications');
    
    const { id } = req.params;
    
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid notification ID' });
    }

    const userId = req.user.userId || req.user._id || req.user.id;
    const result = await notifications.deleteOne({
      _id: new ObjectId(id),
      userId: new ObjectId(userId)
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    res.json({
      success: true,
      message: 'Notification deleted'
    });
  } catch (error) {
    console.error('Delete notification error:', error);
    res.status(500).json({ error: 'Failed to delete notification' });
  }
});

// Delete all notifications for current user
router.delete('/', authenticateToken, async (req, res) => {
  try {
    const db = await connectToMongoDB();
    const notifications = db.collection('notifications');
    
    const userId = req.user.userId || req.user._id || req.user.id;
    const result = await notifications.deleteMany({
      userId: new ObjectId(userId)
    });

    res.json({
      success: true,
      message: `Deleted ${result.deletedCount} notifications`
    });
  } catch (error) {
    console.error('Delete all notifications error:', error);
    res.status(500).json({ error: 'Failed to delete notifications' });
  }
});

// Helper function to create client-related notifications
async function createClientNotification(userId, type, clientName, comment = null) {
  try {
    const db = await connectToMongoDB();
    const notifications = db.collection('notifications');
    
    let title, message, notificationType;
    
    if (type === 'approved') {
      title = 'Client Request Approved';
      message = `Your client request for "${clientName}" has been approved and the client has been added to your account.`;
      notificationType = 'success';
    } else if (type === 'rejected') {
      title = 'Client Request Rejected';
      message = `The client "${clientName}" onboarding was rejected${comment ? ` because of "${comment}"` : ''}.`;
      notificationType = 'error';
    } else {
      throw new Error('Invalid notification type');
    }

    const notification = {
      userId: new ObjectId(userId),
      title,
      message,
      type: notificationType,
      priority: 'high',
      clientName,
      read: false,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await notifications.insertOne(notification);
    console.log(`📧 Created ${type} notification for client ${clientName}`);
    
    return notification;
  } catch (error) {
    console.error('Create client notification error:', error);
    throw error;
  }
}

// Export helper function for use in other routes
router.createClientNotification = createClientNotification;

module.exports = router;