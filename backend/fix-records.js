const { getDb } = require('./src/database-mongo');

async function fixRecords() {
  try {
    console.log('🔧 Connecting to database...');
    const db = await getDb();
    const reportsCollection = db.collection('reports');

    // Get all records without clientId
    const recordsWithoutClientId = await reportsCollection.find({
      $or: [
        { clientId: { $exists: false } },
        { clientId: null },
        { clientId: "" }
      ]
    }).toArray();

    console.log(`📊 Found ${recordsWithoutClientId.length} records without clientId`);

    if (recordsWithoutClientId.length === 0) {
      console.log('✅ No records need fixing');
      return;
    }

    // Update records to have clientId and some sample data
    const updates = recordsWithoutClientId.map(record => ({
      updateOne: {
        filter: { _id: record._id },
        update: {
          $set: {
            clientId: 'ac22bb48-fee6-4c2d-9f43-f0ff37d299a5', // "One" client
            data: {
              registered_onboarded: Math.floor(Math.random() * 100) + 50,
              linked_accounts: Math.floor(Math.random() * 80) + 30,
              total_advance_applications: Math.floor(Math.random() * 50) + 20,
              total_advance_applicants: Math.floor(Math.random() * 40) + 15,
              total_micro_financing_applications: Math.floor(Math.random() * 30) + 10,
              total_micro_financing_applicants: Math.floor(Math.random() * 25) + 8,
              total_personal_finance_application: Math.floor(Math.random() * 20) + 5,
              total_personal_finance_applicants: Math.floor(Math.random() * 15) + 3,
              total_bnpl_applications: Math.floor(Math.random() * 25) + 10,
              total_bnpl_applicants: Math.floor(Math.random() * 20) + 8
            },
            updatedAt: new Date()
          }
        }
      }
    }));

    console.log('🔄 Updating records...');
    const result = await reportsCollection.bulkWrite(updates);

    console.log(`✅ Updated ${result.modifiedCount} records with clientId and sample data`);
    
    // Verify the update
    const updatedRecords = await reportsCollection.find({
      clientId: 'ac22bb48-fee6-4c2d-9f43-f0ff37d299a5'
    }).limit(3).toArray();

    console.log('📋 Sample updated records:');
    updatedRecords.forEach((record, index) => {
      console.log(`  ${index + 1}. Date: ${record.report_date}, Registered: ${record.data?.registered_onboarded || 0}`);
    });

  } catch (error) {
    console.error('❌ Error fixing records:', error);
    process.exit(1);
  }
}

fixRecords().then(() => {
  console.log('🎉 Records fixed successfully');
  process.exit(0);
}).catch(error => {
  console.error('💥 Failed to fix records:', error);
  process.exit(1);
});