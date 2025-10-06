const { ObjectId } = require('mongodb');
const { getDb } = require('./src/database-mongo');

async function testAccountManager() {
  try {
    console.log('Testing account manager validation...');
    
    const testId = '68cbba6c5f4f08fd1d30ad53';
    console.log('Test ID:', testId);
    console.log('Is valid ObjectId:', ObjectId.isValid(testId));
    
    const db = await getDb();
    const usersCollection = db.collection('users');
    
    // Test 1: Find with ObjectId
    console.log('\n--- Test 1: ObjectId approach ---');
    const manager1 = await usersCollection.findOne({ 
      _id: new ObjectId(testId)
    });
    console.log('Found with ObjectId:', !!manager1);
    if (manager1) {
      console.log('User:', { name: manager1.name || manager1.username, role: manager1.role, id: manager1._id });
    }
    
    // Test 2: Find with string
    console.log('\n--- Test 2: String approach ---');
    const manager2 = await usersCollection.findOne({ 
      _id: testId
    });
    console.log('Found with string:', !!manager2);
    if (manager2) {
      console.log('User:', { name: manager2.name || manager2.username, role: manager2.role, id: manager2._id });
    }
    
    // Test 3: Show all users
    console.log('\n--- Test 3: All users ---');
    const allUsers = await usersCollection.find({}, { 
      projection: { _id: 1, name: 1, username: 1, email: 1, role: 1 } 
    }).toArray();
    
    console.log('Total users:', allUsers.length);
    allUsers.forEach((user, index) => {
      console.log(`${index + 1}. ID: ${user._id}, Name: ${user.name || user.username}, Email: ${user.email}, Role: ${user.role}`);
    });
    
    // Test 4: Find employees/admins
    console.log('\n--- Test 4: Employees/Admins ---');
    const employees = await usersCollection.find({
      $or: [
        { role: 'employee' },
        { role: 'admin' }
      ]
    }, { 
      projection: { _id: 1, name: 1, username: 1, email: 1, role: 1 } 
    }).toArray();
    
    console.log('Employees/Admins:', employees.length);
    employees.forEach((user, index) => {
      console.log(`${index + 1}. ID: ${user._id}, Name: ${user.name || user.username}, Role: ${user.role}`);
      if (user._id.toString() === testId) {
        console.log('   ^ THIS IS THE TEST USER!');
      }
    });
    
    process.exit(0);
  } catch (error) {
    console.error('Test failed:', error);
    process.exit(1);
  }
}

testAccountManager();