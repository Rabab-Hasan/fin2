const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { ObjectId } = require('mongodb');
const { getDb } = require('../database-mongo');

const router = express.Router();

// JWT secret (in production, use environment variable)
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-here';

// POST /api/auth/login - User login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const db = await getDb();
    const usersCollection = db.collection('users');

    // Find user by email
    const user = await usersCollection.findOne({ email: email.toLowerCase() });
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check password
    let isValidPassword = false;
    
    // Get the password from either 'password' or 'password_hash' field
    const storedPassword = user.password || user.password_hash;
    
    if (!storedPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // If password is hashed, compare with bcrypt
    if (storedPassword.startsWith('$')) {
      isValidPassword = await bcrypt.compare(password, storedPassword);
    } else {
      // If password is plain text (not recommended for production)
      isValidPassword = password === storedPassword;
    }

    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Debug logging for user data
    console.log('🔍 User login data:', {
      email: user.email,
      user_type: user.user_type,
      association: user.association,
      hasUserType: user.hasOwnProperty('user_type')
    });

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user._id,
        email: user.email,
        name: user.name || user.username,
        user_type: user.user_type || 'employee',
        association: user.association || null
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    console.log('🔍 JWT token payload:', {
      userId: user._id,
      email: user.email,
      user_type: user.user_type || 'employee',
      association: user.association || null
    });

    // Return user info and token (exclude password)
    const { password: _, ...userWithoutPassword } = user;
    
    res.json({
      message: 'Login successful',
      token,
      user: userWithoutPassword
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/auth/register - User registration (optional)
router.post('/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const db = await getDb();
    const usersCollection = db.collection('users');

    // Check if user already exists
    const existingUser = await usersCollection.findOne({ email: email.toLowerCase() });
    
    if (existingUser) {
      return res.status(409).json({ error: 'User already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user
    const newUser = {
      email: email.toLowerCase(),
      password: hashedPassword,
      name: name || email.split('@')[0],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await usersCollection.insertOne(newUser);

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: result.insertedId,
        email: newUser.email,
        name: newUser.name,
        user_type: newUser.user_type || 'employee',
        association: newUser.association || null
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Return user info and token (exclude password)
    const { password: _, ...userWithoutPassword } = newUser;
    userWithoutPassword._id = result.insertedId;
    
    res.status(201).json({
      message: 'Registration successful',
      token,
      user: userWithoutPassword
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/auth/me - Get current user info
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const db = await getDb();
    const usersCollection = db.collection('users');

    const user = await usersCollection.findOne(
      { _id: new ObjectId(req.user.userId) },
      { projection: { password: 0 } } // Exclude password
    );

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user });

  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/auth/users - Get all users (for testing)
router.get('/users', async (req, res) => {
  try {
    const db = await getDb();
    const usersCollection = db.collection('users');

    const users = await usersCollection.find(
      {},
      { projection: { password: 0 } } // Exclude passwords
    ).toArray();

    res.json({ users, count: users.length });

  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/auth/users/:userId/association - Update user association
router.put('/users/:userId/association', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    const { association, user_type } = req.body;

    // Only admin and employee users can update associations
    // Super admin check - admin@example.com always has access
    if (req.user.email !== 'admin@example.com' && 
        req.user.user_type !== 'admin' && 
        req.user.user_type !== 'employee' && 
        req.user.user_type !== undefined) {
      console.log('🔒 Association update denied for user:', {
        email: req.user.email,
        user_type: req.user.user_type
      });
      return res.status(403).json({ error: 'Admin or Employee access required' });
    }

    console.log('✅ Association update permitted for user:', {
      email: req.user.email,
      user_type: req.user.user_type
    });

    const db = await getDb();
    const usersCollection = db.collection('users');

    // Update user association
    const result = await usersCollection.updateOne(
      { _id: new ObjectId(userId) },
      { 
        $set: { 
          association: association,
          user_type: user_type || 'client',
          updatedAt: new Date()
        }
      }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get updated user
    const updatedUser = await usersCollection.findOne(
      { _id: new ObjectId(userId) },
      { projection: { password: 0 } }
    );

    res.json({ 
      message: 'Association updated successfully',
      user: updatedUser
    });

  } catch (error) {
    console.error('Update association error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/auth/check-access - Check if user has access to a client
router.get('/check-access', authenticateToken, async (req, res) => {
  try {
    const { user_type, association } = req.user;

    // Debug logging
    console.log('🔍 Access check for user:', {
      userId: req.user.userId,
      email: req.user.email,
      user_type: user_type,
      association: association
    });

    // Super admin check - admin@example.com always has full access
    if (req.user.email === 'admin@example.com') {
      console.log('✅ Super admin detected (admin@example.com) - FULL ACCESS granted');
      return res.json({ 
        hasAccess: true, 
        type: 'admin',
        message: 'Super admin access granted'
      });
    }

    // ONLY client users can be restricted - all other user types have full access
    if (user_type !== 'client') {
      console.log('✅ Non-client user detected - FULL ACCESS granted (user_type:', user_type || 'undefined', ')');
      return res.json({ 
        hasAccess: true, 
        type: user_type || 'employee',
        message: `Full access granted for ${user_type || 'employee'} user`
      });
    }

    // Client users need association to access
    console.log('🔒 Client user - checking association');
    if (!association) {
      console.log('❌ Client user with no association - ACCESS DENIED');
      return res.json({ 
        hasAccess: false, 
        type: 'client',
        message: 'No client association found. Contact y.alsarraj@action-labs.co for access.'
      });
    }

    // Verify client exists in MongoDB clients collection
    try {
      const db = await getDb();
      const clientsCollection = db.collection('clients');
      
      // Check if client exists using the association as client ID
      // Don't try to convert to ObjectId if it's not a valid ObjectId format
      let query = {};
      
      if (association.match(/^[0-9a-fA-F]{24}$/)) {
        // Valid ObjectId format
        query = { 
          $or: [
            { _id: new ObjectId(association) },
            { id: association },
            { name: association }
          ]
        };
      } else {
        // UUID or other string format
        query = { 
          $or: [
            { id: association },
            { name: association }
          ]
        };
      }

      console.log('🔍 Searching for client with query:', query);
      const client = await clientsCollection.findOne(query);

      if (!client) {
        console.log('❌ Client user with invalid association - ACCESS DENIED. Association:', association);
        
        // Debug: show all available clients
        const allClients = await clientsCollection.find({}).toArray();
        console.log('🔍 Available clients:', allClients.map(c => ({ id: c.id, name: c.name, _id: c._id })));
        
        return res.json({ 
          hasAccess: false, 
          type: 'client',
          message: 'Associated client not found. Contact y.alsarraj@action-labs.co for access.'
        });
      }

      console.log('✅ Client user with valid association - ACCESS GRANTED. Client:', client.name || client._id);
      return res.json({ 
        hasAccess: true, 
        type: 'client',
        client: client
      });
      
    } catch (dbError) {
      console.error('❌ Database error during client lookup:', dbError);
      return res.json({ 
        hasAccess: false, 
        type: 'client',
        message: 'Database error during client verification. Contact y.alsarraj@action-labs.co for access.'
      });
    }

  } catch (error) {
    console.error('Check access error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Middleware to authenticate JWT token
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

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

// POST /api/auth/users - Create new user (admin only)
router.post('/users', authenticateToken, async (req, res) => {
  try {
    const { email, password, name, user_type, association } = req.body;

    // Check if user has permission to create users
    if (req.user.user_type !== 'admin') {
      return res.status(403).json({ error: 'Access denied. Only admins can create users.' });
    }

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Validate user_type
    const validUserTypes = ['admin', 'employee', 'client'];
    const userType = user_type || 'employee';
    if (!validUserTypes.includes(userType)) {
      return res.status(400).json({ error: 'Invalid user type. Must be admin, employee, or client.' });
    }

    const db = await getDb();
    const usersCollection = db.collection('users');

    // Check if user already exists
    const existingUser = await usersCollection.findOne({ email: email.toLowerCase() });
    
    if (existingUser) {
      return res.status(409).json({ error: 'User with this email already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user
    const newUser = {
      email: email.toLowerCase(),
      password: hashedPassword,
      name: name || email.split('@')[0],
      user_type: userType,
      association: association || null,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await usersCollection.insertOne(newUser);

    // Get the created user (without password)
    const createdUser = await usersCollection.findOne({ _id: result.insertedId });
    const userWithoutPassword = {
      _id: createdUser._id,
      email: createdUser.email,
      name: createdUser.name,
      user_type: createdUser.user_type,
      association: createdUser.association,
      createdAt: createdUser.createdAt,
      updatedAt: createdUser.updatedAt
    };

    res.status(201).json({
      message: 'User created successfully',
      user: userWithoutPassword,
      credentials: {
        email: createdUser.email,
        password: password // Return the plain password for admin to share
      }
    });

  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/auth/debug-clients - Debug endpoint to check client data
router.get('/debug-clients', authenticateToken, async (req, res) => {
  try {
    const db = await getDb();
    const clientsCollection = db.collection('clients');
    
    const clients = await clientsCollection.find({}).toArray();
    
    res.json({
      message: 'Debug - Client data',
      clientsCount: clients.length,
      clients: clients.map(c => ({
        _id: c._id,
        id: c.id,
        name: c.name,
        email: c.email
      })),
      userInfo: {
        userId: req.user.userId,
        email: req.user.email,
        user_type: req.user.user_type,
        association: req.user.association
      }
    });
  } catch (error) {
    console.error('Debug clients error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;