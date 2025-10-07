// Test script to verify encryption implementation
const encryption = require('./src/utils/encryption');
const databaseEncryption = require('./src/middleware/database-encryption');

async function testEncryption() {
  console.log('🔒 Testing Encryption Implementation...\n');

  try {
    // Test 1: Basic encryption/decryption
    console.log('Test 1: Basic Encryption/Decryption');
    const testData = 'sensitive-test-data-123';
    const encrypted = encryption.encrypt(testData);
    const decrypted = encryption.decrypt(encrypted);
    
    console.log(`Original: ${testData}`);
    console.log(`Encrypted: ${encrypted?.substring(0, 50)}...`);
    console.log(`Decrypted: ${decrypted}`);
    console.log(`✅ Basic encryption: ${decrypted === testData ? 'PASS' : 'FAIL'}\n`);

    // Test 2: Password hashing
    console.log('Test 2: Password Hashing');
    const password = 'mySecurePassword123';
    const hashed = await databaseEncryption.encryptPassword(password);
    const verified = await databaseEncryption.verifyPassword(password, hashed);
    
    console.log(`Password: ${password}`);
    console.log(`Hashed: ${hashed?.substring(0, 30)}...`);
    console.log(`✅ Password verification: ${verified ? 'PASS' : 'FAIL'}\n`);

    // Test 3: Database field encryption
    console.log('Test 3: Database Field Encryption');
    const userData = {
      id: 1,
      email: 'test@example.com',
      name: 'Test User',
      password: hashed,
      user_type: 'employee',
      phone: '+1234567890'
    };

    const encryptedUserData = databaseEncryption.encryptForSQLite('users', userData);
    const decryptedUserData = databaseEncryption.decryptFromSQLite('users', encryptedUserData);

    console.log('Original user data:');
    console.log(JSON.stringify(userData, null, 2));
    console.log('\nEncrypted user data:');
    console.log(JSON.stringify(encryptedUserData, null, 2));
    console.log('\nDecrypted user data:');
    console.log(JSON.stringify(decryptedUserData, null, 2));

    const emailMatches = decryptedUserData.email === userData.email;
    const nameMatches = decryptedUserData.name === userData.name;
    console.log(`✅ Database encryption: ${emailMatches && nameMatches ? 'PASS' : 'FAIL'}\n`);

    // Test 4: JWT payload encryption
    console.log('Test 4: JWT Payload Encryption');
    const jwtPayload = {
      userId: 123,
      email: 'user@example.com',
      user_type: 'admin'
    };

    const encryptedJWT = encryption.encryptJWTPayload(jwtPayload);
    const decryptedJWT = encryption.decryptJWTPayload(encryptedJWT);

    console.log('Original JWT payload:', JSON.stringify(jwtPayload));
    console.log('Encrypted JWT:', encryptedJWT?.substring(0, 50) + '...');
    console.log('Decrypted JWT:', JSON.stringify(decryptedJWT));
    console.log(`✅ JWT encryption: ${JSON.stringify(decryptedJWT) === JSON.stringify(jwtPayload) ? 'PASS' : 'FAIL'}\n`);

    // Test 5: API request encryption
    console.log('Test 5: API Request Encryption');
    const apiData = {
      sensitive: 'confidential-data',
      public: 'public-info'
    };

    const encryptedAPI = encryption.encryptAPIRequest(apiData);
    const decryptedAPI = encryption.decryptAPIRequest(encryptedAPI);

    console.log('Original API data:', JSON.stringify(apiData));
    console.log('Encrypted API request:', JSON.stringify(encryptedAPI));
    console.log('Decrypted API data:', JSON.stringify(decryptedAPI));
    console.log(`✅ API encryption: ${JSON.stringify(decryptedAPI) === JSON.stringify(apiData) ? 'PASS' : 'FAIL'}\n`);

    console.log('🎉 All encryption tests completed!');
    
    return true;
  } catch (error) {
    console.error('❌ Test failed:', error);
    return false;
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  testEncryption()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('Test execution failed:', error);
      process.exit(1);
    });
}

module.exports = testEncryption;