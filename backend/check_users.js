const { getDb } = require('./src/database-mongo');

async function checkUsers() {
  try {
    const db = await getDb();
    const usersCollection = db.collection('users');
    
    console.log('Checking users in MongoDB...');
    
    const users = await usersCollection.find({}).toArray();
    console.log(`Found ${users.length} users:`);
    
    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.name || 'Unknown'} (${user.email}) - Role: ${user.role || user.user_type || 'Unknown'}`);
    });
    
    // Check specifically for employee/admin users
    const employeeUsers = users.filter(user => 
      user.role === 'employee' || user.role === 'admin' || 
      user.user_type === 'employee' || user.user_type === 'admin'
    );
    
    console.log(`\nEmployee/Admin users: ${employeeUsers.length}`);
    employeeUsers.forEach((user, index) => {
      console.log(`${index + 1}. ${user.name || 'Unknown'} (${user.email}) - Role: ${user.role || user.user_type}`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('Error checking users:', error);
    process.exit(1);
  }
}

checkUsers();