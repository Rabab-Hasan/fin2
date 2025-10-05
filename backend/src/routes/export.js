const express = require('express');
const pool = require('../database');
const router = express.Router();

// GET /api/export/csv - Export all data as CSV
router.get('/csv', async (req, res) => {
  try {
    const client = await pool.connect();
    try {
      // Get all columns
      const columnsResult = await client.query(`
        SELECT key FROM columns_registry 
        ORDER BY display_order NULLS LAST, key
      `);
      const columns = columnsResult.rows.map(row => row.key);
      
      // Get all data
      const dataResult = await client.query(`
        SELECT report_date, month_label, data 
        FROM reports 
        ORDER BY report_date
      `);
      
      // Build CSV
      const headers = ['report_date', 'month_label', ...columns];
      let csvContent = headers.join(',') + '\n';
      
      for (const row of dataResult.rows) {
        const csvRow = [
          row.report_date,
          row.month_label || '',
          ...columns.map(col => {
            const value = row.data[col];
            return value !== undefined && value !== null ? value : '';
          })
        ];
        csvContent += csvRow.map(cell => `"${cell}"`).join(',') + '\n';
      }
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="finance_data_export.csv"');
      res.send(csvContent);
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Export CSV error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
