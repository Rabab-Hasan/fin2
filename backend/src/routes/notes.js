const express = require('express');
const router = express.Router();
const pool = require('../database');

// NOTE: POST and DELETE endpoints are commented out as they use old JSONB structure
// The frontend uses /api/reports/:date/notes for editing notes

/*
// Create a new note
router.post('/', async (req, res) => {
  // This endpoint uses old JSONB structure - disabled
  res.status(501).json({ error: 'Use /api/reports/:date/notes endpoint instead' });
});
*/

/*
// Delete a note
router.delete('/:id', async (req, res) => {
  // This endpoint uses old JSONB structure - disabled  
  res.status(501).json({ error: 'Use /api/reports/:date/notes endpoint instead' });
});
*/

// Get all notes
router.get('/', async (req, res) => {
  try {
    const client = await pool.connect();
    
    // Look for notes in the notes column (not in JSONB data)
    const result = await client.query(`
      SELECT 
        id,
        report_date,
        month_label,
        notes,
        created_at,
        updated_at
      FROM reports 
      WHERE notes IS NOT NULL 
        AND notes != ''
        AND notes != 'No notes'
      ORDER BY report_date DESC
    `);
    
    const notes = result.rows.map(row => ({
      id: row.id,
      date: row.report_date,
      month_label: row.month_label,
      title: `Note for ${row.report_date}`,
      content: row.notes,
      created_at: row.created_at || row.updated_at
    }));
    
    client.release();
    
    console.log(`Found ${notes.length} notes from notes column`);
    res.json({ notes });
    
  } catch (error) {
    console.error('Get notes error:', error);
    res.status(500).json({ error: error.message });
  }
});

/*
// Delete a note
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const client = await pool.connect();
    
    // Get the report
    const result = await client.query('SELECT data FROM reports WHERE id = $1', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Note not found' });
    }
    
    const data = result.rows[0].data || {};
    
    // Remove note fields
    delete data.notes;
    delete data.note_title;
    delete data.note_tags;
    delete data.note_type;
    delete data.created_at;
    
    // If no other data remains, delete the entire report
    if (Object.keys(data).length === 0) {
      await client.query('DELETE FROM reports WHERE id = $1', [id]);
      res.json({ success: true, message: 'Note and report deleted' });
    } else {
      // Update the report without note data
      await client.query(
        'UPDATE reports SET data = $1 WHERE id = $2',
        [JSON.stringify(data), id]
      );
      res.json({ success: true, message: 'Note removed from report' });
    }
    
    client.release();
    
  } catch (error) {
    console.error('Delete note error:', error);
    res.status(500).json({ error: error.message });
  }
});
*/

// Get notes for a specific day
router.get('/day/:date', async (req, res) => {
  try {
    const { date } = req.params;
    
    const client = await pool.connect();
    
    const result = await client.query(`
      SELECT 
        id,
        report_date,
        notes,
        created_at,
        updated_at
      FROM reports 
      WHERE report_date = $1 
        AND notes IS NOT NULL 
        AND notes != ''
        AND notes != 'No notes'
    `, [date]);
    
    if (result.rows.length === 0) {
      return res.json({ notes: [] });
    }
    
    const notes = result.rows.map(row => ({
      id: row.id,
      date: row.report_date,
      title: `Note for ${row.report_date}`,
      content: row.notes,
      created_at: row.created_at || row.updated_at
    }));
    
    client.release();
    
    res.json({ notes });
    
  } catch (error) {
    console.error('Get day notes error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
