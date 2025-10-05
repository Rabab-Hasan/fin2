const express = require('express');
const { v4: uuidv4 } = require('uuid');
const db = require('../database-sqlite');

const router = express.Router();

// GET /api/clients - Get all clients
router.get('/', async (req, res) => {
  try {
    const pool = await db.connect();
    const result = await pool.query('SELECT * FROM clients ORDER BY name ASC');
    pool.release();

    res.json({ clients: result.rows });
  } catch (error) {
    console.error('Error fetching clients:', error);
    res.status(500).json({ error: 'Failed to fetch clients' });
  }
});

// GET /api/clients/:id - Get a specific client
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const pool = await db.connect();
    const result = await pool.query('SELECT * FROM clients WHERE id = ?', [id]);
    pool.release();

    if (!result.rows || result.rows.length === 0) {
      return res.status(404).json({ error: 'Client not found' });
    }

    res.json({ client: result.rows[0] });
  } catch (error) {
    console.error('Error fetching client:', error);
    res.status(500).json({ error: 'Failed to fetch client' });
  }
});

// POST /api/clients - Create a new client
router.post('/', async (req, res) => {
  try {
    const { name, email, phone, company } = req.body;

    if (!name || name.trim() === '') {
      return res.status(400).json({ error: 'Client name is required' });
    }

    const clientId = uuidv4();
    const now = new Date().toISOString();

    const pool = await db.connect();
    await pool.query(
      `INSERT INTO clients (id, name, email, phone, company, created_at, updated_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        clientId,
        name.trim(),
        email?.trim() || null,
        phone?.trim() || null,
        company?.trim() || null,
        now,
        now
      ]
    );

    // Fetch the created client
    const result = await pool.query('SELECT * FROM clients WHERE id = ?', [clientId]);
    pool.release();

    if (!result.rows || result.rows.length === 0) {
      return res.status(500).json({ error: 'Failed to create client' });
    }

    res.status(201).json({ client: result.rows[0] });
  } catch (error) {
    console.error('Error creating client:', error);
    res.status(500).json({ error: 'Failed to create client' });
  }
});

// PUT /api/clients/:id - Update a client
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, phone, company } = req.body;

    const pool = await db.connect();
    
    // Check if client exists
    const existingResult = await pool.query('SELECT * FROM clients WHERE id = ?', [id]);
    if (!existingResult.rows || existingResult.rows.length === 0) {
      pool.release();
      return res.status(404).json({ error: 'Client not found' });
    }

    // Update the client
    await pool.query(
      `UPDATE clients SET 
        name = COALESCE(?, name),
        email = COALESCE(?, email),
        phone = COALESCE(?, phone),
        company = COALESCE(?, company),
        updated_at = datetime('now')
      WHERE id = ?`,
      [
        name?.trim() || null,
        email?.trim() || null,
        phone?.trim() || null,
        company?.trim() || null,
        id
      ]
    );

    // Fetch the updated client
    const updatedResult = await pool.query('SELECT * FROM clients WHERE id = ?', [id]);
    pool.release();

    if (!updatedResult.rows || updatedResult.rows.length === 0) {
      return res.status(500).json({ error: 'Failed to update client' });
    }

    res.json({ client: updatedResult.rows[0] });
  } catch (error) {
    console.error('Error updating client:', error);
    res.status(500).json({ error: 'Failed to update client' });
  }
});

// DELETE /api/clients/:id - Delete a client
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const pool = await db.connect();
    
    // Check if client exists
    const existingResult = await pool.query('SELECT * FROM clients WHERE id = ?', [id]);
    if (!existingResult.rows || existingResult.rows.length === 0) {
      pool.release();
      return res.status(404).json({ error: 'Client not found' });
    }

    // Check if client has associated tasks
    const tasksResult = await pool.query('SELECT COUNT(*) as count FROM tasks WHERE client_id = ?', [id]);
    const taskCount = tasksResult.rows[0]?.count || 0;

    if (taskCount > 0) {
      pool.release();
      return res.status(400).json({ 
        error: `Cannot delete client with ${taskCount} associated tasks. Please delete or reassign tasks first.` 
      });
    }

    // Delete the client
    const result = await pool.query('DELETE FROM clients WHERE id = ?', [id]);
    pool.release();

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Client not found' });
    }

    res.json({ message: 'Client deleted successfully' });
  } catch (error) {
    console.error('Error deleting client:', error);
    res.status(500).json({ error: 'Failed to delete client' });
  }
});

// GET /api/clients/:id/stats - Get statistics for a specific client
router.get('/:id/stats', async (req, res) => {
  try {
    const { id } = req.params;

    const pool = await db.connect();
    
    // Check if client exists
    const clientResult = await pool.query('SELECT * FROM clients WHERE id = ?', [id]);
    if (!clientResult.rows || clientResult.rows.length === 0) {
      pool.release();
      return res.status(404).json({ error: 'Client not found' });
    }

    // Get task statistics for the client
    const taskStatsResult = await pool.query(`
      SELECT 
        status,
        COUNT(*) as count
      FROM tasks 
      WHERE client_id = ? AND parent_id IS NULL
      GROUP BY status
    `, [id]);

    const totalTasksResult = await pool.query(`
      SELECT COUNT(*) as total 
      FROM tasks 
      WHERE client_id = ? AND parent_id IS NULL
    `, [id]);

    const overdueTasksResult = await pool.query(`
      SELECT COUNT(*) as overdue
      FROM tasks 
      WHERE client_id = ? 
      AND deadline < date('now') 
      AND status != 'completed'
      AND parent_id IS NULL
    `, [id]);

    pool.release();

    // Format statistics
    const statusCounts = {
      todo: 0,
      'in-progress': 0,
      pending: 0,
      completed: 0
    };

    if (taskStatsResult.rows) {
      taskStatsResult.rows.forEach(stat => {
        statusCounts[stat.status] = stat.count;
      });
    }

    res.json({
      client: clientResult.rows[0],
      stats: {
        statusCounts,
        totalTasks: totalTasksResult.rows?.[0]?.total || 0,
        overdueTasks: overdueTasksResult.rows?.[0]?.overdue || 0
      }
    });
  } catch (error) {
    console.error('Error fetching client stats:', error);
    res.status(500).json({ error: 'Failed to fetch client statistics' });
  }
});

module.exports = router;