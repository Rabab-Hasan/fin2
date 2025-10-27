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

// Default system roles
const DEFAULT_ROLES = [
  {
    id: 'admin',
    name: 'Administrator',
    description: 'Full system access to all pages',
    pages: ['dashboard', 'business', 'chat', 'settings', 'campaign-setup', 'marketing-analysis', 'project-overview', 'labs', 'access', 'leave'],
    isSystem: true,
    color: 'bg-red-100 text-red-800',
    created_at: getCurrentDate(),
    updated_at: getCurrentDate()
  },
  {
    id: 'manager',
    name: 'Manager',
    description: 'Access to business operations and team chat',
    pages: ['dashboard', 'business', 'chat', 'campaign-setup', 'marketing-analysis', 'project-overview', 'leave'],
    isSystem: true,
    color: 'bg-blue-100 text-blue-800',
    created_at: getCurrentDate(),
    updated_at: getCurrentDate()
  },
  {
    id: 'employee',
    name: 'Employee',
    description: 'Standard employee access',
    pages: ['dashboard', 'business', 'chat', 'project-overview', 'leave'],
    isSystem: true,
    color: 'bg-green-100 text-green-800',
    created_at: getCurrentDate(),
    updated_at: getCurrentDate()
  },
  {
    id: 'client',
    name: 'Client',
    description: 'Limited client access to reports only',
    pages: ['dashboard', 'business'],
    isSystem: true,
    color: 'bg-purple-100 text-purple-800',
    created_at: getCurrentDate(),
    updated_at: getCurrentDate()
  }
];

// Initialize default roles if collection is empty
const initializeDefaultRoles = async () => {
  try {
    const db = await getDb();
    if (!db) {
      console.log('⚠️ Database not ready, skipping roles initialization');
      return;
    }
    
    const rolesCollection = db.collection('user_roles');
    const existingRoles = await rolesCollection.countDocuments();
    
    if (existingRoles === 0) {
      await rolesCollection.insertMany(DEFAULT_ROLES);
      console.log('✅ Default user roles initialized');
    }
  } catch (error) {
    console.error('❌ Error initializing default roles:', error);
  }
};



// GET /api/roles - Get all roles
router.get('/', authenticateToken, async (req, res) => {
  try {
    // Only admin users can access roles
    if (req.user.user_type !== 'admin' && req.user.email !== 'admin@example.com') {
      return res.status(403).json({ error: 'Access denied - Admin privileges required' });
    }

    const db = await getDb();
    const roles = await db.collection('user_roles').find({}).sort({ created_at: 1 }).toArray();
    
    res.json({ roles });
  } catch (error) {
    console.error('Error fetching roles:', error);
    res.status(500).json({ error: 'Failed to fetch roles' });
  }
});

// POST /api/roles - Create a new role (Admin only)
router.post('/', authenticateToken, async (req, res) => {
  try {
    if (req.user.user_type !== 'admin' && req.user.email !== 'admin@example.com') {
      return res.status(403).json({ error: 'Access denied - Admin privileges required' });
    }

    const { name, description, pages, color } = req.body;

    if (!name || !description) {
      return res.status(400).json({ error: 'Name and description are required' });
    }

    // Generate role ID from name
    const roleId = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

    const db = await getDb();
    
    // Check if role with this ID already exists
    const existingRole = await db.collection('user_roles').findOne({ id: roleId });
    if (existingRole) {
      return res.status(400).json({ error: 'A role with this name already exists' });
    }

    const role = {
      id: roleId,
      name: name.trim(),
      description: description.trim(),
      pages: pages || [],
      color: color || 'bg-gray-100 text-gray-800',
      isSystem: false,
      created_at: getCurrentDate(),
      updated_at: getCurrentDate()
    };

    const result = await db.collection('user_roles').insertOne(role);
    role._id = result.insertedId;

    console.log(`✅ Created new role: ${role.name}`);
    res.status(201).json({ role });
  } catch (error) {
    console.error('Error creating role:', error);
    res.status(500).json({ error: 'Failed to create role' });
  }
});

// PUT /api/roles/:id - Update a role (Admin only)
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    if (req.user.user_type !== 'admin' && req.user.email !== 'admin@example.com') {
      return res.status(403).json({ error: 'Access denied - Admin privileges required' });
    }

    const { id } = req.params;
    const { name, description, pages, color } = req.body;

    const db = await getDb();
    
    // Check if role exists and is not a system role
    const existingRole = await db.collection('user_roles').findOne({ id });
    if (!existingRole) {
      return res.status(404).json({ error: 'Role not found' });
    }
    
    if (existingRole.isSystem) {
      return res.status(400).json({ error: 'Cannot modify system roles' });
    }

    const updateData = {
      updated_at: getCurrentDate()
    };
    
    if (name) updateData.name = name.trim();
    if (description) updateData.description = description.trim();
    if (pages) updateData.pages = pages;
    if (color) updateData.color = color;

    const result = await db.collection('user_roles').findOneAndUpdate(
      { id },
      { $set: updateData },
      { returnDocument: 'after' }
    );

    if (!result.value) {
      return res.status(404).json({ error: 'Role not found' });
    }

    console.log(`✅ Updated role: ${result.value.name}`);
    res.json({ role: result.value });
  } catch (error) {
    console.error('Error updating role:', error);
    res.status(500).json({ error: 'Failed to update role' });
  }
});

// DELETE /api/roles/:id - Delete a role (Admin only)
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    if (req.user.user_type !== 'admin' && req.user.email !== 'admin@example.com') {
      return res.status(403).json({ error: 'Access denied - Admin privileges required' });
    }

    const { id } = req.params;
    const db = await getDb();
    
    // Check if role exists and is not a system role
    const existingRole = await db.collection('user_roles').findOne({ id });
    if (!existingRole) {
      return res.status(404).json({ error: 'Role not found' });
    }
    
    if (existingRole.isSystem) {
      return res.status(400).json({ error: 'Cannot delete system roles' });
    }

    const result = await db.collection('user_roles').deleteOne({ id });
    
    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'Role not found' });
    }

    console.log(`✅ Deleted role: ${id}`);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting role:', error);
    res.status(500).json({ error: 'Failed to delete role' });
  }
});

// GET /api/roles/:id - Get a specific role
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    if (req.user.user_type !== 'admin' && req.user.email !== 'admin@example.com') {
      return res.status(403).json({ error: 'Access denied - Admin privileges required' });
    }

    const { id } = req.params;
    const db = await getDb();
    
    const role = await db.collection('user_roles').findOne({ id });
    
    if (!role) {
      return res.status(404).json({ error: 'Role not found' });
    }

    res.json({ role });
  } catch (error) {
    console.error('Error fetching role:', error);
    res.status(500).json({ error: 'Failed to fetch role' });
  }
});

module.exports = router;
module.exports.initializeDefaultRoles = initializeDefaultRoles;