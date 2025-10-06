const { getDb } = require('./src/database-mongo');
const { ObjectId } = require('mongodb');

async function debugUser() {
  try {
    const mongoDb = await getDb();
    const usersCollection = mongoDb.collection('users');
    
    const userId = '68cbba6c5f4f08fd1d30ad53';
    console.log('Debugging user ID:', userId);
    console.log('Is valid ObjectId?', ObjectId.isValid(userId));
    
    // Try all possible queries
    console.log('\n=== Direct ObjectId Query ===');
    const user1 = await usersCollection.findOne({ _id: new ObjectId(userId) });
    console.log('Found with ObjectId:', user1);
    
    console.log('\n=== String ID Query ===');
    const user2 = await usersCollection.findOne({ _id: userId });
    console.log('Found with string:', user2);
    
    console.log('\n=== All users in collection ===');
    const allUsers = await usersCollection.find({}).toArray();
    console.log('Total users:', allUsers.length);
    allUsers.forEach(user => {
      console.log(`ID: ${user._id} (type: ${typeof user._id}), Name: ${user.name}, Role: ${user.role}`);
    });
    
    console.log('\n=== Looking for matching IDs ===');
    const matchingUsers = allUsers.filter(user => 
      user._id.toString() === userId || 
      user._id === userId
    );
    console.log('Matching users:', matchingUsers);
    
    process.exit(0);
  } catch (error) {
    console.error('Debug error:', error);
    process.exit(1);
  }
}

debugUser();