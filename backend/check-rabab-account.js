const { MongoClient } = require('mongodb');
const bcryptjs = require('bcryptjs');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || process.env.DATABASE_URL;

async function checkRababAccount() {
  let client;
  
  try {
    console.log('🔗 Connecting to MongoDB...');
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    
    const db = client.db();
    const usersCollection = db.collection('users');
    
    // Find rabab user
    const rababUser = await usersCollection.findOne({ email: 'r.hasan@action-labs.co' });
    
    if (!rababUser) {
      console.log('❌ Rabab user not found!');
      return;
    }
    
    console.log('👤 Found rabab user:');
    console.log(`   Name: ${rababUser.name}`);
    console.log(`   Email: ${rababUser.email}`);
    console.log(`   User Type: ${rababUser.user_type || rababUser.role}`);
    console.log(`   Has Password: ${rababUser.password ? 'Yes' : 'No'}`);
    
    // Test common passwords
    const testPasswords = ['soso2025!', 'password', 'rabab', '123456'];
    let foundPassword = null;
    
    if (rababUser.password) {
      console.log('\n🔐 Testing common passwords:');
      
      for (const pwd of testPasswords) {
        const isValid = await bcryptjs.compare(pwd, rababUser.password);
        console.log(`   "${pwd}": ${isValid ? '✅ MATCH' : '❌ No match'}`);
        if (isValid) {
          foundPassword = pwd;
          break;
        }
      }
    }
    
    if (!foundPassword) {
      console.log('\n🔧 Setting new password for rabab...');
      const newPassword = 'rabab2025!';
      const hashedPassword = await bcryptjs.hash(newPassword, 10);
      
      await usersCollection.updateOne(
        { email: 'r.hasan@action-labs.co' },
        { 
          $set: { 
            password: hashedPassword,
            user_type: 'employee',
            role: 'employee',
            updatedAt: new Date()
          }
        }
      );
      
      console.log(`✅ Set new password for rabab: ${newPassword}`);
      foundPassword = newPassword;
    }
    
    // Test the password
    console.log(`\n🧪 Testing login with password: ${foundPassword}`);
    const updatedUser = await usersCollection.findOne({ email: 'r.hasan@action-labs.co' });
    const passwordTest = await bcryptjs.compare(foundPassword, updatedUser.password);
    console.log(`   Login test: ${passwordTest ? '✅ SUCCESS' : '❌ FAILED'}`);
    
    // Final status
    console.log('\n📋 Final user status:');
    console.log(`   Name: ${updatedUser.name}`);
    console.log(`   Email: ${updatedUser.email}`);
    console.log(`   Type: ${updatedUser.user_type || updatedUser.role}`);
    console.log(`   Password: ${foundPassword}`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    if (client) {
      await client.close();
      console.log('🔐 Database connection closed');
    }
  }
}

checkRababAccount();