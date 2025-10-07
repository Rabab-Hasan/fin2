const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Database } = require('sqlite3').verbose();
const path = require('path');

// Import encryption utilities
const encryption = require('../utils/encryption');
const databaseEncryption = require('../middleware/database-encryption');
const { decryptRequest, decryptFormData, logAuthentication, createRateLimiter } = require('../middleware/security');

// Rate limiter for auth endpoints
const authRateLimit = createRateLimiter(15 * 60 * 1000, 5); // 5 attempts per 15 minutes

const router = express.Router();

// JWT secret (in production, use environment variable)
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-here';

// Database path
const dbPath = path.join(__dirname, '../../data/finance_dashboard.db');

// Helper function to get database connection
const getDb = () => {
  return new Database(dbPath);
};

// Helper function to run async queries
const dbRun = (db, sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) reject(err);
      else resolve({ id: this.lastID, changes: this.changes });
    });
  });
};

const dbGet = (db, sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
};

const dbAll = (db, sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
};

// Middleware to verify JWT token
const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    console.error('Token verification error:', error);
    return res.status(401).json({ error: 'Invalid token' });
  }
};

// POST /api/auth/login - User login
router.post('/login', 
  authRateLimit,
  logAuthentication,
  async (req, res) => {
  const db = getDb();
  
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Find user by encrypted email (try both encrypted and plain for migration)
    let user = await dbGet(db, 'SELECT * FROM users WHERE email = ?', [email.toLowerCase()]);
    
    // If not found with plain email, try searching for encrypted emails
    if (!user) {
      const encryptedEmail = encryption.encryptDatabaseField(email.toLowerCase());
      user = await dbGet(db, 'SELECT * FROM users WHERE email = ?', [encryptedEmail]);
    }
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Decrypt user data
    const decryptedUser = databaseEncryption.decryptFromSQLite('users', user);

    // Verify password using encryption service
    const isValidPassword = await databaseEncryption.verifyPassword(password, user.password);

    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Debug logging for user data (use hashed values for security)
    console.log('🔍 User login data:', {
      email: encryption.hashIdentifier(decryptedUser.email),
      user_type: decryptedUser.user_type,
      association: decryptedUser.association,
      hasUserType: decryptedUser.hasOwnProperty('user_type')
    });

    // Generate JWT token with decrypted user data
    const token = jwt.sign(
      { 
        userId: decryptedUser.id,
        email: decryptedUser.email,
        name: decryptedUser.name,
        user_type: decryptedUser.user_type || 'employee',
        association: decryptedUser.association || null
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Remove password from user object before sending response (use decrypted data)
    const userWithoutPassword = {
      _id: decryptedUser.id, // Keep _id for compatibility
      id: decryptedUser.id,
      email: decryptedUser.email,
      name: decryptedUser.name,
      user_type: decryptedUser.user_type || 'employee',
      association: decryptedUser.association,
      createdAt: decryptedUser.created_at,
      updatedAt: decryptedUser.updated_at
    };

    res.json({
      token,
      user: userWithoutPassword
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    db.close();
  }
});

// POST /api/auth/register - User registration
router.post('/register',
  authRateLimit,
  logAuthentication,
  async (req, res) => {
  const db = getDb();
  
  try {
    const { email, password, name } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Check if user already exists
    const existingUser = await dbGet(db, 'SELECT id FROM users WHERE email = ?', [email.toLowerCase()]);
    
    if (existingUser) {
      return res.status(409).json({ error: 'User already exists' });
    }

    // Hash password using encryption service
    const hashedPassword = await databaseEncryption.encryptPassword(password);

    // Encrypt sensitive user data
    const userData = {
      email: email.toLowerCase(),
      password: hashedPassword,
      name: name || email.split('@')[0],
      user_type: 'employee',
      association: null
    };
    
    const encryptedUserData = databaseEncryption.encryptForSQLite('users', userData);

    // Create new user with encrypted data
    const result = await dbRun(db, `
      INSERT INTO users (email, password, name, user_type, association)
      VALUES (?, ?, ?, ?, ?)
    `, [
      encryptedUserData.email,
      encryptedUserData.password,
      encryptedUserData.name,
      encryptedUserData.user_type,
      encryptedUserData.association
    ]);

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: result.id,
        email: email.toLowerCase(),
        name: name || email.split('@')[0],
        user_type: 'employee',
        association: null
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Get the created user and decrypt sensitive data
    const newUser = await dbGet(db, 'SELECT * FROM users WHERE id = ?', [result.id]);
    const decryptedUser = databaseEncryption.decryptFromSQLite('users', newUser);
    
    const userWithoutPassword = {
      _id: decryptedUser.id,
      id: decryptedUser.id,
      email: decryptedUser.email,
      name: decryptedUser.name,
      user_type: decryptedUser.user_type,
      association: decryptedUser.association,
      createdAt: decryptedUser.created_at,
      updatedAt: newUser.updated_at
    };

    res.status(201).json({
      token,
      user: userWithoutPassword
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    db.close();
  }
});

// GET /api/auth/me - Get current user
router.get('/me', verifyToken, async (req, res) => {
  const db = getDb();
  
  try {
    const user = await dbGet(db, 'SELECT * FROM users WHERE id = ?', [req.user.userId]);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userWithoutPassword = {
      _id: user.id,
      id: user.id,
      email: user.email,
      name: user.name,
      user_type: user.user_type,
      association: user.association,
      createdAt: user.created_at,
      updatedAt: user.updated_at
    };

    res.json({ user: userWithoutPassword });

  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    db.close();
  }
});

// PUT /api/auth/users/:userId/association - Update user association
router.put('/users/:userId/association', verifyToken, async (req, res) => {
  const db = getDb();
  
  try {
    const { userId } = req.params;
    const { association, user_type } = req.body;

    // Check if requesting user has permission to update associations
    if (req.user.user_type !== 'admin' && 
        req.user.user_type !== 'employee' && 
        req.user.user_type !== undefined) {
      console.log('🔍 Access denied for user:', {
        user_type: req.user.user_type
      });
      
      return res.status(403).json({ 
        error: 'Access denied. Only admins and employees can update user associations.',
        user_type: req.user.user_type
      });
    }

    // Update user association and user_type
    await dbRun(db, `
      UPDATE users 
      SET association = ?, user_type = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [association || null, user_type || 'client', userId]);

    // Get updated user
    const updatedUser = await dbGet(db, 'SELECT * FROM users WHERE id = ?', [userId]);
    
    if (!updatedUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userWithoutPassword = {
      _id: updatedUser.id,
      id: updatedUser.id,
      email: updatedUser.email,
      name: updatedUser.name,
      user_type: updatedUser.user_type,
      association: updatedUser.association,
      createdAt: updatedUser.created_at,
      updatedAt: updatedUser.updated_at
    };

    res.json({
      message: 'User association updated successfully',
      user: userWithoutPassword
    });

  } catch (error) {
    console.error('Update association error:', error);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    db.close();
  }
});

// GET /api/auth/check-access - Check user access
router.get('/check-access', verifyToken, async (req, res) => {
  const db = getDb();
  
  try {
    const { user_type, association } = req.user;

    console.log('🔍 AuthRoute: Checking access for user:', {
      user_type: user_type,
      association: association
    });

    res.json({
      hasAccess: true,
      type: user_type || 'unknown',
      user_type: user_type,
      association: association,
      message: 'Access granted'
    });

  } catch (error) {
    console.error('Check access error:', error);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    db.close();
  }
});

// GET /api/auth/users - Get all users (admin only)
router.get('/users', verifyToken, async (req, res) => {
  const db = getDb();
  
  try {
    // Check if user has permission to view all users
    if (req.user.user_type !== 'admin' && req.user.user_type !== 'employee') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const users = await dbAll(db, 'SELECT * FROM users ORDER BY created_at DESC');
    
    // Remove passwords from all users
    const usersWithoutPasswords = users.map(user => ({
      _id: user.id,
      id: user.id,
      email: user.email,
      name: user.name,
      user_type: user.user_type,
      association: user.association,
      createdAt: user.created_at,
      updatedAt: user.updated_at
    }));

    res.json(usersWithoutPasswords);

  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    db.close();
  }
});

// DELETE /api/auth/users/:userId - Delete user (admin only)
router.delete('/users/:userId', verifyToken, async (req, res) => {
  const db = getDb();
  
  try {
    const { userId } = req.params;

    // Check if user has permission to delete users
    if (req.user.user_type !== 'admin') {
      return res.status(403).json({ error: 'Access denied. Only admins can delete users.' });
    }

    // Prevent admin from deleting themselves
    if (req.user.userId == userId) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }

    const result = await dbRun(db, 'DELETE FROM users WHERE id = ?', [userId]);
    
    if (result.changes === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ message: 'User deleted successfully' });

  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    db.close();
  }
});

// POST /api/auth/users - Create new user (admin only)
router.post('/users', verifyToken, async (req, res) => {
  const db = getDb();
  
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

    // Check if user already exists
    const existingUser = await dbGet(db, 'SELECT id FROM users WHERE email = ?', [email.toLowerCase()]);
    
    if (existingUser) {
      return res.status(409).json({ error: 'User with this email already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user
    const result = await dbRun(db, `
      INSERT INTO users (email, password, name, user_type, association)
      VALUES (?, ?, ?, ?, ?)
    `, [
      email.toLowerCase(),
      hashedPassword,
      name || email.split('@')[0],
      userType,
      association || null
    ]);

    // Get the created user (without password)
    const newUser = await dbGet(db, 'SELECT * FROM users WHERE id = ?', [result.id]);
    const userWithoutPassword = {
      _id: newUser.id,
      id: newUser.id,
      email: newUser.email,
      name: newUser.name,
      user_type: newUser.user_type,
      association: newUser.association,
      createdAt: newUser.created_at,
      updatedAt: newUser.updated_at
    };

    res.status(201).json({
      message: 'User created successfully',
      user: userWithoutPassword,
      credentials: {
        email: newUser.email,
        password: password // Return the plain password for admin to share
      }
    });

  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    db.close();
  }
});

module.exports = router;