const { Database } = require('sqlite3').verbose();
const { getDb } = require('./src/database-mongo');
const path = require('path');

const sqliteDbPath = path.join(__dirname, 'data/finance_dashboard.db');

async function migrateReportsToMongoDB() {
  console.log('🔄 Starting reports migration from SQLite to MongoDB...');
  
  let sqliteDb;
  let mongoDb;
  
  try {
    // Connect to SQLite
    sqliteDb = new Database(sqliteDbPath, (err) => {
      if (err) {
        console.log('❌ SQLite connection failed:', err.message);
        throw err;
      }
      console.log('✓ Connected to SQLite database');
    });

    // Connect to MongoDB
    mongoDb = await getDb();
    console.log('✓ Connected to MongoDB');

    // Get all reports from SQLite
    const reports = await new Promise((resolve, reject) => {
      sqliteDb.all('SELECT * FROM reports ORDER BY report_date DESC', (err, rows) => {
        if (err) {
          console.error('Error fetching SQLite reports:', err);
          reject(err);
        } else {
          resolve(rows || []);
        }
      });
    });

    console.log(`📄 Found ${reports.length} reports in SQLite`);

    if (reports.length === 0) {
      console.log('No reports found in SQLite to migrate');
      return;
    }

    // Check if reports already exist in MongoDB
    const existingCount = await mongoDb.collection('reports').countDocuments();
    console.log(`📄 Found ${existingCount} existing reports in MongoDB`);

    let migratedCount = 0;
    let skippedCount = 0;

    // Migrate each report
    for (const report of reports) {
      try {
        // Check if report already exists in MongoDB
        const existing = await mongoDb.collection('reports').findOne({
          report_date: report.report_date,
          clientId: report.client_id
        });

        if (existing) {
          skippedCount++;
          continue;
        }

        // Convert SQLite report to MongoDB format
        const mongoReport = {
          id: report.id,
          report_date: report.report_date,
          month_label: report.month_label,
          clientId: report.client_id,
          data: {
            registered_onboarded: report.registered_onboarded || 0,
            linked_accounts: report.linked_accounts || 0,
            total_advance_applications: report.total_advance_applications || 0,
            total_advance_applicants: report.total_advance_applicants || 0,
            total_micro_financing_applications: report.total_micro_financing_applications || 0,
            total_micro_financing_applicants: report.total_micro_financing_applicants || 0,
            total_personal_finance_application: report.total_personal_finance_application || 0,
            total_personal_finance_applicants: report.total_personal_finance_applicants || 0,
            total_bnpl_applications: report.total_bnpl_applications || 0,
            total_bnpl_applicants: report.total_bnpl_applicants || 0
          },
          notes: report.notes || '',
          createdAt: report.created_at ? new Date(report.created_at) : new Date(),
          updatedAt: report.updated_at ? new Date(report.updated_at) : new Date()
        };

        // Insert into MongoDB
        await mongoDb.collection('reports').insertOne(mongoReport);
        migratedCount++;
        
        console.log(`✓ Migrated report: ${report.report_date} for client ${report.client_id}`);
      } catch (error) {
        console.error(`❌ Failed to migrate report ${report.id}:`, error);
      }
    }

    console.log(`✅ Migration completed!`);
    console.log(`   - Migrated: ${migratedCount} reports`);
    console.log(`   - Skipped (already exists): ${skippedCount} reports`);
    console.log(`   - Total in MongoDB: ${await mongoDb.collection('reports').countDocuments()}`);

  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    if (sqliteDb) {
      sqliteDb.close((err) => {
        if (err) {
          console.error('Error closing SQLite:', err);
        } else {
          console.log('✓ SQLite connection closed');
        }
      });
    }
  }
}

// Run migration if this file is executed directly
if (require.main === module) {
  migrateReportsToMongoDB().then(() => {
    console.log('Migration script completed');
    process.exit(0);
  }).catch(error => {
    console.error('Migration script failed:', error);
    process.exit(1);
  });
}

module.exports = { migrateReportsToMongoDB };