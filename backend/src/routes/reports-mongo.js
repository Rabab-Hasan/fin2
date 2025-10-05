const express = require('express');
const { v4: uuidv4 } = require('uuid');
const moment = require('moment');
const { getDb } = require('../database-mongo');

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

    const db = await getDb();
    
    // Check if record exists for this client
    const existing = await db.collection('reports').findOne({
      report_date,
      clientId
    });
    
    if (!existing) {
      // Insert new record
      const newReport = {
        id: uuidv4(),
        report_date,
        month_label,
        data: data || {},
        clientId,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      await db.collection('reports').insertOne(newReport);
      
      res.json({ 
        id: newReport.id, 
        report_date, 
        month_label, 
        data: data || {},
        action: 'inserted' 
      });
    } else {
      // Update existing record with data merge
      const existingData = existing.data || {};
      const mergedData = { ...existingData, ...(data || {}) };
      
      await db.collection('reports').updateOne(
        { _id: existing._id },
        { 
          $set: { 
            data: mergedData,
            month_label,
            updatedAt: new Date()
          }
        }
      );
      
      res.json({ 
        id: existing.id, 
        report_date, 
        month_label, 
        data: mergedData,
        action: 'updated' 
      });
    }
  } catch (error) {
    console.error('Error creating/updating report:', error);
    res.status(500).json({ error: 'Failed to create/update report' });
  }
});

// GET /api/reports/stats - Get dashboard statistics
router.get('/stats', async (req, res) => {
  try {
    const { clientId } = req.query;
    
    let filter = {};
    if (clientId) {
      filter.clientId = clientId;
    }

    const db = await getDb();
    const reportsCollection = db.collection('reports');

    // Get total records count
    const total_records = await reportsCollection.countDocuments(filter);
    
    // Get unique months for this client
    const monthsAggregation = [
      ...(clientId ? [{ $match: { clientId } }] : []),
      {
        $group: {
          _id: {
            $dateToString: {
              format: "%Y-%m",
              date: { $dateFromString: { dateString: "$report_date" } }
            }
          }
        }
      }
    ];
    
    const monthsData = await reportsCollection.aggregate(monthsAggregation).toArray();
    const months_tracked = monthsData.length;
    
    // Get reports with notes for this client
    const notesFilter = {
      ...filter,
      notes: { $exists: true, $ne: "", $ne: null }
    };
    const notes_count = await reportsCollection.countDocuments(notesFilter);

    res.json({
      total_records,
      months_tracked,
      notes_count
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// GET /api/reports - Get all reports with optional filtering
router.get('/', async (req, res) => {
  try {
    const { clientId, month, year, startDate, endDate } = req.query;
    
    let filter = {};
    
    if (clientId) {
      filter.clientId = clientId;
    }
    
    if (month && year) {
      const monthStart = moment(`${year}-${month.padStart(2, '0')}-01`);
      const monthEnd = monthStart.clone().endOf('month');
      filter.report_date = {
        $gte: monthStart.format('YYYY-MM-DD'),
        $lte: monthEnd.format('YYYY-MM-DD')
      };
    } else if (startDate && endDate) {
      filter.report_date = {
        $gte: startDate,
        $lte: endDate
      };
    }

    const db = await getDb();
    const reports = await db.collection('reports')
      .find(filter)
      .sort({ report_date: -1 })
      .toArray();

    // Flatten the data structure for frontend compatibility
    const flattenedReports = reports.map(report => ({
      id: report.id,
      report_date: report.report_date,
      month_label: report.month_label,
      clientId: report.clientId,
      notes: report.notes || '',
      created_at: report.createdAt,
      updated_at: report.updatedAt,
      // Flatten data fields to top level
      registered_onboarded: report.data?.registered_onboarded || 0,
      linked_accounts: report.data?.linked_accounts || 0,
      total_advance_applications: report.data?.total_advance_applications || 0,
      total_advance_applicants: report.data?.total_advance_applicants || 0,
      total_micro_financing_applications: report.data?.total_micro_financing_applications || 0,
      total_micro_financing_applicants: report.data?.total_micro_financing_applicants || 0,
      total_personal_finance_application: report.data?.total_personal_finance_application || 0,
      total_personal_finance_applicants: report.data?.total_personal_finance_applicants || 0,
      total_bnpl_applications: report.data?.total_bnpl_applications || 0,
      total_bnpl_applicants: report.data?.total_bnpl_applicants || 0
    }));

    res.json(flattenedReports);
  } catch (error) {
    console.error('Error fetching reports:', error);
    res.status(500).json({ error: 'Failed to fetch reports' });
  }
});

// GET /api/reports/:id - Get a specific report
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const db = await getDb();
    const report = await db.collection('reports').findOne({ id });

    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }

    res.json(report);
  } catch (error) {
    console.error('Error fetching report:', error);
    res.status(500).json({ error: 'Failed to fetch report' });
  }
});

// PUT /api/reports/:id - Update a specific report
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { report_date, month_label, data } = req.body;
    
    const updateData = {
      updatedAt: new Date()
    };
    
    if (report_date) {
      if (!moment(report_date, 'YYYY-MM-DD', true).isValid()) {
        return res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD' });
      }
      updateData.report_date = report_date;
    }
    
    if (month_label !== undefined) updateData.month_label = month_label;
    if (data !== undefined) updateData.data = data;

    const db = await getDb();
    const result = await db.collection('reports').updateOne(
      { id },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: 'Report not found' });
    }

    const updatedReport = await db.collection('reports').findOne({ id });

    res.json({ 
      message: 'Report updated successfully', 
      report: updatedReport 
    });
  } catch (error) {
    console.error('Error updating report:', error);
    res.status(500).json({ error: 'Failed to update report' });
  }
});

// DELETE /api/reports/:id - Delete a specific report
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const db = await getDb();
    const result = await db.collection('reports').deleteOne({ id });

    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'Report not found' });
    }

    res.json({ message: 'Report deleted successfully' });
  } catch (error) {
    console.error('Error deleting report:', error);
    res.status(500).json({ error: 'Failed to delete report' });
  }
});

// DELETE /api/reports - Delete all reports (with optional client filter)
router.delete('/', async (req, res) => {
  try {
    const { clientId } = req.query;
    
    let filter = {};
    if (clientId) {
      filter.clientId = clientId;
    }

    const db = await getDb();
    const result = await db.collection('reports').deleteMany(filter);

    res.json({ 
      message: `${result.deletedCount} reports deleted successfully`,
      deletedCount: result.deletedCount
    });
  } catch (error) {
    console.error('Error deleting reports:', error);
    res.status(500).json({ error: 'Failed to delete reports' });
  }
});

// GET /api/reports/stats/summary - Get summary statistics
router.get('/stats/summary', async (req, res) => {
  try {
    const { clientId } = req.query;
    
    let matchFilter = {};
    if (clientId) {
      matchFilter.clientId = clientId;
    }

    const db = await getDb();
    
    const pipeline = [
      { $match: matchFilter },
      {
        $group: {
          _id: null,
          totalReports: { $sum: 1 },
          latestDate: { $max: "$report_date" },
          earliestDate: { $min: "$report_date" },
          uniqueClients: { $addToSet: "$clientId" }
        }
      },
      {
        $project: {
          _id: 0,
          totalReports: 1,
          latestDate: 1,
          earliestDate: 1,
          uniqueClientsCount: { $size: "$uniqueClients" }
        }
      }
    ];

    const stats = await db.collection('reports').aggregate(pipeline).toArray();
    
    res.json(stats[0] || {
      totalReports: 0,
      latestDate: null,
      earliestDate: null,
      uniqueClientsCount: 0
    });
  } catch (error) {
    console.error('Error fetching report stats:', error);
    res.status(500).json({ error: 'Failed to fetch report statistics' });
  }
});

module.exports = router;