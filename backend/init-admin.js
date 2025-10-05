const bcrypt = require('bcryptjs');
const { getDb } = require('./src/database-mongo');

async function initializeAdminUser() {
  console.log('🔄 Initializing MongoDB admin user...');
  
  try {
    const db = await getDb();
    const usersCollection = db.collection('users');

    // Check if admin user already exists
    const existingAdmin = await usersCollection.findOne({ email: 'admin@example.com' });
    
    if (existingAdmin) {
      console.log('✓ Admin user already exists');
      return;
    }

    // Create default admin user
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    const adminUser = {
      email: 'admin@example.com',
      password: hashedPassword,
      name: 'Administrator',
      user_type: 'admin',
      association: null,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await usersCollection.insertOne(adminUser);
    console.log('✓ Created default admin user (admin@example.com / admin123)');

  } catch (error) {
    console.error('❌ Error initializing admin user:', error);
  }
}

// Run if this file is executed directly
if (require.main === module) {
  initializeAdminUser().then(() => {
    console.log('Admin user initialization completed');
    process.exit(0);
  }).catch(error => {
    console.error('Admin user initialization failed:', error);
    process.exit(1);
  });
}

module.exports = { initializeAdminUser };