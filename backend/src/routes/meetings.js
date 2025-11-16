const express = require('express');
const { ObjectId } = require('mongodb');
const { getDb } = require('../database-mongo');
const jwt = require('jsonwebtoken');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-here';

// Authentication middleware
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid token' });
    }
    req.user = user;
    next();
  });
}

// Helper function to create notifications
const createNotification = async (recipientEmail, title, message, type = 'info', meetingId = null) => {
  try {
    const db = await getDb();
    const notification = {
      recipientEmail,
      title,
      message,
      type,
      meetingId,
      read: false,
      createdAt: new Date()
    };
    
    const result = await db.collection('notifications').insertOne(notification);
    console.log('✅ Meeting notification created:', result.insertedId);
    return result.insertedId;
  } catch (error) {
    console.error('❌ Error creating meeting notification:', error);
    return null;
  }
};

// GET /api/meetings - Get all meetings
router.get('/', authenticateToken, async (req, res) => {
  try {
    const db = await getDb();
    
    // Get all meetings and populate organizer and participant details
    const meetings = await db.collection('meetings').aggregate([
      {
        $lookup: {
          from: 'users',
          localField: 'organizerId',
          foreignField: '_id',
          as: 'organizerData'
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'participantIds',
          foreignField: '_id',
          as: 'participantsData'
        }
      },
      {
        $project: {
          title: 1,
          startDate: 1,
          endDate: 1,
          locationType: 1,
          location: 1,
          notes: 1,
          status: 1,
          createdAt: 1,
          updatedAt: 1,
          organizer: {
            $arrayElemAt: [
              {
                $map: {
                  input: '$organizerData',
                  as: 'org',
                  in: {
                    _id: '$$org._id',
                    name: { $ifNull: ['$$org.name', '$$org.full_name'] },
                    email: '$$org.email'
                  }
                }
              },
              0
            ]
          },
          participants: {
            $map: {
              input: '$participantsData',
              as: 'participant',
              in: {
                _id: '$$participant._id',
                name: { $ifNull: ['$$participant.name', '$$participant.full_name'] },
                email: '$$participant.email'
              }
            }
          }
        }
      },
      { $sort: { startDate: 1 } }
    ]).toArray();

    res.json({ meetings });
  } catch (error) {
    console.error('❌ Error fetching meetings:', error);
    res.status(500).json({ error: 'Failed to fetch meetings' });
  }
});

// GET /api/meetings/users - Get users for meeting creation
router.get('/users', authenticateToken, async (req, res) => {
  try {
    const db = await getDb();
    
    const users = await db.collection('users').find({
      _id: { $ne: new ObjectId(req.user.id || req.user.user_id) }
    }, {
      projection: {
        _id: 1,
        name: { $ifNull: ['$name', '$full_name'] },
        email: 1
      }
    }).toArray();

    res.json(users);
  } catch (error) {
    console.error('❌ Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// POST /api/meetings - Create a new meeting
router.post('/', authenticateToken, async (req, res) => {
  try {
    const {
      title,
      startDate,
      endDate,
      participants = [],
      locationType,
      location,
      notes,
      reminderMinutes = 15
    } = req.body;

    // Validation
    if (!title || !startDate || !endDate || !locationType) {
      return res.status(400).json({ 
        error: 'Missing required fields: title, startDate, endDate, locationType' 
      });
    }

    if (participants.length === 0) {
      return res.status(400).json({ 
        error: 'At least one participant is required' 
      });
    }

    const db = await getDb();

    // Check for room conflicts if locationType is 'room'
    if (locationType === 'room') {
      const conflictingMeeting = await db.collection('meetings').findOne({
        locationType: 'room',
        status: { $ne: 'cancelled' },
        $or: [
          {
            startDate: { $lt: new Date(endDate) },
            endDate: { $gt: new Date(startDate) }
          }
        ]
      });

      if (conflictingMeeting) {
        return res.status(409).json({
          error: 'The Main Room is already booked for this time',
          conflictingMeeting: conflictingMeeting.title
        });
      }
    }

    // Convert participant IDs to ObjectIds
    const participantObjectIds = participants.map(id => new ObjectId(id));

    // Create meeting
    const meeting = {
      title,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      organizerId: new ObjectId(req.user.id || req.user.user_id),
      participantIds: participantObjectIds,
      locationType,
      location: locationType === 'room' ? 'Main Room' : (location || ''),
      notes: notes || '',
      status: 'scheduled',
      reminders: reminderMinutes > 0 ? [{ minutes: reminderMinutes }] : [],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await db.collection('meetings').insertOne(meeting);

    // Get participant details for notifications
    const participantsData = await db.collection('users').find({
      _id: { $in: participantObjectIds }
    }).toArray();

    // Send notifications to all participants
    const locationText = locationType === 'room' ? 'Main Room' : 
                        locationType === 'online' ? 'Online Meeting' : 
                        location || 'External Location';

    const notificationTitle = '📅 New Meeting Scheduled';
    const notificationMessage = `You have been invited to "${title}" on ${new Date(startDate).toLocaleDateString()} at ${new Date(startDate).toLocaleTimeString()}. Location: ${locationText}`;

    for (const participant of participantsData) {
      await createNotification(
        participant.email,
        notificationTitle,
        notificationMessage,
        'meeting',
        result.insertedId
      );
    }

    console.log('✅ Meeting created successfully:', result.insertedId);
    res.status(201).json({ 
      _id: result.insertedId,
      message: 'Meeting created successfully',
      participantsNotified: participantsData.length
    });

  } catch (error) {
    console.error('❌ Error creating meeting:', error);
    res.status(500).json({ error: 'Failed to create meeting' });
  }
});

// PUT /api/meetings/:id - Update a meeting
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      startDate,
      endDate,
      participants = [],
      locationType,
      location,
      notes
    } = req.body;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid meeting ID' });
    }

    const db = await getDb();

    // Check if meeting exists and user is the organizer
    const existingMeeting = await db.collection('meetings').findOne({
      _id: new ObjectId(id)
    });

    if (!existingMeeting) {
      return res.status(404).json({ error: 'Meeting not found' });
    }

    if (existingMeeting.organizerId.toString() !== (req.user.id || req.user.user_id)) {
      return res.status(403).json({ error: 'Only the organizer can edit this meeting' });
    }

    if (existingMeeting.status === 'cancelled') {
      return res.status(400).json({ error: 'Cannot edit a cancelled meeting' });
    }

    // Check for room conflicts if locationType is 'room'
    if (locationType === 'room') {
      const conflictingMeeting = await db.collection('meetings').findOne({
        _id: { $ne: new ObjectId(id) },
        locationType: 'room',
        status: { $ne: 'cancelled' },
        $or: [
          {
            startDate: { $lt: new Date(endDate) },
            endDate: { $gt: new Date(startDate) }
          }
        ]
      });

      if (conflictingMeeting) {
        return res.status(409).json({
          error: 'The Main Room is already booked for this time',
          conflictingMeeting: conflictingMeeting.title
        });
      }
    }

    // Convert participant IDs to ObjectIds
    const participantObjectIds = participants.map(id => new ObjectId(id));

    // Update meeting
    const updateData = {
      title,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      participantIds: participantObjectIds,
      locationType,
      location: locationType === 'room' ? 'Main Room' : (location || ''),
      notes: notes || '',
      updatedAt: new Date()
    };

    await db.collection('meetings').updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    );

    // Get participant details for notifications
    const participantsData = await db.collection('users').find({
      _id: { $in: participantObjectIds }
    }).toArray();

    // Send update notifications to all participants
    const locationText = locationType === 'room' ? 'Main Room' : 
                        locationType === 'online' ? 'Online Meeting' : 
                        location || 'External Location';

    const notificationTitle = '📝 Meeting Updated';
    const notificationMessage = `The meeting "${title}" has been updated. New time: ${new Date(startDate).toLocaleDateString()} at ${new Date(startDate).toLocaleTimeString()}. Location: ${locationText}`;

    for (const participant of participantsData) {
      await createNotification(
        participant.email,
        notificationTitle,
        notificationMessage,
        'meeting',
        new ObjectId(id)
      );
    }

    console.log('✅ Meeting updated successfully:', id);
    res.json({ 
      message: 'Meeting updated successfully',
      participantsNotified: participantsData.length
    });

  } catch (error) {
    console.error('❌ Error updating meeting:', error);
    res.status(500).json({ error: 'Failed to update meeting' });
  }
});

// PUT /api/meetings/:id/cancel - Cancel a meeting
router.put('/:id/cancel', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid meeting ID' });
    }

    const db = await getDb();

    // Check if meeting exists and user is the organizer
    const existingMeeting = await db.collection('meetings').findOne({
      _id: new ObjectId(id)
    });

    if (!existingMeeting) {
      return res.status(404).json({ error: 'Meeting not found' });
    }

    if (existingMeeting.organizerId.toString() !== (req.user.id || req.user.user_id)) {
      return res.status(403).json({ error: 'Only the organizer can cancel this meeting' });
    }

    if (existingMeeting.status === 'cancelled') {
      return res.status(400).json({ error: 'Meeting is already cancelled' });
    }

    // Cancel the meeting
    await db.collection('meetings').updateOne(
      { _id: new ObjectId(id) },
      { 
        $set: { 
          status: 'cancelled',
          updatedAt: new Date()
        }
      }
    );

    // Get participant details for notifications
    const participantsData = await db.collection('users').find({
      _id: { $in: existingMeeting.participantIds }
    }).toArray();

    // Send cancellation notifications to all participants
    const locationText = existingMeeting.locationType === 'room' ? 'Main Room' : 
                        existingMeeting.locationType === 'online' ? 'Online Meeting' : 
                        existingMeeting.location || 'External Location';

    const notificationTitle = '❌ Meeting Cancelled';
    const notificationMessage = `The meeting "${existingMeeting.title}" scheduled for ${new Date(existingMeeting.startDate).toLocaleDateString()} at ${new Date(existingMeeting.startDate).toLocaleTimeString()} has been cancelled.`;

    for (const participant of participantsData) {
      await createNotification(
        participant.email,
        notificationTitle,
        notificationMessage,
        'meeting',
        new ObjectId(id)
      );
    }

    console.log('✅ Meeting cancelled successfully:', id);
    res.json({ 
      message: 'Meeting cancelled successfully',
      participantsNotified: participantsData.length
    });

  } catch (error) {
    console.error('❌ Error cancelling meeting:', error);
    res.status(500).json({ error: 'Failed to cancel meeting' });
  }
});

// PUT /api/meetings/:id/complete - Mark meeting as completed
router.put('/:id/complete', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid meeting ID' });
    }

    const db = await getDb();

    // Check if meeting exists and user is the organizer
    const existingMeeting = await db.collection('meetings').findOne({
      _id: new ObjectId(id)
    });

    if (!existingMeeting) {
      return res.status(404).json({ error: 'Meeting not found' });
    }

    if (existingMeeting.organizerId.toString() !== (req.user.id || req.user.user_id)) {
      return res.status(403).json({ error: 'Only the organizer can mark this meeting as completed' });
    }

    // Mark as completed
    await db.collection('meetings').updateOne(
      { _id: new ObjectId(id) },
      { 
        $set: { 
          status: 'completed',
          completedAt: new Date(),
          updatedAt: new Date()
        }
      }
    );

    console.log('✅ Meeting marked as completed:', id);
    res.json({ message: 'Meeting marked as completed' });

  } catch (error) {
    console.error('❌ Error completing meeting:', error);
    res.status(500).json({ error: 'Failed to complete meeting' });
  }
});

// GET /api/meetings/:id - Get a specific meeting
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid meeting ID' });
    }

    const db = await getDb();

    const meetings = await db.collection('meetings').aggregate([
      { $match: { _id: new ObjectId(id) } },
      {
        $lookup: {
          from: 'users',
          localField: 'organizerId',
          foreignField: '_id',
          as: 'organizerData'
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'participantIds',
          foreignField: '_id',
          as: 'participantsData'
        }
      },
      {
        $project: {
          title: 1,
          startDate: 1,
          endDate: 1,
          locationType: 1,
          location: 1,
          notes: 1,
          status: 1,
          createdAt: 1,
          updatedAt: 1,
          organizer: {
            $arrayElemAt: [
              {
                $map: {
                  input: '$organizerData',
                  as: 'org',
                  in: {
                    _id: '$$org._id',
                    name: { $ifNull: ['$$org.name', '$$org.full_name'] },
                    email: '$$org.email'
                  }
                }
              },
              0
            ]
          },
          participants: {
            $map: {
              input: '$participantsData',
              as: 'participant',
              in: {
                _id: '$$participant._id',
                name: { $ifNull: ['$$participant.name', '$$participant.full_name'] },
                email: '$$participant.email'
              }
            }
          }
        }
      }
    ]).toArray();

    const meeting = meetings[0];
    if (!meeting) {
      return res.status(404).json({ error: 'Meeting not found' });
    }

    res.json(meeting);
  } catch (error) {
    console.error('❌ Error fetching meeting:', error);
    res.status(500).json({ error: 'Failed to fetch meeting' });
  }
});

// DELETE /api/meetings/:id - Delete a meeting permanently
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid meeting ID' });
    }

    const db = await getDb();

    // Check if meeting exists and user is the organizer
    const existingMeeting = await db.collection('meetings').findOne({
      _id: new ObjectId(id)
    });

    if (!existingMeeting) {
      return res.status(404).json({ error: 'Meeting not found' });
    }

    if (existingMeeting.organizerId.toString() !== (req.user.id || req.user.user_id)) {
      return res.status(403).json({ error: 'Only the organizer can delete this meeting' });
    }

    // Delete the meeting
    await db.collection('meetings').deleteOne({ _id: new ObjectId(id) });

    console.log('✅ Meeting deleted successfully:', id);
    res.json({ message: 'Meeting deleted successfully' });

  } catch (error) {
    console.error('❌ Error deleting meeting:', error);
    res.status(500).json({ error: 'Failed to delete meeting' });
  }
});

module.exports = router;