const { MongoClient } = require('mongodb');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || process.env.DATABASE_URL;

async function manageUsers() {
  let client;
  
  try {
    console.log('🔗 Connecting to MongoDB...');
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    
    const db = client.db();
    const usersCollection = db.collection('users');
    
    // First, let's see what users exist
    console.log('📋 Current users in database:');
    const allUsers = await usersCollection.find({}).toArray();
    
    if (allUsers.length === 0) {
      console.log('❌ No users found in database');
      return;
    }
    
    allUsers.forEach((user, index) => {
      console.log(`${index + 1}. ID: ${user._id}, Name: "${user.name}", Email: ${user.email}, Type: ${user.user_type || user.role}`);
    });
    
    // Define users to keep
    const keepEmails = [
      'y.alsarraj@action-labs.co',
      'o.rana@action-labs.co', 
      'r.hasan@action-labs.co'
    ];
    
    // Find users to keep
    const usersToKeep = allUsers.filter(user => 
      keepEmails.includes(user.email.toLowerCase())
    );
    
    console.log(`\n✅ Users to keep (${usersToKeep.length}):`);
    usersToKeep.forEach(user => {
      console.log(`   - ${user.name} (${user.email}) - ${user.user_type || user.role}`);
    });
    
    // Find users to delete
    const usersToDelete = allUsers.filter(user => 
      !keepEmails.includes(user.email.toLowerCase())
    );
    
    if (usersToDelete.length > 0) {
      console.log(`\n⚠️  Users to delete (${usersToDelete.length}):`);
      usersToDelete.forEach(user => {
        console.log(`   - ${user.name} (${user.email}) - ${user.user_type || user.role}`);
      });
      
      // Delete users
      console.log('\n🗑️  Deleting users...');
      const userIdsToDelete = usersToDelete.map(user => user._id);
      const deleteResult = await usersCollection.deleteMany({
        _id: { $in: userIdsToDelete }
      });
      console.log(`✅ Successfully deleted ${deleteResult.deletedCount} users`);
    } else {
      console.log('\n✅ No users to delete.');
    }
    
    // Update rabab's user type to employee
    console.log('\n🔄 Updating rabab to employee...');
    const updateResult = await usersCollection.updateOne(
      { email: 'r.hasan@action-labs.co' },
      { 
        $set: { 
          user_type: 'employee',
          role: 'employee',
          updatedAt: new Date()
        }
      }
    );
    
    if (updateResult.matchedCount > 0) {
      console.log('✅ Successfully updated rabab to employee');
    } else {
      console.log('❌ Could not find rabab to update');
    }
    
    // Check if m@One.com already exists
    const existingOneUser = await usersCollection.findOne({ email: 'm@One.com' });
    
    if (existingOneUser) {
      console.log('\n✅ User m@One.com already exists');
    } else {
      // Add new user m@One.com as client
      console.log('\n➕ Adding new user m@One.com...');
      const bcrypt = require('bcrypt');
      
      const newUser = {
        name: 'One Client',
        email: 'm@One.com',
        password: await bcrypt.hash('One2025!', 10), // Default password
        user_type: 'client',
        role: 'client',
        association: null,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      const insertResult = await usersCollection.insertOne(newUser);
      console.log(`✅ Successfully added user m@One.com (ID: ${insertResult.insertedId})`);
      console.log(`   Default password: One2025!`);
    }
    
    // Show final user list
    console.log('\n📋 Final users in database:');
    const finalUsers = await usersCollection.find({}).toArray();
    finalUsers.forEach((user, index) => {
      console.log(`${index + 1}. ${user.name} (${user.email}) - ${user.user_type || user.role} - ID: ${user._id}`);
    });
    
    console.log('\n✅ User management completed successfully!');
    
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

// Run the user management
manageUsers();