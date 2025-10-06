const { getDb } = require('./src/database-mongo');
const { ObjectId } = require('mongodb');

async function testValidation() {
  try {
    const mongoDb = await getDb();
    const usersCollection = mongoDb.collection('users');
    
    const accountManagerId = '68cbba6c5f4f08fd1d30ad53';
    console.log('Testing validation for user:', accountManagerId);
    
    // Define valid account manager roles and user_types
    const validRoles = ['employee', 'admin', 'hr', 'manager', 'supervisor', 'head_of_marketing'];
    const validUserTypes = ['employee', 'admin'];
    
    // First find the user by ID (either ObjectId or string)
    let userFound = null;
    let manager = null;
    
    try {
      if (ObjectId.isValid(accountManagerId)) {
        userFound = await usersCollection.findOne({ _id: new ObjectId(accountManagerId) });
        console.log('Found user with ObjectId:', !!userFound);
      }
      
      if (!userFound) {
        userFound = await usersCollection.findOne({ _id: accountManagerId });
        console.log('Found user with string ID:', !!userFound);
      }
      
      if (userFound) {
        console.log('User details:', {
          name: userFound.name,
          role: userFound.role,
          user_type: userFound.user_type,
          email: userFound.email
        });
        
        // Check if user is eligible to be account manager
        const hasValidRole = userFound.role && validRoles.includes(userFound.role);
        const hasValidUserType = userFound.user_type && validUserTypes.includes(userFound.user_type);
        const isNotClient = userFound.role !== 'client' && userFound.user_type !== 'client';
        
        console.log('Validation checks:', {
          hasValidRole,
          hasValidUserType,
          isNotClient,
          roleValue: userFound.role,
          userTypeValue: userFound.user_type
        });
        
        // Accept user if:
        // 1. They have a valid role, OR
        // 2. They have a valid user_type, OR  
        // 3. They're not a client (for backward compatibility)
        if (hasValidRole || hasValidUserType || (isNotClient && !userFound.role)) {
          manager = userFound;
          console.log('✅ User SHOULD BE accepted as account manager:', {
            reason: hasValidRole ? `valid role: ${userFound.role}` : 
                    hasValidUserType ? `valid user_type: ${userFound.user_type}` : 
                    'not a client user'
          });
        } else {
          console.log('❌ User SHOULD BE rejected as account manager:', {
            role: userFound.role,
            user_type: userFound.user_type,
            reason: 'Not eligible for account management'
          });
        }
      } else {
        console.log('❌ No user found with ID:', accountManagerId);
      }
      
    } catch (error) {
      console.log('Error finding user:', error.message);
    }
    
    const isValidManager = !!manager;
    console.log('\n🎯 FINAL RESULT:', isValidManager ? 'VALID MANAGER' : 'INVALID MANAGER');
    
    process.exit(0);
  } catch (error) {
    console.error('Test error:', error);
    process.exit(1);
  }
}

testValidation();