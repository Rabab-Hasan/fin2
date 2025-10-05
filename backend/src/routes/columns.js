const express = require('express');
const pool = require('../database');
const router = express.Router();

// GET /api/columns - Get all columns for table display
router.get('/', async (req, res) => {
  try {
    const client = await pool.connect();
    try {
      const result = await client.query(`
        SELECT key, label, display_order 
        FROM columns_registry 
        ORDER BY display_order NULLS LAST, key
      `);
      
      res.json(result.rows);
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Columns GET error:', error);
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/columns/:key - Update column properties
router.put('/:key', async (req, res) => {
  try {
    const { key } = req.params;
    const { label, display_order } = req.body;
    
    const client = await pool.connect();
    try {
      const result = await client.query(`
        UPDATE columns_registry 
        SET label = COALESCE($1, label), 
            display_order = COALESCE($2, display_order),
            last_seen_at = NOW()
        WHERE key = $3
        RETURNING *
      `, [label, display_order, key]);
      
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Column not found' });
      }
      
      res.json(result.rows[0]);
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Columns PUT error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
