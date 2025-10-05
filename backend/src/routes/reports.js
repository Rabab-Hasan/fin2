const express = require('express');
const pool = require('../database-sqlite');
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
      // Check if record exists for this client and date
      const existing = await client.query(
        'SELECT id, data FROM reports WHERE report_date = ? AND client_id = ?',
        [report_date, clientId]
      );
      
      if (existing.rows.length === 0) {
        // Insert new record
        const insertData = {
          report_date,
          month_label: month_label || '',
          client_id: clientId,
          data: JSON.stringify(data || {}),
          ...data
        };

        const insertSQL = `
          INSERT INTO reports (
            report_date, month_label, client_id, data,
            registered_onboarded, linked_accounts, total_advance_applications, total_advance_applicants,
            total_micro_financing_applications, total_micro_financing_applicants,
            total_personal_finance_application, total_personal_finance_applicants,
            total_bnpl_applications, total_bnpl_applicants,
            created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
        `;

        const values = [
          report_date,
          month_label || '',
          clientId,
          JSON.stringify(data || {}),
          data?.registered_onboarded || 0,
          data?.linked_accounts || 0,
          data?.total_advance_applications || 0,
          data?.total_advance_applicants || 0,
          data?.total_micro_financing_applications || 0,
          data?.total_micro_financing_applicants || 0,
          data?.total_personal_finance_application || 0,
          data?.total_personal_finance_applicants || 0,
          data?.total_bnpl_applications || 0,
          data?.total_bnpl_applicants || 0
        ];

        const result = await client.query(insertSQL, values);
        
        res.json({ 
          id: result.lastID, 
          report_date, 
          month_label, 
          data: data || {},
          action: 'inserted' 
        });
      } else {
        // Update existing record
        const existingData = JSON.parse(existing.rows[0].data || '{}');
        const mergedData = { ...existingData, ...(data || {}) };
        
        const updateSQL = `
          UPDATE reports 
          SET data = ?, month_label = COALESCE(?, month_label), 
              registered_onboarded = ?, linked_accounts = ?, 
              total_advance_applications = ?, total_advance_applicants = ?,
              total_micro_financing_applications = ?, total_micro_financing_applicants = ?,
              total_personal_finance_application = ?, total_personal_finance_applicants = ?,
              total_bnpl_applications = ?, total_bnpl_applicants = ?,
              updated_at = datetime('now')
          WHERE report_date = ? AND client_id = ?
        `;

        const values = [
          JSON.stringify(mergedData),
          month_label,
          mergedData.registered_onboarded || 0,
          mergedData.linked_accounts || 0,
          mergedData.total_advance_applications || 0,
          mergedData.total_advance_applicants || 0,
          mergedData.total_micro_financing_applications || 0,
          mergedData.total_micro_financing_applicants || 0,
          mergedData.total_personal_finance_application || 0,
          mergedData.total_personal_finance_applicants || 0,
          mergedData.total_bnpl_applications || 0,
          mergedData.total_bnpl_applicants || 0,
          report_date,
          clientId
        ];

        await client.query(updateSQL, values);
        
        res.json({ 
          id: existing.rows[0].id, 
          report_date, 
          month_label, 
          data: mergedData,
          action: 'updated' 
        });
      }
      
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Reports POST error:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/reports - Get all reports with client filtering
router.get('/', async (req, res) => {
  try {
    const { month, limit = 1000, offset = 0, clientId } = req.query;
    
    if (!clientId) {
      return res.status(400).json({ error: 'Client ID is required' });
    }
    
    const client = await pool.connect();
    try {
      let sqlQuery = `SELECT 
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
        data,
        created_at,
        updated_at
      FROM reports
      WHERE client_id = ?`;
      let queryParams = [clientId];
      
      if (month) {
        const monthStart = `${month}-01`;
        const monthEnd = `${month}-31`;
        sqlQuery += ` AND report_date >= ? AND report_date <= ?`;
        queryParams.push(monthStart, monthEnd);
      }
      
      sqlQuery += ` ORDER BY report_date DESC LIMIT ? OFFSET ?`;
      queryParams.push(parseInt(limit), parseInt(offset));
      
      const result = await client.query(sqlQuery, queryParams);
      res.json(result.rows || result);
      
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Reports GET error:', error);
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
      // Total records
      const totalResult = await client.query('SELECT COUNT(*) as count FROM reports WHERE client_id = ?', [clientId]);
      const total_records = parseInt(totalResult.rows?.[0]?.count || totalResult?.[0]?.count || 0);
      
      // Total applications 
      const appsResult = await client.query(`
        SELECT SUM(
          COALESCE(total_advance_applications, 0) + 
          COALESCE(total_micro_financing_applications, 0) + 
          COALESCE(total_personal_finance_application, 0) +
          COALESCE(total_bnpl_applications, 0)
        ) as total_apps
        FROM reports 
        WHERE client_id = ?
      `, [clientId]);
      const total_applications = parseInt(appsResult.rows?.[0]?.total_apps || appsResult?.[0]?.total_apps || 0);
      
      // Total applicants
      const applicantsResult = await client.query(`
        SELECT SUM(
          COALESCE(total_advance_applicants, 0) + 
          COALESCE(total_micro_financing_applicants, 0) + 
          COALESCE(total_personal_finance_applicants, 0) +
          COALESCE(total_bnpl_applicants, 0)
        ) as total_applicants
        FROM reports 
        WHERE client_id = ?
      `, [clientId]);
      const total_applicants = parseInt(applicantsResult.rows?.[0]?.total_applicants || applicantsResult?.[0]?.total_applicants || 0);
      
      // Days with data
      const daysResult = await client.query('SELECT COUNT(DISTINCT report_date) as days FROM reports WHERE client_id = ?', [clientId]);
      const days_with_data = parseInt(daysResult.rows?.[0]?.days || daysResult?.[0]?.days || 1);
      
      // Average per day
      const avg_per_day = days_with_data > 0 ? Math.round((total_applicants / days_with_data) * 100) / 100 : 0;
      
      res.json({
        total_records,
        total_applications, 
        total_applicants,
        avg_per_day
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Reports stats error:', error);
    res.status(500).json({ error: error.message });
  }
});

// PATCH /api/reports/:date/notes - Update notes for a specific report
router.patch('/:date/notes', async (req, res) => {
  try {
    const { date } = req.params;
    const { notes, clientId } = req.body;
    
    if (!date) {
      return res.status(400).json({ error: 'Date parameter is required' });
    }

    if (!clientId) {
      return res.status(400).json({ error: 'Client ID is required' });
    }
    
    // Validate date format
    if (!moment(date, 'YYYY-MM-DD', true).isValid()) {
      return res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD' });
    }
    
    const client = await pool.connect();
    try {
      // Update notes for the specific report
      const result = await client.query(
        'UPDATE reports SET notes = ?, updated_at = datetime("now") WHERE report_date = ? AND client_id = ?',
        [notes || '', date, clientId]
      );
      
      if (result.changes === 0) {
        return res.status(404).json({ error: 'Report not found for the specified date and client' });
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

// DELETE /api/reports - Clear all data (admin only)
router.delete('/', async (req, res) => {
  try {
    const client = await pool.connect();
    try {
      await client.query('BEGIN TRANSACTION');
      await client.query('DELETE FROM reports');
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

module.exports = router;