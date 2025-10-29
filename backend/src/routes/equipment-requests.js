const express = require('express');
const { ObjectId } = require('mongodb');
const { getDb } = require('../database-mongo');
const multer = require('multer');
const path = require('path');
const fs = require('fs-extra');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.join(__dirname, '../../uploads/equipment-requests');
    fs.ensureDirSync(uploadPath);
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// GET /api/equipment-requests - Get all equipment requests
router.get('/', async (req, res) => {
  try {
    const { status, employeeId, equipmentType } = req.query;
    const db = await getDb();
    
    const filter = {};
    if (status) filter.status = status;
    if (employeeId) filter.employeeId = employeeId;
    if (equipmentType) filter.equipmentType = equipmentType;

    const requests = await db.collection('equipment_requests')
      .find(filter)
      .sort({ createdAt: -1 })
      .toArray();

    res.json(requests);
  } catch (error) {
    console.error('Error fetching equipment requests:', error);
    res.status(500).json({ error: 'Failed to fetch equipment requests' });
  }
});

// GET /api/equipment-requests/my - Get current user's equipment requests
router.get('/my', async (req, res) => {
  try {
    const userEmail = req.user?.email;
    if (!userEmail) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const db = await getDb();
    const requests = await db.collection('equipment_requests')
      .find({ employeeEmail: userEmail })
      .sort({ createdAt: -1 })
      .toArray();

    res.json(requests);
  } catch (error) {
    console.error('Error fetching user equipment requests:', error);
    res.status(500).json({ error: 'Failed to fetch your equipment requests' });
  }
});

// POST /api/equipment-requests - Create new equipment request
router.post('/', upload.array('attachments', 5), async (req, res) => {
  try {
    const {
      equipmentType,
      specificModel,
      quantity,
      reason,
      urgencyLevel
    } = req.body;

    if (!equipmentType || !quantity || !reason) {
      return res.status(400).json({ 
        error: 'Equipment type, quantity, and reason are required' 
      });
    }

    const userEmail = req.user?.email;
    const userName = req.user?.name;
    const userDepartment = req.user?.department;

    if (!userEmail) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const db = await getDb();
    
    const requestData = {
      employeeId: req.user?.id || userEmail,
      employeeName: userName || 'Unknown',
      employeeEmail: userEmail,
      department: userDepartment || '',
      equipmentType,
      specificModel: specificModel || '',
      quantity: parseInt(quantity),
      reason,
      urgencyLevel: urgencyLevel || 'Normal',
      status: 'Pending',
      attachments: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Add attachment paths if uploaded
    if (req.files && req.files.length > 0) {
      requestData.attachments = req.files.map(file => `/uploads/equipment-requests/${file.filename}`);
    }

    const result = await db.collection('equipment_requests').insertOne(requestData);
    const newRequest = await db.collection('equipment_requests').findOne({ _id: result.insertedId });

    res.status(201).json(newRequest);
  } catch (error) {
    console.error('Error creating equipment request:', error);
    res.status(500).json({ error: 'Failed to create equipment request' });
  }
});

// PUT /api/equipment-requests/:id/approve - Approve equipment request
router.put('/:id/approve', async (req, res) => {
  try {
    const { id } = req.params;
    const { comments, assignedEquipmentId } = req.body;

    const db = await getDb();
    
    const updateData = {
      status: 'Approved',
      hrComments: comments || '',
      assignedBy: req.user?.name || 'HR',
      assignedAt: new Date(),
      updatedAt: new Date()
    };

    if (assignedEquipmentId) {
      updateData.assignedEquipmentId = assignedEquipmentId;
      
      // Reduce available quantity from inventory
      const request = await db.collection('equipment_requests').findOne({ _id: new ObjectId(id) });
      if (request) {
        await db.collection('equipment_inventory').updateOne(
          { _id: new ObjectId(assignedEquipmentId) },
          { 
            $inc: { quantityAvailable: -request.quantity },
            $set: { updatedAt: new Date() }
          }
        );
      }
    }

    const result = await db.collection('equipment_requests').updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: 'Equipment request not found' });
    }

    const updatedRequest = await db.collection('equipment_requests').findOne({ _id: new ObjectId(id) });
    res.json(updatedRequest);
  } catch (error) {
    console.error('Error approving equipment request:', error);
    res.status(500).json({ error: 'Failed to approve equipment request' });
  }
});

// PUT /api/equipment-requests/:id/reject - Reject equipment request
router.put('/:id/reject', async (req, res) => {
  try {
    const { id } = req.params;
    const { reason, comments } = req.body;

    if (!reason) {
      return res.status(400).json({ error: 'Rejection reason is required' });
    }

    const db = await getDb();
    
    const updateData = {
      status: 'Rejected',
      rejectionReason: reason,
      hrComments: comments || '',
      rejectedBy: req.user?.name || 'HR',
      rejectedAt: new Date(),
      updatedAt: new Date()
    };

    const result = await db.collection('equipment_requests').updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: 'Equipment request not found' });
    }

    const updatedRequest = await db.collection('equipment_requests').findOne({ _id: new ObjectId(id) });
    res.json(updatedRequest);
  } catch (error) {
    console.error('Error rejecting equipment request:', error);
    res.status(500).json({ error: 'Failed to reject equipment request' });
  }
});

// PUT /api/equipment-requests/:id/deliver - Mark equipment as delivered
router.put('/:id/deliver', async (req, res) => {
  try {
    const { id } = req.params;
    const { comments } = req.body;

    const db = await getDb();
    
    const updateData = {
      status: 'Delivered',
      hrComments: comments || '',
      deliveredBy: req.user?.name || 'HR',
      deliveredAt: new Date(),
      updatedAt: new Date()
    };

    const result = await db.collection('equipment_requests').updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: 'Equipment request not found' });
    }

    const updatedRequest = await db.collection('equipment_requests').findOne({ _id: new ObjectId(id) });
    res.json(updatedRequest);
  } catch (error) {
    console.error('Error marking equipment as delivered:', error);
    res.status(500).json({ error: 'Failed to mark equipment as delivered' });
  }
});

// DELETE /api/equipment-requests/:id - Cancel equipment request
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const db = await getDb();
    
    const request = await db.collection('equipment_requests').findOne({ _id: new ObjectId(id) });
    
    if (!request) {
      return res.status(404).json({ error: 'Equipment request not found' });
    }

    // Only allow cancellation of pending requests
    if (request.status !== 'Pending') {
      return res.status(400).json({ error: 'Can only cancel pending requests' });
    }

    const result = await db.collection('equipment_requests').updateOne(
      { _id: new ObjectId(id) },
      { 
        $set: { 
          status: 'Cancelled',
          updatedAt: new Date()
        } 
      }
    );

    res.json({ message: 'Equipment request cancelled successfully' });
  } catch (error) {
    console.error('Error cancelling equipment request:', error);
    res.status(500).json({ error: 'Failed to cancel equipment request' });
  }
});

// GET /api/equipment-requests/stats - Get equipment request statistics
router.get('/stats', async (req, res) => {
  try {
    const db = await getDb();
    
    const stats = await db.collection('equipment_requests').aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]).toArray();

    const statsObj = {
      total: 0,
      pending: 0,
      approved: 0,
      rejected: 0,
      delivered: 0,
      cancelled: 0
    };

    stats.forEach(stat => {
      statsObj.total += stat.count;
      statsObj[stat._id.toLowerCase()] = stat.count;
    });

    res.json(statsObj);
  } catch (error) {
    console.error('Error fetching equipment request stats:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

module.exports = router;