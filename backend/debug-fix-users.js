const { MongoClient } = require('mongodb');
const bcrypt = require('bcrypt');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || process.env.DATABASE_URL;

async function debugAndFixUsers() {
  let client;
  
  try {
    console.log('🔗 Connecting to MongoDB...');
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    
    const db = client.db();
    const usersCollection = db.collection('users');
    
    // Check current users
    console.log('📋 Current users in database:');
    const allUsers = await usersCollection.find({}).toArray();
    
    allUsers.forEach((user, index) => {
      console.log(`${index + 1}. Name: "${user.name}"`);
      console.log(`   Email: ${user.email}`);
      console.log(`   User Type: ${user.user_type || user.role || 'undefined'}`);
      console.log(`   Password Hash: ${user.password ? 'exists' : 'MISSING'}`);
      console.log(`   ID: ${user._id}\n`);
    });
    
    // Check specifically for m@One.com
    console.log('🔍 Checking m@One.com user...');
    const oneUser = await usersCollection.findOne({ email: 'm@One.com' });
    
    if (!oneUser) {
      console.log('❌ m@One.com user not found! Creating...');
      
      const newOneUser = {
        name: 'One Client',
        email: 'm@One.com',
        password: await bcrypt.hash('One2025!', 10),
        user_type: 'client',
        role: 'client',
        association: null,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      const insertResult = await usersCollection.insertOne(newOneUser);
      console.log(`✅ Created m@One.com user (ID: ${insertResult.insertedId})`);
      console.log('   Password: One2025!');
    } else {
      console.log('✅ Found m@One.com user');
      console.log(`   Current password hash: ${oneUser.password}`);
      console.log(`   Current user_type: ${oneUser.user_type || oneUser.role}`);
      
      // Test the password
      console.log('\n🔐 Testing password "One2025!" for m@One.com...');
      const isValidPassword = await bcrypt.compare('One2025!', oneUser.password);
      console.log(`   Password test result: ${isValidPassword ? '✅ VALID' : '❌ INVALID'}`);
      
      if (!isValidPassword) {
        console.log('🔄 Resetting password for m@One.com...');
        const newPasswordHash = await bcrypt.hash('One2025!', 10);
        await usersCollection.updateOne(
          { email: 'm@One.com' },
          { 
            $set: { 
              password: newPasswordHash,
              user_type: 'client',
              role: 'client',
              updatedAt: new Date()
            }
          }
        );
        console.log('✅ Password reset successful');
      }
      
      // Ensure it's marked as client
      if (oneUser.user_type !== 'client' && oneUser.role !== 'client') {
        console.log('🔄 Updating m@One.com to client type...');
        await usersCollection.updateOne(
          { email: 'm@One.com' },
          { 
            $set: { 
              user_type: 'client',
              role: 'client',
              updatedAt: new Date()
            }
          }
        );
        console.log('✅ Updated to client type');
      }
    }
    
    // Check r.hasan@action-labs.co
    console.log('\n🔍 Checking r.hasan@action-labs.co user...');
    const rahabUser = await usersCollection.findOne({ email: 'r.hasan@action-labs.co' });
    
    if (!rahabUser) {
      console.log('❌ r.hasan@action-labs.co user not found!');
    } else {
      console.log('✅ Found r.hasan@action-labs.co user');
      console.log(`   Current user_type: ${rahabUser.user_type || rahabUser.role}`);
      
      if (rahabUser.user_type !== 'employee' && rahabUser.role !== 'employee') {
        console.log('🔄 Updating r.hasan@action-labs.co to employee type...');
        await usersCollection.updateOne(
          { email: 'r.hasan@action-labs.co' },
          { 
            $set: { 
              user_type: 'employee',
              role: 'employee',
              updatedAt: new Date()
            }
          }
        );
        console.log('✅ Updated to employee type');
      } else {
        console.log('✅ Already marked as employee');
      }
    }
    
    // Test login for m@One.com
    console.log('\n🧪 Testing complete login flow for m@One.com...');
    const testUser = await usersCollection.findOne({ email: 'm@One.com' });
    
    if (testUser) {
      console.log('User found for login test:');
      console.log(`   Email: ${testUser.email}`);
      console.log(`   Name: ${testUser.name}`);
      console.log(`   Type: ${testUser.user_type || testUser.role}`);
      console.log(`   Has password: ${testUser.password ? 'Yes' : 'No'}`);
      
      const passwordTest = await bcrypt.compare('One2025!', testUser.password);
      console.log(`   Password "One2025!" works: ${passwordTest ? '✅ YES' : '❌ NO'}`);
      
      if (!passwordTest) {
        console.log('\n🔧 Fixing password issue...');
        // Try different salt rounds
        const newHash = await bcrypt.hash('One2025!', 12);
        await usersCollection.updateOne(
          { email: 'm@One.com' },
          { $set: { password: newHash } }
        );
        
        // Test again
        const updatedUser = await usersCollection.findOne({ email: 'm@One.com' });
        const retestPassword = await bcrypt.compare('One2025!', updatedUser.password);
        console.log(`   After fix - Password works: ${retestPassword ? '✅ YES' : '❌ NO'}`);
      }
    }
    
    // Final status
    console.log('\n📋 Final user status:');
    const finalUsers = await usersCollection.find({}).toArray();
    
    for (const user of finalUsers) {
      console.log(`\n👤 ${user.name} (${user.email})`);
      console.log(`   Type: ${user.user_type || user.role}`);
      console.log(`   ID: ${user._id}`);
      
      if (user.email === 'm@One.com') {
        const passwordWorks = await bcrypt.compare('One2025!', user.password);
        console.log(`   Login Test: ${passwordWorks ? '✅ Password works' : '❌ Password failed'}`);
      }
    }
    
    console.log('\n✅ Debug and fix completed!');
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    if (client) {
      await client.close();
      console.log('🔐 Database connection closed');
    }
  }
}

// Run the debug and fix
debugAndFixUsers();