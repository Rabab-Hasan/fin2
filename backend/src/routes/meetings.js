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

// Helper function to get current date
const getCurrentDate = () => new Date().toISOString();

// Helper function to check for meeting conflicts
async function checkMeetingConflicts(startTime, endTime, roomId = 'main-room', excludeId = null) {
  const db = await getDb();
  const meetings = db.collection('meetings');
  
  const query = {
    status: { $ne: 'cancelled' },
    room: roomId,
    $or: [
      // New meeting starts during existing meeting
      {
        startTime: { $lte: startTime },
        endTime: { $gt: startTime }
      },
      // New meeting ends during existing meeting
      {
        startTime: { $lt: endTime },
        endTime: { $gte: endTime }
      },
      // New meeting encompasses existing meeting
      {
        startTime: { $gte: startTime },
        endTime: { $lte: endTime }
      }
    ]
  };
  
  if (excludeId) {
    query._id = { $ne: new ObjectId(excludeId) };
  }
  
  const conflictingMeetings = await meetings.find(query).toArray();
  return conflictingMeetings;
}

// Helper function to create meeting notifications
async function createMeetingNotification(type, meeting, user) {
  try {
    const db = await getDb();
    const users = db.collection('users');
    const notifications = db.collection('notifications');
    
    let recipients = [];
    
    // Get organizer and participant details
    const organizer = await users.findOne({ 
      $or: [
        { _id: new ObjectId(meeting.organizer) },
        { _id: meeting.organizer }
      ]
    });
    
    // Add all participants as recipients
    for (const participantId of meeting.participants) {
      const participant = await users.findOne({ 
        $or: [
          { _id: new ObjectId(participantId) },
          { _id: participantId }
        ]
      });
      if (participant) recipients.push(participant);
    }
    
    // Create notification for each recipient
    const notificationPromises = recipients.map(recipient => {
      let title, message;
      
      switch (type) {
        case 'created':
          title = 'New Meeting Scheduled';
          message = `${organizer?.full_name || 'Someone'} has scheduled a new meeting: "${meeting.title}"`;
          break;
        case 'updated':
          title = 'Meeting Updated';
          message = `Meeting "${meeting.title}" has been updated by ${user.full_name || user.email}`;
          break;
        case 'cancelled':
          title = 'Meeting Cancelled';
          message = `Meeting "${meeting.title}" has been cancelled by ${user.full_name || user.email}`;
          break;
        case 'reminder':
          title = `Meeting Reminder: ${meeting.title}`;
          message = `Your meeting "${meeting.title}" starts soon at ${new Date(meeting.startTime).toLocaleTimeString()}`;
          break;
        default:
          return null;
      }
      
      return notifications.insertOne({
        recipientEmail: recipient.email,
        userId: recipient._id,
        title,
        message,
        type: 'meeting',
        read: false,
        createdAt: new Date(),
        metadata: {
          meetingId: meeting._id,
          meetingTitle: meeting.title,
          startTime: meeting.startTime,
          endTime: meeting.endTime,
          organizer: organizer?.full_name || organizer?.email
        }
      });
    });
    
    await Promise.all(notificationPromises.filter(p => p !== null));
    console.log(`📅 Meeting notifications sent to ${recipients.length} recipients`);
    
  } catch (error) {
    console.error('Error creating meeting notifications:', error);
  }
}

// ======================
// MEETINGS ENDPOINTS
// ======================

// GET /api/meetings - Get all meetings with optional filters
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { 
      startDate, 
      endDate, 
      organizer, 
      participant, 
      status = 'all',
      view = 'month'
    } = req.query;
    
    const db = await getDb();
    const meetings = db.collection('meetings');
    
    // Build query
    let query = {};
    
    // Date range filter
    if (startDate || endDate) {
      query.startTime = {};
      if (startDate) query.startTime.$gte = new Date(startDate);
      if (endDate) query.startTime.$lte = new Date(endDate);
    }
    
    // Organizer filter
    if (organizer) {
      query.organizer = organizer;
    }
    
    // Participant filter
    if (participant) {
      query.participants = { $in: [participant] };
    }
    
    // Status filter
    if (status !== 'all') {
      query.status = status;
    }
    
    // Get meetings
    const meetingsList = await meetings
      .find(query)
      .sort({ startTime: 1 })
      .toArray();
    
    // Populate organizer and participant details
    const users = db.collection('users');
    const enrichedMeetings = await Promise.all(
      meetingsList.map(async (meeting) => {
        // Get organizer details
        const organizer = await users.findOne({ 
          $or: [
            { _id: new ObjectId(meeting.organizer) },
            { _id: meeting.organizer }
          ]
        });
        
        // Get participant details
        const participants = await Promise.all(
          meeting.participants.map(async (participantId) => {
            const participant = await users.findOne({ 
              $or: [
                { _id: new ObjectId(participantId) },
                { _id: participantId }
              ]
            });
            return participant;
          })
        );
        
        return {
          ...meeting,
          organizerDetails: organizer,
          participantDetails: participants.filter(p => p !== null)
        };
      })
    );
    
    res.json({ 
      meetings: enrichedMeetings,
      total: enrichedMeetings.length
    });
    
  } catch (error) {
    console.error('Error fetching meetings:', error);
    res.status(500).json({ error: 'Failed to fetch meetings' });
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
    const meetings = db.collection('meetings');
    const users = db.collection('users');
    
    const meeting = await meetings.findOne({ _id: new ObjectId(id) });
    
    if (!meeting) {
      return res.status(404).json({ error: 'Meeting not found' });
    }
    
    // Get organizer details
    const organizer = await users.findOne({ 
      $or: [
        { _id: new ObjectId(meeting.organizer) },
        { _id: meeting.organizer }
      ]
    });
    
    // Get participant details
    const participants = await Promise.all(
      meeting.participants.map(async (participantId) => {
        const participant = await users.findOne({ 
          $or: [
            { _id: new ObjectId(participantId) },
            { _id: participantId }
          ]
        });
        return participant;
      })
    );
    
    const enrichedMeeting = {
      ...meeting,
      organizerDetails: organizer,
      participantDetails: participants.filter(p => p !== null)
    };
    
    res.json({ meeting: enrichedMeeting });
    
  } catch (error) {
    console.error('Error fetching meeting:', error);
    res.status(500).json({ error: 'Failed to fetch meeting' });
  }
});

// POST /api/meetings - Create a new meeting
router.post('/', authenticateToken, async (req, res) => {
  try {
    const {
      title,
      startTime,
      endTime,
      participants = [],
      room = 'main-room',
      notes = '',
      agenda = '',
      reminderMinutes = 15
    } = req.body;
    
    // Validation
    if (!title || !startTime || !endTime) {
      return res.status(400).json({ error: 'Title, start time, and end time are required' });
    }
    
    const start = new Date(startTime);
    const end = new Date(endTime);
    
    if (start >= end) {
      return res.status(400).json({ error: 'End time must be after start time' });
    }
    
    if (start < new Date()) {
      return res.status(400).json({ error: 'Cannot schedule meetings in the past' });
    }
    
    // Check for conflicts
    const conflicts = await checkMeetingConflicts(start, end, room);
    if (conflicts.length > 0) {
      return res.status(409).json({ 
        error: 'Room already booked for part of this time',
        conflicts: conflicts.map(c => ({
          id: c._id,
          title: c.title,
          startTime: c.startTime,
          endTime: c.endTime
        }))
      });
    }
    
    const db = await getDb();
    const meetings = db.collection('meetings');
    
    const meeting = {
      title: title.trim(),
      startTime: start,
      endTime: end,
      organizer: req.user.id || req.user._id,
      participants: [...new Set(participants)], // Remove duplicates
      room,
      notes: notes.trim(),
      agenda: agenda.trim(),
      status: 'scheduled',
      reminderMinutes: parseInt(reminderMinutes) || 15,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const result = await meetings.insertOne(meeting);
    meeting._id = result.insertedId;
    
    // Send notifications to all participants
    await createMeetingNotification('created', meeting, req.user);
    
    res.status(201).json({ 
      meeting,
      message: 'Meeting created successfully'
    });
    
  } catch (error) {
    console.error('Error creating meeting:', error);
    res.status(500).json({ error: 'Failed to create meeting' });
  }
});

// PUT /api/meetings/:id - Update a meeting
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      startTime,
      endTime,
      participants,
      room,
      notes,
      agenda,
      reminderMinutes
    } = req.body;
    
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid meeting ID' });
    }
    
    const db = await getDb();
    const meetings = db.collection('meetings');
    
    const existingMeeting = await meetings.findOne({ _id: new ObjectId(id) });
    if (!existingMeeting) {
      return res.status(404).json({ error: 'Meeting not found' });
    }
    
    // Check if user is organizer or admin
    const isOrganizer = existingMeeting.organizer === req.user.id || 
                       existingMeeting.organizer === req.user._id;
    const isAdmin = req.user.user_type === 'admin' || req.user.email === 'admin@example.com';
    
    if (!isOrganizer && !isAdmin) {
      return res.status(403).json({ error: 'Only the organizer or admin can edit this meeting' });
    }
    
    const updateData = {};
    
    if (title !== undefined) updateData.title = title.trim();
    if (notes !== undefined) updateData.notes = notes.trim();
    if (agenda !== undefined) updateData.agenda = agenda.trim();
    if (participants !== undefined) updateData.participants = [...new Set(participants)];
    if (room !== undefined) updateData.room = room;
    if (reminderMinutes !== undefined) updateData.reminderMinutes = parseInt(reminderMinutes) || 15;
    
    // Handle time changes with conflict checking
    if (startTime !== undefined || endTime !== undefined) {
      const newStart = startTime ? new Date(startTime) : existingMeeting.startTime;
      const newEnd = endTime ? new Date(endTime) : existingMeeting.endTime;
      
      if (newStart >= newEnd) {
        return res.status(400).json({ error: 'End time must be after start time' });
      }
      
      // Check for conflicts (excluding current meeting)
      const conflicts = await checkMeetingConflicts(
        newStart, 
        newEnd, 
        updateData.room || existingMeeting.room, 
        id
      );
      
      if (conflicts.length > 0) {
        return res.status(409).json({ 
          error: 'Room already booked for part of this time',
          conflicts: conflicts.map(c => ({
            id: c._id,
            title: c.title,
            startTime: c.startTime,
            endTime: c.endTime
          }))
        });
      }
      
      updateData.startTime = newStart;
      updateData.endTime = newEnd;
    }
    
    updateData.updatedAt = new Date();
    
    const result = await meetings.updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    );
    
    if (result.modifiedCount === 0) {
      return res.status(404).json({ error: 'Meeting not found or no changes made' });
    }
    
    // Get updated meeting
    const updatedMeeting = await meetings.findOne({ _id: new ObjectId(id) });
    
    // Send update notifications
    await createMeetingNotification('updated', updatedMeeting, req.user);
    
    res.json({ 
      meeting: updatedMeeting,
      message: 'Meeting updated successfully'
    });
    
  } catch (error) {
    console.error('Error updating meeting:', error);
    res.status(500).json({ error: 'Failed to update meeting' });
  }
});

// DELETE /api/meetings/:id - Cancel a meeting
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid meeting ID' });
    }
    
    const db = await getDb();
    const meetings = db.collection('meetings');
    
    const meeting = await meetings.findOne({ _id: new ObjectId(id) });
    if (!meeting) {
      return res.status(404).json({ error: 'Meeting not found' });
    }
    
    // Check if user is organizer or admin
    const isOrganizer = meeting.organizer === req.user.id || 
                       meeting.organizer === req.user._id;
    const isAdmin = req.user.user_type === 'admin' || req.user.email === 'admin@example.com';
    
    if (!isOrganizer && !isAdmin) {
      return res.status(403).json({ error: 'Only the organizer or admin can cancel this meeting' });
    }
    
    // Update status to cancelled instead of deleting
    const result = await meetings.updateOne(
      { _id: new ObjectId(id) },
      { 
        $set: { 
          status: 'cancelled',
          cancelledAt: new Date(),
          cancelledBy: req.user.id || req.user._id,
          updatedAt: new Date()
        }
      }
    );
    
    if (result.modifiedCount === 0) {
      return res.status(404).json({ error: 'Meeting not found' });
    }
    
    // Get cancelled meeting for notifications
    const cancelledMeeting = await meetings.findOne({ _id: new ObjectId(id) });
    
    // Send cancellation notifications
    await createMeetingNotification('cancelled', cancelledMeeting, req.user);
    
    res.json({ 
      message: 'Meeting cancelled successfully',
      meeting: cancelledMeeting
    });
    
  } catch (error) {
    console.error('Error cancelling meeting:', error);
    res.status(500).json({ error: 'Failed to cancel meeting' });
  }
});

// POST /api/meetings/:id/complete - Mark meeting as completed
router.post('/:id/complete', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;
    
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid meeting ID' });
    }
    
    const db = await getDb();
    const meetings = db.collection('meetings');
    
    const meeting = await meetings.findOne({ _id: new ObjectId(id) });
    if (!meeting) {
      return res.status(404).json({ error: 'Meeting not found' });
    }
    
    // Check if user is organizer or admin
    const isOrganizer = meeting.organizer === req.user.id || 
                       meeting.organizer === req.user._id;
    const isAdmin = req.user.user_type === 'admin' || req.user.email === 'admin@example.com';
    
    if (!isOrganizer && !isAdmin) {
      return res.status(403).json({ error: 'Only the organizer or admin can complete this meeting' });
    }
    
    const updateData = {
      status: 'completed',
      completedAt: new Date(),
      completedBy: req.user.id || req.user._id,
      updatedAt: new Date()
    };
    
    if (notes) {
      updateData.completionNotes = notes.trim();
    }
    
    const result = await meetings.updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    );
    
    if (result.modifiedCount === 0) {
      return res.status(404).json({ error: 'Meeting not found' });
    }
    
    const completedMeeting = await meetings.findOne({ _id: new ObjectId(id) });
    
    res.json({ 
      message: 'Meeting marked as completed',
      meeting: completedMeeting
    });
    
  } catch (error) {
    console.error('Error completing meeting:', error);
    res.status(500).json({ error: 'Failed to complete meeting' });
  }
});

// GET /api/meetings/conflicts/check - Check for conflicts for a potential meeting
router.get('/conflicts/check', authenticateToken, async (req, res) => {
  try {
    const { startTime, endTime, room = 'main-room', excludeId } = req.query;
    
    if (!startTime || !endTime) {
      return res.status(400).json({ error: 'Start time and end time are required' });
    }
    
    const start = new Date(startTime);
    const end = new Date(endTime);
    
    if (start >= end) {
      return res.status(400).json({ error: 'End time must be after start time' });
    }
    
    const conflicts = await checkMeetingConflicts(start, end, room, excludeId);
    
    res.json({ 
      hasConflicts: conflicts.length > 0,
      conflicts: conflicts.map(c => ({
        id: c._id,
        title: c.title,
        startTime: c.startTime,
        endTime: c.endTime,
        organizer: c.organizer
      }))
    });
    
  } catch (error) {
    console.error('Error checking conflicts:', error);
    res.status(500).json({ error: 'Failed to check conflicts' });
  }
});

// GET /api/meetings/calendar/events - Get calendar events for calendar view
router.get('/calendar/events', authenticateToken, async (req, res) => {
  try {
    const { 
      start, 
      end, 
      includeTasks = false 
    } = req.query;
    
    const db = await getDb();
    const meetings = db.collection('meetings');
    
    // Build query for meetings
    let query = {};
    if (start || end) {
      query.startTime = {};
      if (start) query.startTime.$gte = new Date(start);
      if (end) query.startTime.$lte = new Date(end);
    }
    
    // Get meetings
    const meetingsList = await meetings.find(query).sort({ startTime: 1 }).toArray();
    
    // Transform meetings to calendar events
    const events = meetingsList.map(meeting => ({
      id: meeting._id,
      title: meeting.title,
      start: meeting.startTime,
      end: meeting.endTime,
      type: 'meeting',
      status: meeting.status,
      room: meeting.room,
      organizer: meeting.organizer,
      participants: meeting.participants,
      backgroundColor: meeting.status === 'cancelled' ? '#ef4444' : '#10b981',
      borderColor: meeting.status === 'cancelled' ? '#dc2626' : '#059669',
      textColor: '#ffffff'
    }));
    
    // Optionally include tasks if requested
    if (includeTasks === 'true') {
      try {
        const tasks = db.collection('tasks');
        const tasksList = await tasks.find({
          dueDate: query.startTime || {}
        }).sort({ dueDate: 1 }).toArray();
        
        const taskEvents = tasksList.map(task => ({
          id: task._id,
          title: `Task: ${task.title}`,
          start: task.dueDate,
          allDay: true,
          type: 'task',
          status: task.status,
          backgroundColor: '#3b82f6',
          borderColor: '#2563eb',
          textColor: '#ffffff'
        }));
        
        events.push(...taskEvents);
      } catch (taskError) {
        console.error('Error fetching tasks for calendar:', taskError);
        // Continue without tasks if there's an error
      }
    }
    
    res.json({ events });
    
  } catch (error) {
    console.error('Error fetching calendar events:', error);
    res.status(500).json({ error: 'Failed to fetch calendar events' });
  }
});

// GET /api/meetings/users - Get all users for participant selection
router.get('/users', authenticateToken, async (req, res) => {
  try {
    const db = await getDb();
    const users = db.collection('users');
    
    const usersList = await users
      .find(
        { user_type: { $in: ['admin', 'employee'] } },
        { 
          projection: { 
            _id: 1, 
            full_name: 1, 
            email: 1, 
            user_type: 1 
          } 
        }
      )
      .sort({ full_name: 1 })
      .toArray();
    
    res.json({ users: usersList });
    
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

module.exports = router;