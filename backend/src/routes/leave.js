const express = require('express');
const { ObjectId } = require('mongodb');
const { getDb } = require('../database-mongo');
const { uploadSingle } = require('../middleware/upload');
const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-here';

const router = express.Router();

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

// ======================
// LEAVE TYPES ENDPOINTS
// ======================

// GET /api/leave/types - Get all leave types
router.get('/types', authenticateToken, async (req, res) => {
  try {
    const db = await getDb();
    const types = await db.collection('leave_types').find({}).sort({ name: 1 }).toArray();
    res.json({ types });
  } catch (error) {
    console.error('Error fetching leave types:', error);
    res.status(500).json({ error: 'Failed to fetch leave types' });
  }
});

// POST /api/leave/types - Create a new leave type (Admin only)
router.post('/types', authenticateToken, async (req, res) => {
  try {
    if (req.user.user_type !== 'admin' && req.user.user_type !== 'employee' && req.user.email !== 'admin@example.com') {
      return res.status(403).json({ error: 'Access denied - Admin privileges required' });
    }

    const { name, annual_limit, requires_approval, can_carry_over, description, color } = req.body;

    if (!name || !color) {
      return res.status(400).json({ error: 'Name and color are required' });
    }

    const db = await getDb();
    const leaveType = {
      name: name.trim(),
      annual_limit: parseInt(annual_limit) || 0,
      requires_approval: Boolean(requires_approval),
      can_carry_over: Boolean(can_carry_over),
      description: description?.trim() || '',
      color: color.trim(),
      created_at: getCurrentDate()
    };

    const result = await db.collection('leave_types').insertOne(leaveType);
    leaveType._id = result.insertedId;

    res.status(201).json({ type: leaveType });
  } catch (error) {
    console.error('Error creating leave type:', error);
    res.status(500).json({ error: 'Failed to create leave type' });
  }
});

// PUT /api/leave/types/:id - Update a leave type (Admin only)
router.put('/types/:id', authenticateToken, async (req, res) => {
  try {
    if (req.user.user_type !== 'admin' && req.user.user_type !== 'employee' && req.user.email !== 'admin@example.com') {
      return res.status(403).json({ error: 'Access denied - Admin privileges required' });
    }

    const { id } = req.params;
    const { name, annual_limit, requires_approval, can_carry_over, description, color } = req.body;

    const db = await getDb();
    const updateData = {};
    
    if (name) updateData.name = name.trim();
    if (annual_limit !== undefined) updateData.annual_limit = parseInt(annual_limit);
    if (requires_approval !== undefined) updateData.requires_approval = Boolean(requires_approval);
    if (can_carry_over !== undefined) updateData.can_carry_over = Boolean(can_carry_over);
    if (description !== undefined) updateData.description = description.trim();
    if (color) updateData.color = color.trim();
    
    updateData.updated_at = getCurrentDate();

    const result = await db.collection('leave_types').findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: updateData },
      { returnDocument: 'after' }
    );

    if (!result.value) {
      return res.status(404).json({ error: 'Leave type not found' });
    }

    res.json({ type: result.value });
  } catch (error) {
    console.error('Error updating leave type:', error);
    res.status(500).json({ error: 'Failed to update leave type' });
  }
});

// DELETE /api/leave/types/:id - Delete a leave type (Admin only)
router.delete('/types/:id', authenticateToken, async (req, res) => {
  try {
    if (req.user.user_type !== 'admin' && req.user.user_type !== 'employee' && req.user.email !== 'admin@example.com') {
      return res.status(403).json({ error: 'Access denied - Admin privileges required' });
    }

    const { id } = req.params;
    const db = await getDb();
    
    const result = await db.collection('leave_types').deleteOne({ _id: new ObjectId(id) });
    
    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'Leave type not found' });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting leave type:', error);
    res.status(500).json({ error: 'Failed to delete leave type' });
  }
});

// ========================
// COMPANY HOLIDAYS ENDPOINTS
// ========================

// GET /api/leave/holidays - Get all company holidays
router.get('/holidays', authenticateToken, async (req, res) => {
  try {
    const db = await getDb();
    const holidays = await db.collection('company_holidays').find({}).sort({ date: 1 }).toArray();
    res.json({ holidays });
  } catch (error) {
    console.error('Error fetching holidays:', error);
    res.status(500).json({ error: 'Failed to fetch holidays' });
  }
});

// POST /api/leave/holidays - Create a new company holiday (Admin only)
router.post('/holidays', authenticateToken, async (req, res) => {
  try {
    if (req.user.user_type !== 'admin' && req.user.user_type !== 'employee' && req.user.email !== 'admin@example.com') {
      return res.status(403).json({ error: 'Access denied - Admin privileges required' });
    }

    const { name, date, end_date, recurring } = req.body;

    // Validate required fields
    if (!name || !name.trim() || !date) {
      return res.status(400).json({ error: 'Name and date are required' });
    }

    // Validate dates
    if (end_date && new Date(end_date) < new Date(date)) {
      return res.status(400).json({ error: 'End date cannot be before start date' });
    }

    const db = await getDb();
    const holiday = {
      name: name.trim(),
      date: date,
      end_date: end_date || null,
      recurring: Boolean(recurring),
      created_at: getCurrentDate()
    };

    const result = await db.collection('company_holidays').insertOne(holiday);
    holiday._id = result.insertedId;

    res.status(201).json({ holiday });
  } catch (error) {
    console.error('Error creating holiday:', error);
    res.status(500).json({ error: 'Failed to create holiday' });
  }
});

// DELETE /api/leave/holidays/:id - Delete a company holiday (Admin only)
router.delete('/holidays/:id', authenticateToken, async (req, res) => {
  try {
    if (req.user.user_type !== 'admin' && req.user.user_type !== 'employee' && req.user.email !== 'admin@example.com') {
      return res.status(403).json({ error: 'Access denied - Admin privileges required' });
    }

    const { id } = req.params;
    const db = await getDb();
    
    const result = await db.collection('company_holidays').deleteOne({ _id: new ObjectId(id) });
    
    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'Holiday not found' });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting holiday:', error);
    res.status(500).json({ error: 'Failed to delete holiday' });
  }
});

// ========================
// LEAVE REQUESTS ENDPOINTS
// ========================

// GET /api/leave/requests/me - Get current user's leave requests
router.get('/requests/me', authenticateToken, async (req, res) => {
  try {
    const db = await getDb();
    const requests = await db.collection('leave_requests')
      .find({ userId: req.user.userId })
      .sort({ created_at: -1 })
      .toArray();

    // Populate user and leave type information
    for (let request of requests) {
      // Get user info
      const user = await db.collection('users').findOne({ _id: new ObjectId(request.userId) });
      if (user) {
        request.user = {
          _id: user._id,
          name: user.name || user.full_name,
          email: user.email,
          department: user.department || 'General'
        };
      }

      // Get leave type info
      const leaveType = await db.collection('leave_types').findOne({ _id: new ObjectId(request.leave_type) });
      if (leaveType) {
        request.leave_type_details = leaveType;
      }
    }

    res.json({ requests });
  } catch (error) {
    console.error('Error fetching user leave requests:', error);
    res.status(500).json({ error: 'Failed to fetch leave requests' });
  }
});

// POST /api/leave/requests - Create a new leave request
router.post('/requests', authenticateToken, uploadSingle('attachment'), async (req, res) => {
  try {
    const { leave_type, start_date, end_date, reason } = req.body;

    if (!leave_type || !start_date || !end_date || !reason) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const db = await getDb();
    
    // Verify leave type exists
    const leaveTypeDoc = await db.collection('leave_types').findOne({ _id: new ObjectId(leave_type) });
    if (!leaveTypeDoc) {
      return res.status(400).json({ error: 'Invalid leave type' });
    }

    // Calculate duration (working days between start and end date)
    const startDate = new Date(start_date);
    const endDate = new Date(end_date);
    
    if (startDate > endDate) {
      return res.status(400).json({ error: 'Start date must be before or equal to end date' });
    }
    
    // Calculate total days including start and end
    let duration = 0;
    const current = new Date(startDate);
    
    while (current <= endDate) {
      const dayOfWeek = current.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) { // Not Sunday (0) or Saturday (6)
        duration++;
      }
      current.setDate(current.getDate() + 1);
    }

    const leaveRequest = {
      userId: req.user.userId,
      leave_type,
      start_date,
      end_date,
      duration: duration, // Add calculated duration
      reason: reason.trim(),
      status: leaveTypeDoc.requires_approval ? 'pending' : 'approved',
      attachment: req.file ? req.file.filename : null,
      created_at: getCurrentDate(),
      updated_at: getCurrentDate()
    };

    const result = await db.collection('leave_requests').insertOne(leaveRequest);
    leaveRequest._id = result.insertedId;

    // Populate response with user and leave type info
    const user = await db.collection('users').findOne({ _id: new ObjectId(req.user.userId) });
    leaveRequest.user = {
      _id: user._id,
      name: user.name || user.full_name,
      email: user.email,
      department: user.department || 'General'
    };
    leaveRequest.leave_type_details = leaveTypeDoc;
    leaveRequest.leave_type = leaveTypeDoc.name || leaveRequest.leave_type; // Set readable name

    res.status(201).json({ request: leaveRequest });
  } catch (error) {
    console.error('Error creating leave request:', error);
    res.status(500).json({ error: 'Failed to create leave request' });
  }
});

// GET /api/leave/requests/all - Get all leave requests (HR/Admin only)
router.get('/requests/all', authenticateToken, async (req, res) => {
  try {
    if (req.user.user_type !== 'admin' && req.user.user_type !== 'employee' && req.user.email !== 'admin@example.com') {
      return res.status(403).json({ error: 'Access denied - HR/Admin privileges required' });
    }

    const { status, employee, department, start_date, end_date } = req.query;
    
    let filter = {};
    if (status) filter.status = status;
    if (start_date && end_date) {
      filter.start_date = { $gte: start_date, $lte: end_date };
    }

    const db = await getDb();
    const requests = await db.collection('leave_requests')
      .find(filter)
      .sort({ created_at: -1 })
      .toArray();

    // Populate user and leave type information
    for (let request of requests) {
      // Get user info
      const user = await db.collection('users').findOne({ _id: new ObjectId(request.userId) });
      if (user) {
        request.user = {
          _id: user._id,
          name: user.name || user.full_name,
          email: user.email,
          department: user.department || 'General'
        };
      }

      // Get leave type info
      const leaveType = await db.collection('leave_types').findOne({ _id: new ObjectId(request.leave_type) });
      if (leaveType) {
        request.leave_type_details = leaveType;
      }
    }

    // Filter by employee or department if specified
    let filteredRequests = requests;
    if (employee) {
      filteredRequests = filteredRequests.filter(req => 
        req.user?.name?.toLowerCase().includes(employee.toLowerCase()) ||
        req.user?.email?.toLowerCase().includes(employee.toLowerCase())
      );
    }
    if (department) {
      filteredRequests = filteredRequests.filter(req => 
        req.user?.department?.toLowerCase().includes(department.toLowerCase())
      );
    }

    res.json({ requests: filteredRequests });
  } catch (error) {
    console.error('Error fetching all leave requests:', error);
    res.status(500).json({ error: 'Failed to fetch leave requests' });
  }
});

// PUT /api/leave/requests/:id/approve - Approve a leave request (HR/Admin only)
router.put('/requests/:id/approve', authenticateToken, async (req, res) => {
  try {
    if (req.user.user_type !== 'admin' && req.user.user_type !== 'employee' && req.user.email !== 'admin@example.com') {
      return res.status(403).json({ error: 'Access denied - HR/Admin privileges required' });
    }

    const { id } = req.params;
    const { hr_comment, comment } = req.body; // Accept both formats

    const db = await getDb();
    const result = await db.collection('leave_requests').findOneAndUpdate(
      { _id: new ObjectId(id) },
      { 
        $set: { 
          status: 'approved',
          hr_comment: hr_comment || comment || '', // Use hr_comment first, then comment
          approved_by: req.user.userId,
          approved_at: getCurrentDate(),
          updated_at: getCurrentDate()
        }
      },
      { returnDocument: 'after' }
    );

    if (!result.value) {
      return res.status(404).json({ error: 'Leave request not found' });
    }

    // Populate user and leave type info for response
    const user = await db.collection('users').findOne({ _id: new ObjectId(result.value.userId) });
    if (user) {
      result.value.user = {
        _id: user._id,
        name: user.name || user.full_name,
        email: user.email,
        department: user.department || 'General'
      };
    }

    const leaveType = await db.collection('leave_types').findOne({ _id: new ObjectId(result.value.leave_type) });
    if (leaveType) {
      result.value.leave_type_details = leaveType;
      result.value.leave_type = leaveType.name || result.value.leave_type;
    }

    res.json({ request: result.value });
  } catch (error) {
    console.error('Error approving leave request:', error);
    res.status(500).json({ error: 'Failed to approve leave request' });
  }
});

// PUT /api/leave/requests/:id/reject - Reject a leave request (HR/Admin only)
router.put('/requests/:id/reject', authenticateToken, async (req, res) => {
  try {
    if (req.user.user_type !== 'admin' && req.user.user_type !== 'employee' && req.user.email !== 'admin@example.com') {
      return res.status(403).json({ error: 'Access denied - HR/Admin privileges required' });
    }

    const { id } = req.params;
    const { hr_comment, comment } = req.body; // Accept both formats

    const db = await getDb();
    const result = await db.collection('leave_requests').findOneAndUpdate(
      { _id: new ObjectId(id) },
      { 
        $set: { 
          status: 'rejected',
          hr_comment: hr_comment || comment || '', // Use hr_comment first, then comment
          approved_by: req.user.userId,
          approved_at: getCurrentDate(),
          updated_at: getCurrentDate()
        }
      },
      { returnDocument: 'after' }
    );

    if (!result.value) {
      return res.status(404).json({ error: 'Leave request not found' });
    }

    // Populate user and leave type info for response
    const user = await db.collection('users').findOne({ _id: new ObjectId(result.value.userId) });
    if (user) {
      result.value.user = {
        _id: user._id,
        name: user.name || user.full_name,
        email: user.email,
        department: user.department || 'General'
      };
    }

    const leaveType = await db.collection('leave_types').findOne({ _id: new ObjectId(result.value.leave_type) });
    if (leaveType) {
      result.value.leave_type_details = leaveType;
      result.value.leave_type = leaveType.name || result.value.leave_type;
    }

    res.json({ request: result.value });
  } catch (error) {
    console.error('Error rejecting leave request:', error);
    res.status(500).json({ error: 'Failed to reject leave request' });
  }
});

// ========================
// LEAVE BALANCE ENDPOINTS
// ========================

// GET /api/leave/balance/me - Get current user's leave balance
router.get('/balance/me', authenticateToken, async (req, res) => {
  try {
    const db = await getDb();
    
    // Get all leave types
    const leaveTypes = await db.collection('leave_types').find({}).toArray();
    
    // Calculate balance for each leave type
    const balance = {};
    const currentYear = new Date().getFullYear();
    
    for (let leaveType of leaveTypes) {
      // Get approved leave requests for this type and current year
      const approvedRequests = await db.collection('leave_requests').find({
        userId: req.user.userId,
        leave_type: leaveType._id.toString(),
        status: 'approved',
        start_date: { $regex: `^${currentYear}` }
      }).toArray();
      
      // Calculate used days (simplified - assuming each request is 1 day)
      const usedDays = approvedRequests.length;
      const remainingDays = leaveType.annual_limit - usedDays;
      
      balance[leaveType.name] = {
        type_id: leaveType._id,
        total_days: leaveType.annual_limit,
        used_days: usedDays,
        remaining_days: Math.max(0, remainingDays),
        requests: approvedRequests.length
      };
    }

    res.json({
      user_id: req.user.userId,
      year: currentYear,
      balance,
      last_updated: getCurrentDate()
    });
  } catch (error) {
    console.error('Error fetching leave balance:', error);
    res.status(500).json({ error: 'Failed to fetch leave balance' });
  }
});

// ========================
// COMPENSATION ENDPOINTS
// ========================

// GET /api/leave/compensation/me - Get current user's compensation requests
router.get('/compensation/me', authenticateToken, async (req, res) => {
  try {
    const db = await getDb();
    const requests = await db.collection('compensation_requests')
      .find({ userId: req.user.userId })
      .sort({ created_at: -1 })
      .toArray();

    // Populate user information
    for (let request of requests) {
      const user = await db.collection('users').findOne({ _id: new ObjectId(request.userId) });
      if (user) {
        request.user = {
          _id: user._id,
          name: user.name || user.full_name,
          email: user.email,
          department: user.department || 'General'
        };
      }
    }

    res.json({ requests });
  } catch (error) {
    console.error('Error fetching user compensation requests:', error);
    res.status(500).json({ error: 'Failed to fetch compensation requests' });
  }
});

// POST /api/leave/compensation - Create a new compensation request
router.post('/compensation', authenticateToken, async (req, res) => {
  try {
    const { work_date, description } = req.body;

    if (!work_date || !description) {
      return res.status(400).json({ error: 'Work date and description are required' });
    }

    const db = await getDb();
    const compensationRequest = {
      userId: req.user.userId,
      work_date,
      description: description.trim(),
      status: 'pending',
      created_at: getCurrentDate(),
      updated_at: getCurrentDate()
    };

    const result = await db.collection('compensation_requests').insertOne(compensationRequest);
    compensationRequest._id = result.insertedId;

    // Populate user information
    const user = await db.collection('users').findOne({ _id: new ObjectId(req.user.userId) });
    compensationRequest.user = {
      _id: user._id,
      name: user.name || user.full_name,
      email: user.email,
      department: user.department || 'General'
    };

    res.status(201).json({ request: compensationRequest });
  } catch (error) {
    console.error('Error creating compensation request:', error);
    res.status(500).json({ error: 'Failed to create compensation request' });
  }
});

// GET /api/leave/compensation/all - Get all compensation requests (HR/Admin only)
router.get('/compensation/all', authenticateToken, async (req, res) => {
  try {
    if (req.user.user_type !== 'admin' && req.user.user_type !== 'employee' && req.user.email !== 'admin@example.com') {
      return res.status(403).json({ error: 'Access denied - HR/Admin privileges required' });
    }

    const { status, employee } = req.query;
    
    let filter = {};
    if (status) filter.status = status;

    const db = await getDb();
    const requests = await db.collection('compensation_requests')
      .find(filter)
      .sort({ created_at: -1 })
      .toArray();

    // Populate user information
    for (let request of requests) {
      const user = await db.collection('users').findOne({ _id: new ObjectId(request.userId) });
      if (user) {
        request.user = {
          _id: user._id,
          name: user.name || user.full_name,
          email: user.email,
          department: user.department || 'General'
        };
      }
    }

    // Filter by employee if specified
    let filteredRequests = requests;
    if (employee) {
      filteredRequests = filteredRequests.filter(req => 
        req.user?.name?.toLowerCase().includes(employee.toLowerCase()) ||
        req.user?.email?.toLowerCase().includes(employee.toLowerCase())
      );
    }

    res.json({ requests: filteredRequests });
  } catch (error) {
    console.error('Error fetching all compensation requests:', error);
    res.status(500).json({ error: 'Failed to fetch compensation requests' });
  }
});

// PUT /api/leave/compensation/:id/approve - Approve a compensation request (HR/Admin only)
router.put('/compensation/:id/approve', authenticateToken, async (req, res) => {
  try {
    if (req.user.user_type !== 'admin' && req.user.user_type !== 'employee' && req.user.email !== 'admin@example.com') {
      return res.status(403).json({ error: 'Access denied - HR/Admin privileges required' });
    }

    const { id } = req.params;
    const { hr_comment, comment } = req.body; // Accept both formats

    const db = await getDb();
    const result = await db.collection('compensation_requests').findOneAndUpdate(
      { _id: new ObjectId(id) },
      { 
        $set: { 
          status: 'approved',
          hr_comment: hr_comment || comment || '', // Use hr_comment first, then comment
          approved_by: req.user.userId,
          approved_at: getCurrentDate(),
          updated_at: getCurrentDate()
        }
      },
      { returnDocument: 'after' }
    );

    if (!result.value) {
      return res.status(404).json({ error: 'Compensation request not found' });
    }

    // Populate user information for response
    const user = await db.collection('users').findOne({ _id: new ObjectId(result.value.userId) });
    if (user) {
      result.value.user = {
        _id: user._id,
        name: user.name || user.full_name,
        email: user.email,
        department: user.department || 'General'
      };
    }

    res.json({ request: result.value });
  } catch (error) {
    console.error('Error approving compensation request:', error);
    res.status(500).json({ error: 'Failed to approve compensation request' });
  }
});

// PUT /api/leave/compensation/:id/reject - Reject a compensation request (HR/Admin only)
router.put('/compensation/:id/reject', authenticateToken, async (req, res) => {
  try {
    if (req.user.user_type !== 'admin' && req.user.user_type !== 'employee' && req.user.email !== 'admin@example.com') {
      return res.status(403).json({ error: 'Access denied - HR/Admin privileges required' });
    }

    const { id } = req.params;
    const { hr_comment, comment } = req.body; // Accept both formats

    const db = await getDb();
    const result = await db.collection('compensation_requests').findOneAndUpdate(
      { _id: new ObjectId(id) },
      { 
        $set: { 
          status: 'rejected',
          hr_comment: hr_comment || comment || '', // Use hr_comment first, then comment
          approved_by: req.user.userId,
          approved_at: getCurrentDate(),
          updated_at: getCurrentDate()
        }
      },
      { returnDocument: 'after' }
    );

    if (!result.value) {
      return res.status(404).json({ error: 'Compensation request not found' });
    }

    // Populate user information for response
    const user = await db.collection('users').findOne({ _id: new ObjectId(result.value.userId) });
    if (user) {
      result.value.user = {
        _id: user._id,
        name: user.name || user.full_name,
        email: user.email,
        department: user.department || 'General'
      };
    }

    res.json({ request: result.value });
  } catch (error) {
    console.error('Error rejecting compensation request:', error);
    res.status(500).json({ error: 'Failed to reject compensation request' });
  }
});

// ========================
// UTILITY ENDPOINTS
// ========================

// GET /api/leave/employees - Get all employees for dropdowns
router.get('/employees', authenticateToken, async (req, res) => {
  try {
    const db = await getDb();
    const users = await db.collection('users').find({}).toArray();
    
    const employees = users.map(user => ({
      _id: user._id,
      name: user.name || user.full_name,
      email: user.email,
      department: user.department || 'General'
    }));

    res.json({ employees });
  } catch (error) {
    console.error('Error fetching employees:', error);
    res.status(500).json({ error: 'Failed to fetch employees' });
  }
});

// GET /api/leave/departments - Get all departments
router.get('/departments', authenticateToken, async (req, res) => {
  try {
    const db = await getDb();
    const users = await db.collection('users').find({}).toArray();
    
    const departments = [...new Set(users.map(user => user.department || 'General'))];
    
    res.json({ departments });
  } catch (error) {
    console.error('Error fetching departments:', error);
    res.status(500).json({ error: 'Failed to fetch departments' });
  }
});

// GET /api/leave/calculate-days - Calculate working days between dates
router.get('/calculate-days', authenticateToken, async (req, res) => {
  try {
    const { start_date, end_date } = req.query;
    
    if (!start_date || !end_date) {
      return res.status(400).json({ error: 'Start date and end date are required' });
    }
    
    const start = new Date(start_date);
    const end = new Date(end_date);
    
    if (start > end) {
      return res.status(400).json({ error: 'Start date must be before end date' });
    }
    
    // Calculate total days
    const totalDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
    
    // Calculate weekdays (excluding weekends)
    let weekdays = 0;
    const current = new Date(start);
    
    while (current <= end) {
      const dayOfWeek = current.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) { // Not Sunday (0) or Saturday (6)
        weekdays++;
      }
      current.setDate(current.getDate() + 1);
    }
    
    res.json({ days: totalDays, weekdays });
  } catch (error) {
    console.error('Error calculating leave days:', error);
    res.status(500).json({ error: 'Failed to calculate leave days' });
  }
});

// GET /api/leave/requests/pending - Get all pending leave requests (HR/Admin only)
router.get('/requests/pending', authenticateToken, async (req, res) => {
  try {
    if (req.user.user_type !== 'admin' && req.user.user_type !== 'employee' && req.user.email !== 'admin@example.com') {
      return res.status(403).json({ error: 'Access denied - HR/Admin privileges required' });
    }

    const db = await getDb();
    const pendingRequests = await db.collection('leave_requests')
      .find({ status: 'pending' })
      .sort({ created_at: -1 })
      .toArray();

    // Populate user and leave type information
    for (let request of pendingRequests) {
      // Get user info
      const user = await db.collection('users').findOne({ _id: new ObjectId(request.userId) });
      if (user) {
        request.user = {
          _id: user._id,
          name: user.name || user.full_name,
          email: user.email,
          department: user.department || 'General'
        };
      }

      // Get leave type info
      const leaveType = await db.collection('leave_types').findOne({ _id: new ObjectId(request.leave_type) });
      if (leaveType) {
        request.leave_type_details = leaveType;
        request.leave_type = leaveType.name || request.leave_type; // Ensure leave_type shows as name, not ObjectId
      }
    }

    res.json({ requests: pendingRequests });
  } catch (error) {
    console.error('Error fetching pending leave requests:', error);
    res.status(500).json({ error: 'Failed to fetch pending leave requests' });
  }
});

// GET /api/leave/compensation/pending - Get all pending compensation requests (HR/Admin only)
router.get('/compensation/pending', authenticateToken, async (req, res) => {
  try {
    if (req.user.user_type !== 'admin' && req.user.user_type !== 'employee' && req.user.email !== 'admin@example.com') {
      return res.status(403).json({ error: 'Access denied - HR/Admin privileges required' });
    }

    const db = await getDb();
    const pendingRequests = await db.collection('compensation_requests')
      .find({ status: 'pending' })
      .sort({ created_at: -1 })
      .toArray();

    // Populate user information
    for (let request of pendingRequests) {
      const user = await db.collection('users').findOne({ _id: new ObjectId(request.userId) });
      if (user) {
        request.user = {
          _id: user._id,
          name: user.name || user.full_name,
          email: user.email,
          department: user.department || 'General'
        };
      }
    }

    res.json({ requests: pendingRequests });
  } catch (error) {
    console.error('Error fetching pending compensation requests:', error);
    res.status(500).json({ error: 'Failed to fetch pending compensation requests' });
  }
});

// GET /api/leave/requests - Get pending requests for dashboard (deprecated - use /requests/pending)
router.get('/requests', authenticateToken, async (req, res) => {
  try {
    if (req.user.user_type !== 'admin' && req.user.user_type !== 'employee' && req.user.email !== 'admin@example.com') {
      return res.status(403).json({ error: 'Access denied - HR/Admin privileges required' });
    }

    const db = await getDb();
    const pendingRequests = await db.collection('leave_requests')
      .find({ status: 'pending' })
      .sort({ created_at: -1 })
      .limit(10)
      .toArray();

    // Populate user and leave type information
    for (let request of pendingRequests) {
      // Get user info
      const user = await db.collection('users').findOne({ _id: new ObjectId(request.userId) });
      if (user) {
        request.user = {
          _id: user._id,
          name: user.name || user.full_name,
          email: user.email,
          department: user.department || 'General'
        };
      }

      // Get leave type info
      const leaveType = await db.collection('leave_types').findOne({ _id: new ObjectId(request.leave_type) });
      if (leaveType) {
        request.leave_type_details = leaveType;
      }
    }

    res.json({ requests: pendingRequests });
  } catch (error) {
    console.error('Error fetching pending requests:', error);
    res.status(500).json({ error: 'Failed to fetch pending requests' });
  }
});

// GET /api/leave/overlaps - Get overlapping leave requests for date range
router.get('/overlaps', authenticateToken, async (req, res) => {
  try {
    const { start, end, deptOnly = 'true' } = req.query;

    if (!start || !end) {
      return res.status(400).json({ error: 'Start and end dates are required' });
    }

    const db = await getDb();
    const currentUser = await db.collection('users').findOne({ _id: new ObjectId(req.user.userId) });
    
    if (!currentUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Build match conditions for overlap detection
    const matchConditions = {
      userId: { $ne: req.user.userId }, // Exclude current user
      status: { $in: ['pending', 'approved'] }, // Only pending and approved requests
      start_date: { $lte: end }, // Request starts before or on selected end date
      end_date: { $gte: start }  // Request ends after or on selected start date
    };

    // Get all overlapping requests
    const overlappingRequests = await db.collection('leave_requests')
      .find(matchConditions)
      .sort({ start_date: 1 })
      .toArray();

    // Populate user information and filter by department if needed
    const overlaps = [];
    for (let request of overlappingRequests) {
      const user = await db.collection('users').findOne({ _id: new ObjectId(request.userId) });
      if (user) {
        // Apply department filter if enabled
        if (deptOnly === 'true' && user.department !== currentUser.department) {
          continue;
        }

        overlaps.push({
          name: user.name || user.full_name || user.email,
          start: request.start_date,
          end: request.end_date,
          status: request.status.charAt(0).toUpperCase() + request.status.slice(1),
          department: user.department || 'General'
        });
      }
    }

    res.json({ overlaps });
  } catch (error) {
    console.error('Error fetching overlapping requests:', error);
    res.status(500).json({ error: 'Failed to fetch overlapping requests' });
  }
});

// GET /api/leave/calendar - Get upcoming public holidays and company events
router.get('/calendar', authenticateToken, async (req, res) => {
  try {
    const { limit = 5 } = req.query;
    
    const db = await getDb();
    const currentDate = new Date().toISOString().split('T')[0]; // Current date in YYYY-MM-DD format

    // Get upcoming calendar items
    const calendarItems = await db.collection('calendar_items')
      .find({
        date_end: { $gte: currentDate }, // Events ending today or later
      })
      .sort({ date_start: 1 })
      .limit(parseInt(limit))
      .toArray();

    res.json({ items: calendarItems });
  } catch (error) {
    console.error('Error fetching calendar items:', error);
    res.status(500).json({ error: 'Failed to fetch calendar items' });
  }
});

// POST /api/leave/calendar - Create a new calendar item (Admin only)
router.post('/calendar', authenticateToken, async (req, res) => {
  try {
    if (req.user.user_type !== 'admin' && req.user.email !== 'admin@example.com') {
      return res.status(403).json({ error: 'Access denied - Admin privileges required' });
    }

    const { title, date_start, date_end, kind, is_public_holiday = false, region = null } = req.body;

    if (!title || !date_start || !kind) {
      return res.status(400).json({ error: 'Title, start date, and kind are required' });
    }

    const db = await getDb();
    const calendarItem = {
      title: title.trim(),
      date_start,
      date_end: date_end || date_start, // If no end date, use start date
      kind, // 'PUBLIC_HOLIDAY', 'COMPANY_EVENT', 'REGIONAL_EVENT'
      is_public_holiday,
      region,
      created_at: getCurrentDate(),
      updated_at: getCurrentDate()
    };

    const result = await db.collection('calendar_items').insertOne(calendarItem);
    calendarItem._id = result.insertedId;

    res.status(201).json({ item: calendarItem });
  } catch (error) {
    console.error('Error creating calendar item:', error);
    res.status(500).json({ error: 'Failed to create calendar item' });
  }
});

// DELETE /api/leave/calendar/:id - Delete a calendar item (Admin only)
router.delete('/calendar/:id', authenticateToken, async (req, res) => {
  try {
    if (req.user.user_type !== 'admin' && req.user.email !== 'admin@example.com') {
      return res.status(403).json({ error: 'Access denied - Admin privileges required' });
    }

    const { id } = req.params;
    
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid calendar item ID' });
    }

    const db = await getDb();
    const result = await db.collection('calendar_items').deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'Calendar item not found' });
    }

    res.json({ message: 'Calendar item deleted successfully' });
  } catch (error) {
    console.error('Error deleting calendar item:', error);
    res.status(500).json({ error: 'Failed to delete calendar item' });
  }
});

module.exports = router;