const { getDb } = require('./src/database-mongo');
const { v4: uuidv4 } = require('uuid');

async function populateSampleData() {
  try {
    const db = await getDb();
    console.log('🚀 Connected to MongoDB - Populating sample data...');

    // Sample client data
    const clientId = '1'; // Default client ID
    
    // Sample report data for the last 30 days
    const sampleReports = [];
    const today = new Date();
    
    for (let i = 0; i < 30; i++) {
      const reportDate = new Date(today);
      reportDate.setDate(today.getDate() - i);
      
      const dateString = reportDate.toISOString().split('T')[0];
      const monthLabel = reportDate.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long' 
      });
      
      // Generate realistic sample data
      const report = {
        id: uuidv4(),
        report_date: dateString,
        month_label: monthLabel,
        clientId: clientId,
        data: {
          registered_onboarded: Math.floor(Math.random() * 50) + 10,
          linked_accounts: Math.floor(Math.random() * 40) + 5,
          total_advance_applications: Math.floor(Math.random() * 100) + 20,
          total_advance_applicants: Math.floor(Math.random() * 80) + 15,
          total_micro_financing_applications: Math.floor(Math.random() * 60) + 10,
          total_micro_financing_applicants: Math.floor(Math.random() * 50) + 8,
          total_personal_finance_application: Math.floor(Math.random() * 70) + 12,
          total_personal_finance_applicants: Math.floor(Math.random() * 60) + 10,
          total_bnpl_applications: Math.floor(Math.random() * 40) + 5,
          total_bnpl_applicants: Math.floor(Math.random() * 35) + 3
        },
        notes: i % 5 === 0 ? `Sample note for ${dateString} - Performance analysis` : null,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      sampleReports.push(report);
    }

    // Insert sample reports
    console.log(`📊 Inserting ${sampleReports.length} sample reports...`);
    const result = await db.collection('reports').insertMany(sampleReports);
    console.log(`✅ Successfully inserted ${result.insertedCount} reports`);

    // Verify data
    const count = await db.collection('reports').countDocuments({ clientId });
    console.log(`🔍 Total reports for client ${clientId}: ${count}`);

    // Show sample
    const sample = await db.collection('reports').findOne({ clientId });
    console.log(`📋 Sample report:`, {
      id: sample.id,
      date: sample.report_date,
      dataKeys: Object.keys(sample.data),
      totalApps: sample.data.total_advance_applications
    });

    console.log('🎉 Sample data population completed!');
    console.log('💡 You can now view data in Action Labs > Data Entry tab');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error populating sample data:', error);
    process.exit(1);
  }
}

// Run the population
populateSampleData();