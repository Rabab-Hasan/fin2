require('dotenv').config();
const { getDb, connect, disconnect } = require('./src/database-mongo');

async function checkData() {
  try {
    console.log('🔍 Checking database data...');
    await connect();
    const db = await getDb();
    
    // Check all collections
    const collections = await db.listCollections().toArray();
    console.log('📊 Available collections:', collections.map(c => c.name));
    
    // Check reports collection specifically
    const reportsCount = await db.collection('reports').countDocuments();
    console.log('📈 Total reports:', reportsCount);
    
    if (reportsCount > 0) {
      const sampleReports = await db.collection('reports').find().limit(3).toArray();
      console.log('📋 Sample reports:');
      sampleReports.forEach((report, index) => {
        console.log(`${index + 1}. ID: ${report.id}, Date: ${report.report_date}, Client: ${report.clientId}`);
        console.log(`   Data keys: ${Object.keys(report.data || {}).join(', ')}`);
      });
    }
    
    // Check if there are any records with clientId
    const clientReports = await db.collection('reports').find({ clientId: { $exists: true } }).limit(5).toArray();
    console.log('👥 Reports with clientId:', clientReports.length);
    
    // Check all unique clientIds
    const uniqueClients = await db.collection('reports').distinct('clientId');
    console.log('🏢 Unique client IDs:', uniqueClients);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await disconnect();
  }
}

checkData();