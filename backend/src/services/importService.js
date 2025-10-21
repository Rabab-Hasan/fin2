const fs = require('fs');
const path = require('path');

// Use MongoDB connection for consistency
const { getDb } = require('../database-mongo');

// Process imported data and save to database
const processImportData = async (data, clientId) => {
  if (!Array.isArray(data) || data.length === 0) {
    throw new Error('No data found in uploaded file');
  }

  if (!clientId) {
    throw new Error('Client ID is required for import');
  }

  const counters = {
    savedCount: 0,
    errorCount: 0,
    errors: []
  };

  try {
    // Use MongoDB processing for all environments
    await processMongoDBImport(data, counters, clientId);

    return {
      success: true,
      message: `Successfully imported ${counters.savedCount} records`,
      inserted: counters.savedCount,
      updated: 0,
      skipped: counters.errorCount,
      new_columns: [],
      errors: counters.errors.slice(0, 10).map((error, index) => ({ row: index + 1, reason: error }))
    };
  } catch (error) {
    console.error('Import processing error:', error);
    throw new Error(`Import failed: ${error.message}`);
  }
};

// Process import for PostgreSQL
const processPostgreSQLImport = async (pool, data, counters) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    for (let i = 0; i < data.length; i++) {
      try {
        const row = data[i];
        
        // Handle both possible date field names
        const reportDate = row.reportDate || row.report_date;
        
        // Validate required fields
        if (!reportDate) {
          counters.errors.push(`Row ${i + 1}: Missing reportDate/report_date`);
          counters.errorCount++;
          continue;
        }

        // Parse and validate date
        const dateObj = new Date(reportDate);
        if (isNaN(dateObj.getTime())) {
          counters.errors.push(`Row ${i + 1}: Invalid date format: ${reportDate}`);
          counters.errorCount++;
          continue;
        }

        // Map Excel column names to database column names
        const insertData = {
          report_date: dateObj.toISOString().split('T')[0],
          month_label: row.month_label || '',
          registered_onboarded: parseInt(row.registeredOnboarded || row.registered_onboarded) || 0,
          linked_accounts: parseInt(row.linkedAccounts || row.linked_accounts) || 0,
          total_advance_applications: parseInt(row.totalAdvanceApplications || row.total_advance_applications) || 0,
          total_advance_applicants: parseInt(row.totalAdvanceApplicants || row.total_advance_applicants) || 0,
          total_micro_financing_applications: parseInt(row.totalMicroFinancingApplications || row.total_micro_financing_applications) || 0,
          total_micro_financing_applicants: parseInt(row.totalMicroFinancingApplicants || row.total_micro_financing_applicants) || 0,
          total_personal_finance_application: parseInt(row.totalPersonalFinanceApplication || row.total_personal_finance_application) || 0,
          total_personal_finance_applicants: parseInt(row.totalPersonalFinanceApplicants || row.total_personal_finance_applicants) || 0,
          total_bnpl_applications: parseInt(row.totalBnplApplication || row.total_bnpl_applications) || 0,
          total_bnpl_applicants: parseInt(row.totalBnplApplicants || row.total_bnpl_applicants) || 0
        };

        // Insert or update record
        const insertQuery = `
          INSERT INTO reports (
            report_date, month_label, registered_onboarded, linked_accounts,
            total_advance_applications, total_advance_applicants,
            total_micro_financing_applications, total_micro_financing_applicants,
            total_personal_finance_application, total_personal_finance_applicants,
            total_bnpl_applications, total_bnpl_applicants,
            created_at, updated_at
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), NOW()
          ) ON CONFLICT (report_date) DO UPDATE SET
            month_label = EXCLUDED.month_label,
            registered_onboarded = EXCLUDED.registered_onboarded,
            linked_accounts = EXCLUDED.linked_accounts,
            total_advance_applications = EXCLUDED.total_advance_applications,
            total_advance_applicants = EXCLUDED.total_advance_applicants,
            total_micro_financing_applications = EXCLUDED.total_micro_financing_applications,
            total_micro_financing_applicants = EXCLUDED.total_micro_financing_applicants,
            total_personal_finance_application = EXCLUDED.total_personal_finance_application,
            total_personal_finance_applicants = EXCLUDED.total_personal_finance_applicants,
            total_bnpl_applications = EXCLUDED.total_bnpl_applications,
            total_bnpl_applicants = EXCLUDED.total_bnpl_applicants,
            updated_at = NOW()
        `;

        await client.query(insertQuery, [
          insertData.report_date,
          insertData.month_label,
          insertData.registered_onboarded,
          insertData.linked_accounts,
          insertData.total_advance_applications,
          insertData.total_advance_applicants,
          insertData.total_micro_financing_applications,
          insertData.total_micro_financing_applicants,
          insertData.total_personal_finance_application,
          insertData.total_personal_finance_applicants,
          insertData.total_bnpl_applications,
          insertData.total_bnpl_applicants
        ]);

        counters.savedCount++;
      } catch (rowError) {
        console.error(`Error processing row ${i + 1}:`, rowError);
        counters.errors.push(`Row ${i + 1}: ${rowError.message}`);
        counters.errorCount++;
      }
    }
    
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

// Process import for SQLite - Using same database connection as rest of app
const processSQLiteImport = async (pool, data, counters, clientId) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN TRANSACTION');
    
    for (let i = 0; i < data.length; i++) {
      try {
        const row = data[i];
        
        // Handle both possible date field names
        const reportDate = row.reportDate || row.report_date;
        
        // Validate required fields
        if (!reportDate) {
          counters.errors.push(`Row ${i + 1}: Missing reportDate/report_date`);
          counters.errorCount++;
          continue;
        }

        // Parse and validate date
        const dateObj = new Date(reportDate);
        if (isNaN(dateObj.getTime())) {
          counters.errors.push(`Row ${i + 1}: Invalid date format: ${reportDate}`);
          counters.errorCount++;
          continue;
        }

        // Map Excel column names to database column names  
        const insertData = [
          dateObj.toISOString().split('T')[0],
          row.month_label || '',
          parseInt(row.registeredOnboarded || row.registered_onboarded) || 0,
          parseInt(row.linkedAccounts || row.linked_accounts) || 0,
          parseInt(row.totalAdvanceApplications || row.total_advance_applications) || 0,
          parseInt(row.totalAdvanceApplicants || row.total_advance_applicants) || 0,
          parseInt(row.totalMicroFinancingApplications || row.total_micro_financing_applications) || 0,
          parseInt(row.totalMicroFinancingApplicants || row.total_micro_financing_applicants) || 0,
          parseInt(row.totalPersonalFinanceApplication || row.total_personal_finance_application) || 0,
          parseInt(row.totalPersonalFinanceApplicants || row.total_personal_finance_applicants) || 0,
          parseInt(row.totalBnplApplication || row.total_bnpl_applications) || 0,
          parseInt(row.totalBnplApplicants || row.total_bnpl_applicants) || 0,
          clientId
        ];

        const insertSQL = `
          INSERT OR REPLACE INTO reports (
            report_date, month_label, registered_onboarded, linked_accounts,
            total_advance_applications, total_advance_applicants,
            total_micro_financing_applications, total_micro_financing_applicants,
            total_personal_finance_application, total_personal_finance_applicants,
            total_bnpl_applications, total_bnpl_applicants, client_id,
            created_at, updated_at
          ) VALUES (
            ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now')
          )
        `;

        await client.query(insertSQL, insertData);
        counters.savedCount++;
        
      } catch (rowError) {
        console.error(`Error processing row ${i + 1}:`, rowError);
        counters.errors.push(`Row ${i + 1}: ${rowError.message}`);
        counters.errorCount++;
      }
    }
    
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

// Process import for MongoDB
const processMongoDBImport = async (data, counters, clientId) => {
  const db = await getDb();
  const reportsCollection = db.collection('reports');
  
  for (let i = 0; i < data.length; i++) {
    try {
      const row = data[i];
      
      // Handle both possible date field names
      const reportDate = row.reportDate || row.report_date;
      
      // Validate required fields
      if (!reportDate) {
        counters.errors.push(`Row ${i + 1}: Missing reportDate/report_date`);
        counters.errorCount++;
        continue;
      }

      // Parse and validate date
      const dateObj = new Date(reportDate);
      if (isNaN(dateObj.getTime())) {
        counters.errors.push(`Row ${i + 1}: Invalid date format: ${reportDate}`);
        counters.errorCount++;
        continue;
      }

      // Map Excel column names to database document
      const document = {
        client_id: clientId,
        report_date: dateObj.toISOString().split('T')[0],
        month_label: row.month_label || '',
        registered_onboarded: parseInt(row.registeredOnboarded || row.registered_onboarded) || 0,
        subscription_completion: parseInt(row.subscriptionCompletion || row.subscription_completion) || 0,
        trial_started: parseInt(row.trialStarted || row.trial_started) || 0,
        subscription_started: parseInt(row.subscriptionStarted || row.subscription_started) || 0,
        total_revenue: parseFloat(row.totalRevenue || row.total_revenue) || 0.0,
        conversion_rate: parseFloat(row.conversionRate || row.conversion_rate) || 0.0,
        campaign_performance: parseFloat(row.campaignPerformance || row.campaign_performance) || 0.0,
        customer_acquisition_cost: parseFloat(row.customerAcquisitionCost || row.customer_acquisition_cost) || 0.0,
        lifetime_value: parseFloat(row.lifetimeValue || row.lifetime_value) || 0.0,
        churn_rate: parseFloat(row.churnRate || row.churn_rate) || 0.0,
        net_promoter_score: parseFloat(row.netPromoterScore || row.net_promoter_score) || 0.0,
        notes: row.notes || '',
        created_at: new Date(),
        updated_at: new Date()
      };

      // Insert or update the document
      await reportsCollection.replaceOne(
        { client_id: clientId, report_date: document.report_date },
        document,
        { upsert: true }
      );
      
      counters.savedCount++;
      
    } catch (rowError) {
      console.error(`Error processing row ${i + 1}:`, rowError);
      counters.errors.push(`Row ${i + 1}: ${rowError.message}`);
      counters.errorCount++;
    }
  }
};

module.exports = {
  processImportData
};
