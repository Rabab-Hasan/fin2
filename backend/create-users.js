const { getDb } = require('./src/database-mongo');
const bcrypt = require('bcryptjs');

async function createUser(userData) {
  try {
    console.log(`👤 Creating user: ${userData.email}`);
    
    const db = await getDb();
    const usersCollection = db.collection('users');
    
    // Check if user already exists
    const existingUser = await usersCollection.findOne({ email: userData.email });
    if (existingUser) {
      console.log(`⚠️ User ${userData.email} already exists`);
      return existingUser;
    }
    
    // Hash the password
    const hashedPassword = await bcrypt.hash(userData.password, 12);
    
    // Create user object
    const newUser = {
      name: userData.name,
      email: userData.email.toLowerCase(),
      password: hashedPassword,
      role: userData.role || 'employee',
      created_at: new Date(),
      updated_at: new Date(),
      active: true,
      department: userData.department || 'General'
    };
    
    // Insert user
    const result = await usersCollection.insertOne(newUser);
    
    console.log(`✅ User created successfully with ID: ${result.insertedId}`);
    console.log(`   Email: ${userData.email}`);
    console.log(`   Role: ${newUser.role}`);
    console.log(`   Department: ${newUser.department}`);
    
    return {
      id: result.insertedId,
      email: userData.email,
      name: userData.name,
      role: newUser.role
    };
    
  } catch (error) {
    console.error(`❌ Error creating user ${userData.email}:`, error);
    throw error;
  }
}

async function createMultipleUsers() {
  try {
    console.log('🚀 Starting user creation process...\n');
    
    const users = [
      {
        email: 'y.alsarraj@action-labs.co',
        password: 'soso2025!',
        name: 'Y. Alsarraj',
        role: 'employee',
        department: 'Marketing'
      },
      {
        email: 'o.rana@action-labs.co',
        password: 'boss2025!',
        name: 'O. Rana',
        role: 'admin', // Assuming this is a boss/manager role
        department: 'Management'
      }
    ];
    
    const createdUsers = [];
    
    for (const userData of users) {
      const user = await createUser(userData);
      createdUsers.push(user);
      console.log(); // Empty line for readability
    }
    
    console.log('🎉 All users created successfully!');
    console.log('\n📋 Summary:');
    createdUsers.forEach((user, index) => {
      console.log(`${index + 1}. ${user.name} (${user.email}) - Role: ${user.role}`);
    });
    
    return createdUsers;
    
  } catch (error) {
    console.error('💥 Failed to create users:', error);
    throw error;
  }
}

// Interactive script
async function main() {
  try {
    const args = process.argv.slice(2);
    
    if (args.includes('--list')) {
      // List existing users
      console.log('📋 Listing existing users...\n');
      const db = await getDb();
      const users = await db.collection('users').find({}).toArray();
      
      console.log(`Found ${users.length} users:`);
      users.forEach((user, index) => {
        console.log(`${index + 1}. ${user.name || 'Unknown'} (${user.email}) - Role: ${user.role || user.user_type || 'Unknown'}`);
      });
      
      process.exit(0);
    }
    
    if (args.includes('--help')) {
      console.log('User Creation Script');
      console.log('Usage:');
      console.log('  node create-users.js          - Create the predefined users');
      console.log('  node create-users.js --list   - List all existing users');
      console.log('  node create-users.js --help   - Show this help');
      process.exit(0);
    }
    
    // Create the users
    await createMultipleUsers();
    process.exit(0);
    
  } catch (error) {
    console.error('💥 Script failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { createUser, createMultipleUsers };