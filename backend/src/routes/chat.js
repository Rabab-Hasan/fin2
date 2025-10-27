const express = require('express');
const { ObjectId } = require('mongodb');
const { getDb } = require('../database-mongo');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const crypto = require('crypto');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Configure multer for file uploads in chat
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../../uploads/chat');
    fs.mkdir(uploadPath, { recursive: true })
      .then(() => {
        cb(null, uploadPath);
      })
      .catch(err => {
        cb(err);
      });
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = crypto.randomBytes(16).toString('hex');
    const ext = path.extname(file.originalname);
    const filename = `${uniqueSuffix}${ext}`;
    cb(null, filename);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow most common file types
    const allowedTypes = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp',
      'video/mp4', 'video/avi', 'video/mov', 'video/wmv',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain',
      'application/zip',
      'application/x-rar-compressed'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('File type not allowed for chat uploads.'));
    }
  }
});

// Middleware to authenticate JWT token
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

// Update user online status
const updateUserOnlineStatus = async (userId, online = true) => {
  try {
    const db = await getDb();
    const usersCollection = db.collection('users');
    
    await usersCollection.updateOne(
      { _id: new ObjectId(userId) },
      { 
        $set: { 
          online: online,
          last_seen: new Date(),
          updated_at: new Date()
        }
      }
    );
  } catch (error) {
    console.error('Error updating online status:', error);
  }
};

// GET /api/chat/channels - Get channels for current user
router.get('/channels', authenticateToken, async (req, res) => {
  try {
    console.log('🔍 Fetching channels for user:', req.user.userId);
    
    const db = await getDb();
    const channelsCollection = db.collection('chat_channels');
    
    // Update user online status
    await updateUserOnlineStatus(req.user.userId, true);
    
    // Get channels where user is a member or public channels
    const channels = await channelsCollection.find({
      $or: [
        { type: 'public' },
        { members: req.user.userId },
        { created_by: req.user.userId }
      ]
    }).sort({ created_at: -1 }).toArray();

    // Get unread counts for each channel
    const messagesCollection = db.collection('chat_messages');
    
    for (let channel of channels) {
      // Count unread messages (messages not in read_by array for this user)
      const unreadCount = await messagesCollection.countDocuments({
        channel: channel._id.toString(),
        'sender._id': { $ne: req.user.userId },
        read_by: { $ne: req.user.userId }
      });
      
      channel.unread_count = unreadCount;
      
      // Get last message
      const lastMessage = await messagesCollection.findOne(
        { channel: channel._id.toString() },
        { sort: { timestamp: -1 } }
      );
      
      if (lastMessage) {
        channel.last_message = lastMessage;
      }
    }

    console.log('✅ Channels fetched:', channels.length);
    res.json({ channels });
    
  } catch (error) {
    console.error('❌ Error fetching channels:', error);
    res.status(500).json({ error: 'Failed to fetch channels' });
  }
});

// GET /api/chat/channels/:id/messages - Get messages for a channel
router.get('/channels/:channelId/messages', authenticateToken, async (req, res) => {
  try {
    const { channelId } = req.params;
    const { limit = 50, before } = req.query;
    
    console.log(`🔍 Fetching messages for channel ${channelId}`);
    
    const db = await getDb();
    const channelsCollection = db.collection('chat_channels');
    const messagesCollection = db.collection('chat_messages');
    
    // Check if user has access to this channel
    const channel = await channelsCollection.findOne({
      $and: [
        { _id: new ObjectId(channelId) },
        {
          $or: [
            { type: 'public' },
            { members: req.user.userId },
            { created_by: req.user.userId }
          ]
        }
      ]
    });
    
    if (!channel) {
      return res.status(403).json({ error: 'Access denied to this channel' });
    }
    
    // Build query
    let query = { channel: channelId };
    if (before) {
      query.timestamp = { $lt: new Date(before) };
    }
    
    // Get messages
    const messages = await messagesCollection
      .find(query)
      .sort({ timestamp: -1 })
      .limit(parseInt(limit))
      .toArray();
    
    // Reverse to get chronological order
    messages.reverse();
    
    console.log('✅ Messages fetched:', messages.length);
    res.json({ messages });
    
  } catch (error) {
    console.error('❌ Error fetching messages:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// POST /api/chat/messages - Send a message
router.post('/messages', authenticateToken, async (req, res) => {
  try {
    const { channel, text, reply_to } = req.body;
    
    if (!channel || !text || !text.trim()) {
      return res.status(400).json({ error: 'Channel and text are required' });
    }
    
    console.log('📤 Sending message:', { channel, text, userId: req.user.userId });
    
    const db = await getDb();
    const channelsCollection = db.collection('chat_channels');
    const messagesCollection = db.collection('chat_messages');
    const usersCollection = db.collection('users');
    
    // Check channel access
    const channelDoc = await channelsCollection.findOne({
      $and: [
        { _id: new ObjectId(channel) },
        {
          $or: [
            { type: 'public' },
            { members: req.user.userId },
            { created_by: req.user.userId }
          ]
        }
      ]
    });
    
    if (!channelDoc) {
      return res.status(403).json({ error: 'Access denied to this channel' });
    }
    
    // Get sender info
    const sender = await usersCollection.findOne(
      { _id: new ObjectId(req.user.userId) },
      { projection: { password: 0 } }
    );
    
    if (!sender) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Create message
    const message = {
      _id: new ObjectId(),
      channel: channel,
      text: text.trim(),
      sender: {
        _id: sender._id.toString(),
        name: sender.name,
        email: sender.email,
        user_type: sender.user_type
      },
      timestamp: new Date(),
      read_by: [req.user.userId], // Mark as read by sender
      reactions: {},
      reply_to: reply_to || null
    };
    
    await messagesCollection.insertOne(message);
    
    // Update user online status
    await updateUserOnlineStatus(req.user.userId, true);
    
    console.log('✅ Message sent successfully');
    res.status(201).json({ message });
    
  } catch (error) {
    console.error('❌ Error sending message:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

// GET /api/chat/users/online - Get online users
router.get('/users/online', authenticateToken, async (req, res) => {
  try {
    console.log('🔍 Fetching online users');
    
    const db = await getDb();
    const usersCollection = db.collection('users');
    
    // Update current user's online status
    await updateUserOnlineStatus(req.user.userId, true);
    
    // Get all users with their online status
    // Consider users online if they were active in the last 5 minutes
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    
    const users = await usersCollection.find(
      {},
      { projection: { password: 0 } }
    ).toArray();
    
    // Determine online status
    const onlineUsers = users.map(user => ({
      _id: user._id.toString(),
      name: user.name,
      email: user.email,
      user_type: user.user_type,
      online: user.last_seen && user.last_seen > fiveMinutesAgo,
      last_seen: user.last_seen ? user.last_seen.toISOString() : null,
      status_message: user.status_message || null
    }));
    
    console.log('✅ Online users fetched:', onlineUsers.length);
    res.json({ users: onlineUsers });
    
  } catch (error) {
    console.error('❌ Error fetching online users:', error);
    res.status(500).json({ error: 'Failed to fetch online users' });
  }
});

// POST /api/chat/channels - Create a new channel
router.post('/channels', authenticateToken, async (req, res) => {
  try {
    const { name, description, type = 'public', members = [] } = req.body;
    
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Channel name is required' });
    }
    
    console.log('📝 Creating channel:', { name, type, members });
    
    const db = await getDb();
    const channelsCollection = db.collection('chat_channels');
    
    // Check if channel name already exists
    const existingChannel = await channelsCollection.findOne({ name: name.trim() });
    if (existingChannel) {
      return res.status(409).json({ error: 'Channel with this name already exists' });
    }
    
    // Create channel
    const channel = {
      _id: new ObjectId(),
      name: name.trim(),
      description: description || '',
      type: type,
      members: type === 'private' ? [...members, req.user.userId] : [],
      created_by: req.user.userId,
      created_at: new Date(),
      updated_at: new Date()
    };
    
    await channelsCollection.insertOne(channel);
    
    console.log('✅ Channel created successfully');
    res.status(201).json({ channel });
    
  } catch (error) {
    console.error('❌ Error creating channel:', error);
    res.status(500).json({ error: 'Failed to create channel' });
  }
});

// POST /api/chat/direct - Create or get direct message channel
router.post('/direct', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }
    
    if (userId === req.user.userId) {
      return res.status(400).json({ error: 'Cannot create direct message with yourself' });
    }
    
    console.log(`💬 Creating/finding direct message between ${req.user.userId} and ${userId}`);
    
    const db = await getDb();
    const channelsCollection = db.collection('chat_channels');
    const usersCollection = db.collection('users');
    
    // Check if target user exists
    const targetUser = await usersCollection.findOne({ _id: new ObjectId(userId) });
    if (!targetUser) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Look for existing direct message channel
    const existingChannel = await channelsCollection.findOne({
      type: 'direct',
      members: { $all: [req.user.userId, userId] },
      $expr: { $eq: [{ $size: '$members' }, 2] }
    });
    
    if (existingChannel) {
      console.log('✅ Found existing direct message channel');
      return res.json({ channel: existingChannel });
    }
    
    // Create new direct message channel
    const channel = {
      _id: new ObjectId(),
      name: `${req.user.name} & ${targetUser.name}`,
      description: 'Direct message',
      type: 'direct',
      members: [req.user.userId, userId],
      created_by: req.user.userId,
      created_at: new Date(),
      updated_at: new Date()
    };
    
    await channelsCollection.insertOne(channel);
    
    console.log('✅ Direct message channel created');
    res.status(201).json({ channel });
    
  } catch (error) {
    console.error('❌ Error creating direct message:', error);
    res.status(500).json({ error: 'Failed to create direct message' });
  }
});

// POST /api/chat/channels/:id/messages/:messageId/read - Mark message as read
router.post('/channels/:channelId/messages/:messageId/read', authenticateToken, async (req, res) => {
  try {
    const { channelId, messageId } = req.params;
    
    console.log(`📖 Marking message ${messageId} as read`);
    
    const db = await getDb();
    const messagesCollection = db.collection('chat_messages');
    
    // Mark message as read
    await messagesCollection.updateOne(
      { _id: new ObjectId(messageId), channel: channelId },
      { $addToSet: { read_by: req.user.userId } }
    );
    
    console.log('✅ Message marked as read');
    res.json({ success: true });
    
  } catch (error) {
    console.error('❌ Error marking message as read:', error);
    res.status(500).json({ error: 'Failed to mark message as read' });
  }
});

// POST /api/chat/channels/:id/read-all - Mark all messages in channel as read
router.post('/channels/:channelId/read-all', authenticateToken, async (req, res) => {
  try {
    const { channelId } = req.params;
    
    console.log(`📖 Marking all messages in channel ${channelId} as read`);
    
    const db = await getDb();
    const messagesCollection = db.collection('chat_messages');
    
    // Mark all messages in channel as read by this user
    await messagesCollection.updateMany(
      { 
        channel: channelId,
        read_by: { $ne: req.user.userId }
      },
      { $addToSet: { read_by: req.user.userId } }
    );
    
    console.log('✅ All messages marked as read');
    res.json({ success: true });
    
  } catch (error) {
    console.error('❌ Error marking all messages as read:', error);
    res.status(500).json({ error: 'Failed to mark messages as read' });
  }
});

// PUT /api/chat/users/status - Update user status
router.put('/users/status', authenticateToken, async (req, res) => {
  try {
    const { online, status_message } = req.body;
    
    console.log('📱 Updating user status:', { online, status_message });
    
    const db = await getDb();
    const usersCollection = db.collection('users');
    
    const updateData = {
      last_seen: new Date(),
      updated_at: new Date()
    };
    
    if (typeof online === 'boolean') {
      updateData.online = online;
    }
    
    if (status_message !== undefined) {
      updateData.status_message = status_message;
    }
    
    await usersCollection.updateOne(
      { _id: new ObjectId(req.user.userId) },
      { $set: updateData }
    );
    
    console.log('✅ Status updated');
    res.json({ success: true });
    
  } catch (error) {
    console.error('❌ Error updating status:', error);
    res.status(500).json({ error: 'Failed to update status' });
  }
});

// POST /api/chat/channels/:id/join - Join a channel
router.post('/channels/:channelId/join', authenticateToken, async (req, res) => {
  try {
    const { channelId } = req.params;
    
    console.log(`🚪 User joining channel ${channelId}`);
    
    const db = await getDb();
    const channelsCollection = db.collection('chat_channels');
    
    const result = await channelsCollection.updateOne(
      { _id: new ObjectId(channelId) },
      { $addToSet: { members: req.user.userId } }
    );
    
    if (result.matchedCount === 0) {
      return res.status(404).json({ error: 'Channel not found' });
    }
    
    console.log('✅ Joined channel successfully');
    res.json({ success: true });
    
  } catch (error) {
    console.error('❌ Error joining channel:', error);
    res.status(500).json({ error: 'Failed to join channel' });
  }
});

// POST /api/chat/channels/:id/leave - Leave a channel
router.post('/channels/:channelId/leave', authenticateToken, async (req, res) => {
  try {
    const { channelId } = req.params;
    
    console.log(`🚪 User leaving channel ${channelId}`);
    
    const db = await getDb();
    const channelsCollection = db.collection('chat_channels');
    
    const result = await channelsCollection.updateOne(
      { _id: new ObjectId(channelId) },
      { $pull: { members: req.user.userId } }
    );
    
    if (result.matchedCount === 0) {
      return res.status(404).json({ error: 'Channel not found' });
    }
    
    console.log('✅ Left channel successfully');
    res.json({ success: true });
    
  } catch (error) {
    console.error('❌ Error leaving channel:', error);
    res.status(500).json({ error: 'Failed to leave channel' });
  }
});

// Initialize default channels
router.post('/initialize', authenticateToken, async (req, res) => {
  try {
    const db = await getDb();
    const channelsCollection = db.collection('chat_channels');
    
    // Check if default channels exist
    const existing = await channelsCollection.countDocuments();
    
    if (existing === 0) {
      const defaultChannels = [
        {
          _id: new ObjectId(),
          name: 'General',
          description: 'Team-wide discussions and announcements',
          type: 'public',
          members: [],
          created_by: req.user.userId,
          created_at: new Date(),
          updated_at: new Date()
        },
        {
          _id: new ObjectId(),
          name: 'Project Updates',
          description: 'Share progress, milestones, and project news',
          type: 'public',
          members: [],
          created_by: req.user.userId,
          created_at: new Date(),
          updated_at: new Date()
        },
        {
          _id: new ObjectId(),
          name: 'Random',
          description: 'Off-topic conversations and casual chat',
          type: 'public',
          members: [],
          created_by: req.user.userId,
          created_at: new Date(),
          updated_at: new Date()
        }
      ];
      
      await channelsCollection.insertMany(defaultChannels);
      console.log('✅ Default channels created');
    }
    
    res.json({ success: true });
    
  } catch (error) {
    console.error('❌ Error initializing channels:', error);
    res.status(500).json({ error: 'Failed to initialize channels' });
  }
});

// PRIVATE MESSAGES ENDPOINTS

// POST /api/chat/private/send - Send a private message
router.post('/private/send', authenticateToken, async (req, res) => {
  try {
    const { to_user_id, text } = req.body;
    
    if (!to_user_id || !text || !text.trim()) {
      return res.status(400).json({ error: 'Recipient user ID and message text are required' });
    }
    
    console.log('📤 Sending private message:', { from: req.user.userId, to: to_user_id, text });
    
    const db = await getDb();
    const usersCollection = db.collection('users');
    const privateMessagesCollection = db.collection('private_messages');
    
    // Get sender and recipient info
    const [sender, recipient] = await Promise.all([
      usersCollection.findOne(
        { _id: new ObjectId(req.user.userId) },
        { projection: { password: 0 } }
      ),
      usersCollection.findOne(
        { _id: new ObjectId(to_user_id) },
        { projection: { password: 0 } }
      )
    ]);
    
    if (!sender || !recipient) {
      return res.status(404).json({ error: 'Sender or recipient not found' });
    }
    
    // Create private message
    const message = {
      _id: new ObjectId(),
      from_user_id: req.user.userId,
      to_user_id: to_user_id,
      text: text.trim(),
      sender: {
        _id: sender._id.toString(),
        name: sender.name,
        email: sender.email,
        user_type: sender.user_type
      },
      recipient: {
        _id: recipient._id.toString(),
        name: recipient.name,
        email: recipient.email,
        user_type: recipient.user_type
      },
      timestamp: new Date(),
      read: false,
      edited: false
    };
    
    await privateMessagesCollection.insertOne(message);
    
    // Update user online status
    await updateUserOnlineStatus(req.user.userId, true);
    
    console.log('✅ Private message sent successfully');
    res.status(201).json({ message });
    
  } catch (error) {
    console.error('❌ Error sending private message:', error);
    res.status(500).json({ error: 'Failed to send private message' });
  }
});

// GET /api/chat/private/messages - Get private messages with a specific user
router.get('/private/messages', authenticateToken, async (req, res) => {
  try {
    const { with_user_id, limit = 50 } = req.query;
    
    if (!with_user_id) {
      return res.status(400).json({ error: 'with_user_id parameter is required' });
    }
    
    console.log(`🔍 Fetching private messages between ${req.user.userId} and ${with_user_id}`);
    
    const db = await getDb();
    const privateMessagesCollection = db.collection('private_messages');
    
    // Get messages between the two users
    const messages = await privateMessagesCollection
      .find({
        $or: [
          { from_user_id: req.user.userId, to_user_id: with_user_id },
          { from_user_id: with_user_id, to_user_id: req.user.userId }
        ]
      })
      .sort({ timestamp: -1 })
      .limit(parseInt(limit))
      .toArray();
    
    // Reverse to get chronological order
    messages.reverse();
    
    console.log('✅ Private messages fetched:', messages.length);
    res.json({ messages });
    
  } catch (error) {
    console.error('❌ Error fetching private messages:', error);
    res.status(500).json({ error: 'Failed to fetch private messages' });
  }
});

// GET /api/chat/private/conversations - Get all private message conversations
router.get('/private/conversations', authenticateToken, async (req, res) => {
  try {
    console.log('🔍 Fetching private conversations for user:', req.user.userId);
    
    const db = await getDb();
    const privateMessagesCollection = db.collection('private_messages');
    const usersCollection = db.collection('users');
    
    // Get all users who have exchanged messages with current user
    const conversations = await privateMessagesCollection.aggregate([
      {
        $match: {
          $or: [
            { from_user_id: req.user.userId },
            { to_user_id: req.user.userId }
          ]
        }
      },
      {
        $addFields: {
          other_user_id: {
            $cond: {
              if: { $eq: ['$from_user_id', req.user.userId] },
              then: '$to_user_id',
              else: '$from_user_id'
            }
          }
        }
      },
      {
        $sort: { timestamp: -1 }
      },
      {
        $group: {
          _id: '$other_user_id',
          last_message: { $first: '$$ROOT' },
          unread_count: {
            $sum: {
              $cond: {
                if: {
                  $and: [
                    { $eq: ['$to_user_id', req.user.userId] },
                    { $eq: ['$read', false] }
                  ]
                },
                then: 1,
                else: 0
              }
            }
          }
        }
      }
    ]).toArray();
    
    // Get user details for each conversation
    const conversationsWithUsers = await Promise.all(
      conversations.map(async (conv) => {
        const user = await usersCollection.findOne(
          { _id: new ObjectId(conv._id) },
          { projection: { password: 0 } }
        );
        
        if (!user) return null;
        
        // Determine online status (active in last 5 minutes)
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
        const isOnline = user.last_seen && user.last_seen > fiveMinutesAgo;
        
        return {
          user: {
            _id: user._id.toString(),
            name: user.name,
            email: user.email,
            user_type: user.user_type,
            online: isOnline,
            last_seen: user.last_seen ? user.last_seen.toISOString() : null
          },
          last_message: conv.last_message,
          unread_count: conv.unread_count
        };
      })
    );
    
    // Filter out null results and sort by last message timestamp
    const validConversations = conversationsWithUsers
      .filter(conv => conv !== null)
      .sort((a, b) => new Date(b.last_message.timestamp) - new Date(a.last_message.timestamp));
    
    console.log('✅ Private conversations fetched:', validConversations.length);
    res.json({ conversations: validConversations });
    
  } catch (error) {
    console.error('❌ Error fetching private conversations:', error);
    res.status(500).json({ error: 'Failed to fetch private conversations' });
  }
});

// POST /api/chat/private/read - Mark private messages as read
router.post('/private/read', authenticateToken, async (req, res) => {
  try {
    const { with_user_id } = req.body;
    
    if (!with_user_id) {
      return res.status(400).json({ error: 'with_user_id is required' });
    }
    
    console.log(`📖 Marking private messages with user ${with_user_id} as read`);
    
    const db = await getDb();
    const privateMessagesCollection = db.collection('private_messages');
    
    // Mark all unread messages from the other user as read
    await privateMessagesCollection.updateMany(
      { 
        from_user_id: with_user_id,
        to_user_id: req.user.userId,
        read: false
      },
      { $set: { read: true } }
    );
    
    console.log('✅ Private messages marked as read');
    res.json({ success: true });
    
  } catch (error) {
    console.error('❌ Error marking private messages as read:', error);
    res.status(500).json({ error: 'Failed to mark private messages as read' });
  }
});

// POST /api/chat/upload - Upload file for chat
router.post('/upload', authenticateToken, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    console.log('📤 Chat file uploaded:', req.file.originalname);

    const fileData = {
      _id: new ObjectId(),
      filename: req.file.filename,
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      path: req.file.path,
      url: `/api/chat/file/${req.file.filename}`,
      uploaded_by: req.user.userId,
      uploaded_at: new Date()
    };

    // Store file info in database
    const db = await getDb();
    const filesCollection = db.collection('chat_files');
    await filesCollection.insertOne(fileData);

    console.log('✅ Chat file stored successfully');
    res.json({
      file: {
        id: fileData._id.toString(),
        filename: fileData.filename,
        originalname: fileData.originalname,
        mimetype: fileData.mimetype,
        size: fileData.size,
        url: fileData.url
      }
    });

  } catch (error) {
    console.error('❌ Error uploading chat file:', error);
    res.status(500).json({ error: 'Failed to upload file' });
  }
});

// GET /api/chat/file/:filename - Serve chat files
router.get('/file/:filename', async (req, res) => {
  try {
    const { filename } = req.params;
    const filePath = path.join(__dirname, '../../uploads/chat', filename);
    
    // Check if file exists
    try {
      await fs.access(filePath);
    } catch {
      console.log(`❌ Chat file not found: ${filePath}`);
      return res.status(404).json({ error: 'File not found' });
    }

    // Get file info from database for proper content type
    const db = await getDb();
    const filesCollection = db.collection('chat_files');
    const fileInfo = await filesCollection.findOne({ filename });
    
    if (fileInfo && fileInfo.mimetype) {
      res.setHeader('Content-Type', fileInfo.mimetype);
    }

    // Set content disposition for downloads
    if (fileInfo && fileInfo.originalname) {
      res.setHeader('Content-Disposition', `attachment; filename="${fileInfo.originalname}"`);
    }
    
    console.log(`✅ Serving chat file: ${filename}`);
    res.sendFile(path.resolve(filePath));
    
  } catch (error) {
    console.error('❌ Error serving chat file:', error);
    res.status(500).json({ error: 'Failed to serve file' });
  }
});

module.exports = router;