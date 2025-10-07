const express = require('express');
const pool = require('../database');
const { v4: uuidv4 } = require('uuid');
const moment = require('moment');
const router = express.Router();

// POST /api/reports - Create or update a single report
router.post('/', async (req, res) => {
  try {
    const { report_date, month_label, data, clientId } = req.body;
    
    if (!report_date) {
      return res.status(400).json({ error: 'report_date is required' });
    }
    
    if (!clientId) {
      return res.status(400).json({ error: 'Client ID is required' });
    }
    
    // Validate date format
    if (!moment(report_date, 'YYYY-MM-DD', true).isValid()) {
      return res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD' });
    }
    
    const client = await pool.connect();
    try {
      // Check if record exists for this client
      const existing = await client.query(
        'SELECT id, data FROM reports WHERE report_date = $1 AND client_id = $2',
        [report_date, clientId]
      );
      
      if (existing.rows.length === 0) {
        // Insert new record
        const result = await client.query(`
          INSERT INTO reports (report_date, month_label, data, client_id, created_at, updated_at)
          VALUES ($1, $2, $3, $4, NOW(), NOW())
          RETURNING id
        `, [report_date, month_label, JSON.stringify(data || {}), clientId]);
        
        res.json({ 
          id: result.rows[0].id, 
          report_date, 
          month_label, 
          data: data || {},
          action: 'inserted' 
        });
      } else {
        // Update existing record with JSONB merge
        const existingData = existing.rows[0].data || {};
        const mergedData = { ...existingData, ...(data || {}) };
        
        await client.query(`
          UPDATE reports 
          SET data = $1, month_label = COALESCE($2, month_label), updated_at = NOW()
          WHERE report_date = $3
        `, [JSON.stringify(mergedData), month_label, report_date]);
        
        res.json({ 
          id: existing.rows[0].id, 
          report_date, 
          month_label, 
          data: mergedData,
          action: 'updated' 
        });
      }
      
      // Update columns registry for any new keys
      if (data) {
        for (const key of Object.keys(data)) {
          await client.query(`
            INSERT INTO columns_registry (key, label, first_seen_at, last_seen_at)
            VALUES ($1, $2, NOW(), NOW())
            ON CONFLICT (key) 
            DO UPDATE SET last_seen_at = NOW()
          `, [key, key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())]);
        }
      }
      
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Reports POST error:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/reports - Get all reports with optional filtering
router.get('/', async (req, res) => {
  try {
    const { month, limit = 1000, offset = 0, clientId } = req.query;
    
    if (!clientId) {
      return res.status(400).json({ error: 'Client ID is required' });
    }
    
    const client = await pool.connect();
    try {
      // For SQLite development mode, use simple column query
      let query = `SELECT 
        report_date, 
        month_label, 
        registered_onboarded,
        linked_accounts,
        total_advance_applications,
        total_advance_applicants,
        total_micro_financing_applications,
        total_micro_financing_applicants,
        total_personal_finance_application,
        total_personal_finance_applicants,
        total_bnpl_applications,
        total_bnpl_applicants,
        notes,
        created_at,
        updated_at
      FROM reports
      WHERE client_id = ?`;
      let params = [clientId];
      
      if (month) {
        const monthStart = `${month}-01`;
        const monthEnd = `${month}-31`;
        query += ` AND report_date >= ? AND report_date <= ?`;
        params.push(monthStart, monthEnd);
      }
      
      query += ` ORDER BY report_date DESC LIMIT ? OFFSET ?`;
      params.push(parseInt(limit), parseInt(offset));
      
      const result = await client.query(query, params);
      res.json(result.rows || result);
      return;
      
      /* PostgreSQL production mode (commented out - unreachable code)
      let pgQuery = 'SELECT report_date, month_label, data FROM reports WHERE client_id = $1';
      let pgParams = [clientId];
      let pgParamCount = 1;
      
      if (month) {
        const monthStart = moment(month, 'YYYY-MM').startOf('month').format('YYYY-MM-DD');
        const monthEnd = moment(month, 'YYYY-MM').endOf('month').format('YYYY-MM-DD');
        pgQuery += ` AND report_date >= $${++pgParamCount} AND report_date <= $${++pgParamCount}`;
        pgParams.push(monthStart, monthEnd);
      }
      
      pgQuery += ` ORDER BY report_date DESC LIMIT $${++pgParamCount} OFFSET $${++pgParamCount}`;
      pgParams.push(parseInt(limit), parseInt(offset));
      
      const pgResult = await client.query(pgQuery, pgParams);
      */
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Reports GET error:', error);
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/reports - Clear all data (admin only)
router.delete('/', async (req, res) => {
  try {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query('DELETE FROM reports');
      await client.query('DELETE FROM columns_registry');
      await client.query('COMMIT');
      
      res.json({ message: 'All data cleared successfully' });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Reports DELETE error:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/reports/stats - Get dashboard statistics
router.get('/stats', async (req, res) => {
  try {
    const { clientId } = req.query;
    
    if (!clientId) {
      return res.status(400).json({ error: 'Client ID is required' });
    }
    
    const client = await pool.connect();
    try {
      if (process.env.NODE_ENV !== 'production') {
        // SQLite development mode
        // Total records
        const totalResult = await client.query('SELECT COUNT(*) as count FROM reports WHERE client_id = ?', [clientId]);
        const total_records = parseInt(totalResult.rows[0]?.count || 0);
        
        // Months tracked
        const monthsResult = await client.query(`
          SELECT COUNT(DISTINCT strftime('%Y-%m', report_date)) as count 
          FROM reports
          WHERE client_id = ?
        `, [clientId]);
        const months_tracked = parseInt(monthsResult.rows[0]?.count || 0);
        
        // Notes count - check the notes column
        const notesResult = await client.query(`
          SELECT COUNT(*) as count 
          FROM reports 
          WHERE client_id = ? AND notes IS NOT NULL AND notes != ''
        `, [clientId]);
        const notes_count = parseInt(notesResult.rows[0]?.count || 0);
        
        res.json({
          total_records,
          months_tracked,
          notes_count
        });
        return;
      }
      
      // PostgreSQL production mode (original code)
      // Total records
      const totalResult = await client.query('SELECT COUNT(*) as count FROM reports');
      const total_records = parseInt(totalResult.rows[0].count);
      
      // Months tracked
      const monthsResult = await client.query(`
        SELECT COUNT(DISTINCT strftime('%Y-%m', report_date)) as count 
        FROM reports
      `);
      const months_tracked = parseInt(monthsResult.rows[0].count);
      
      // Notes count
      const notesResult = await client.query(`
        SELECT COUNT(*) as count 
        FROM reports 
        WHERE data->>'notes' IS NOT NULL AND data->>'notes' != ''
      `);
      const notes_count = parseInt(notesResult.rows[0].count);
      
      res.json({
        total_records,
        months_tracked,
        notes_count
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Reports stats error:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/reports/rollups - Get aggregated data by month
router.get('/rollups', async (req, res) => {
  try {
    const { group = 'month' } = req.query;
    
    if (group !== 'month') {
      return res.status(400).json({ error: 'Only month grouping is currently supported' });
    }
    
    const client = await pool.connect();
    try {
      const result = await client.query(`
        SELECT 
          EXTRACT(YEAR FROM report_date) || '-' || LPAD(EXTRACT(MONTH FROM report_date)::text, 2, '0') as month,
          COUNT(*) as record_count,
          SUM(COALESCE((data->>'total_advance_applicants')::numeric, 0) + 
              COALESCE((data->>'total_micro_financing_applicants')::numeric, 0) + 
              COALESCE((data->>'total_personal_finance_applicants')::numeric, 0)) as new_applicants,
          SUM(COALESCE((data->>'linked_accounts')::numeric, 0)) as linked_accounts
        FROM reports 
        GROUP BY EXTRACT(YEAR FROM report_date), EXTRACT(MONTH FROM report_date)
        ORDER BY month
      `);
      
      res.json(result.rows);
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Reports rollups error:', error);
    res.status(500).json({ error: error.message });
  }
});

// PATCH /api/reports/:date/notes - Update notes for a specific report
router.patch('/:date/notes', async (req, res) => {
  try {
    const { date } = req.params;
    const { notes } = req.body;
    
    if (!date) {
      return res.status(400).json({ error: 'Date parameter is required' });
    }
    
    // Validate date format
    if (!moment(date, 'YYYY-MM-DD', true).isValid()) {
      return res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD' });
    }
    
    const client = await pool.connect();
    try {
      // Update notes for the specific report
      const result = await client.query(
        'UPDATE reports SET notes = ?, updated_at = CURRENT_TIMESTAMP WHERE report_date = ?',
        [notes || '', date]
      );
      
      if (result.changes === 0) {
        return res.status(404).json({ error: 'Report not found for the specified date' });
      }
      
      res.json({ 
        message: 'Notes updated successfully',
        report_date: date,
        notes: notes || ''
      });
      
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Notes update error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
