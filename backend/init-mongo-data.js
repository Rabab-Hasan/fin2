const { MongoClient } = require('mongodb');
const bcrypt = require('bcryptjs');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://rhasan:GlassDoor2025@cluster0.tj04exd.mongodb.net/genius_db?retryWrites=true&w=majority&appName=Cluster0';
const DATABASE_NAME = 'genius_db';

async function initializeMongoData() {
  let client;
  
  try {
    console.log('🔗 Connecting to MongoDB for data initialization...');
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    const db = client.db(DATABASE_NAME);
    
    // Initialize Users Collection
    const usersCollection = db.collection('users');
    const existingUser = await usersCollection.findOne({ email: 'hr@example.com' });
    
    if (!existingUser) {
      console.log('👤 Creating sample user...');
      const hashedPassword = await bcrypt.hash('password', 10);
      await usersCollection.insertOne({
        id: '1',
        email: 'hr@example.com',
        password: hashedPassword,
        user_type: 'employee',
        association: null,
        name: 'HR User',
        created_at: new Date(),
        updated_at: new Date()
      });
      console.log('✅ Sample user created');
    } else {
      console.log('👤 User already exists');
    }
    
    // Initialize Clients Collection
    const clientsCollection = db.collection('clients');
    const existingClients = await clientsCollection.countDocuments();
    
    if (existingClients === 0) {
      console.log('🏢 Creating sample clients...');
      const sampleClients = [
        {
          id: '1',
          name: 'Sample Company A',
          status: 'active',
          industry: 'Technology',
          contact_email: 'contact@companya.com',
          created_at: new Date(),
          updated_at: new Date()
        },
        {
          id: '2',
          name: 'Sample Company B',
          status: 'active',
          industry: 'Healthcare',
          contact_email: 'info@companyb.com',
          created_at: new Date(),
          updated_at: new Date()
        },
        {
          id: '3',
          name: 'Sample Company C',
          status: 'pending',
          industry: 'Finance',
          contact_email: 'hello@companyc.com',
          created_at: new Date(),
          updated_at: new Date()
        }
      ];
      
      await clientsCollection.insertMany(sampleClients);
      console.log('✅ Sample clients created');
    } else {
      console.log('🏢 Clients already exist');
    }
    
    // Initialize Reports Collection
    const reportsCollection = db.collection('reports');
    const existingReports = await reportsCollection.countDocuments();
    
    if (existingReports === 0) {
      console.log('📊 Creating sample reports...');
      const sampleReports = [
        {
          id: '1',
          client_id: '1',
          report_date: new Date(),
          month_label: 'October 2025',
          registered_onboarded: 150,
          linked_accounts: 120,
          total_advance_applications: 45,
          total_advance_applicants: 42,
          created_at: new Date(),
          updated_at: new Date()
        },
        {
          id: '2',
          client_id: '2',
          report_date: new Date(),
          month_label: 'September 2025',
          registered_onboarded: 89,
          linked_accounts: 76,
          total_advance_applications: 23,
          total_advance_applicants: 21,
          created_at: new Date(),
          updated_at: new Date()
        }
      ];
      
      await reportsCollection.insertMany(sampleReports);
      console.log('✅ Sample reports created');
    } else {
      console.log('📊 Reports already exist');
    }
    
    // Initialize Campaigns Collection
    const campaignsCollection = db.collection('campaigns');
    const existingCampaigns = await campaignsCollection.countDocuments();
    
    if (existingCampaigns === 0) {
      console.log('📈 Creating sample campaigns...');
      const sampleCampaigns = [
        {
          id: '1',
          client_id: '1',
          name: 'Q4 Holiday Campaign',
          status: 'active',
          budget: 5000,
          start_date: new Date('2025-10-01'),
          end_date: new Date('2025-12-31'),
          platform: 'facebook',
          created_at: new Date(),
          updated_at: new Date()
        },
        {
          id: '2',
          client_id: '2',
          name: 'Brand Awareness Drive',
          status: 'active',
          budget: 3000,
          start_date: new Date('2025-09-15'),
          end_date: new Date('2025-11-15'),
          platform: 'google',
          created_at: new Date(),
          updated_at: new Date()
        }
      ];
      
      await campaignsCollection.insertMany(sampleCampaigns);
      console.log('✅ Sample campaigns created');
    } else {
      console.log('📈 Campaigns already exist');
    }
    
    console.log('🎉 MongoDB data initialization complete!');
    
  } catch (error) {
    console.error('❌ Error initializing MongoDB data:', error);
    throw error;
  } finally {
    if (client) {
      await client.close();
    }
  }
}

// Run initialization if called directly
if (require.main === module) {
  initializeMongoData()
    .then(() => {
      console.log('✅ Data initialization completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Data initialization failed:', error);
      process.exit(1);
    });
}

module.exports = initializeMongoData;