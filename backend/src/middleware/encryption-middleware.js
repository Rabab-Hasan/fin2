const encryption = require('../utils/encryption');

// Middleware to encrypt API responses
function encryptResponse(req, res, next) {
  // Store original json method
  const originalJson = res.json;
  
  // Override res.json to encrypt response data
  res.json = function(data) {
    // Skip encryption for health checks and public endpoints
    if (req.path === '/api/health' || req.path.includes('/auth/')) {
      return originalJson.call(this, data);
    }
    
    try {
      // Encrypt the response data
      const encryptedData = encryption.encryptAPIData(data);
      
      // Send encrypted response with special header
      res.setHeader('X-Encrypted-Response', 'true');
      return originalJson.call(this, { encrypted: encryptedData });
      
    } catch (error) {
      console.error('Response encryption error:', error);
      // Fall back to unencrypted response in case of error
      return originalJson.call(this, data);
    }
  };
  
  next();
}

// Middleware to decrypt API requests
function decryptRequest(req, res, next) {
  // Check if request contains encrypted data
  if (req.body && req.body.encrypted && req.headers['x-encrypted-request'] === 'true') {
    try {
      // Decrypt the request body
      const decryptedData = encryption.decryptAPIData(req.body.encrypted);
      req.body = decryptedData;
      
    } catch (error) {
      console.error('Request decryption error:', error);
      return res.status(400).json({ error: 'Invalid encrypted request data' });
    }
  }
  
  next();
}

// Middleware to encrypt sensitive database fields before saving
function encryptSensitiveFields(data, fieldsToEncrypt = []) {
  const encrypted = { ...data };
  
  fieldsToEncrypt.forEach(field => {
    if (encrypted[field]) {
      encrypted[field] = encryption.encryptDatabaseField(encrypted[field]);
    }
  });
  
  return encrypted;
}

// Middleware to decrypt sensitive database fields after retrieval
function decryptSensitiveFields(data, fieldsToDecrypt = []) {
  if (!data) return data;
  
  const decrypted = Array.isArray(data) ? [...data] : { ...data };
  
  if (Array.isArray(decrypted)) {
    return decrypted.map(item => {
      const decryptedItem = { ...item };
      fieldsToDecrypt.forEach(field => {
        if (decryptedItem[field]) {
          decryptedItem[field] = encryption.decryptDatabaseField(decryptedItem[field]);
        }
      });
      return decryptedItem;
    });
  } else {
    fieldsToDecrypt.forEach(field => {
      if (decrypted[field]) {
        decrypted[field] = encryption.decryptDatabaseField(decrypted[field]);
      }
    });
    return decrypted;
  }
}

// Specific middleware for user data encryption
function encryptUserData(userData) {
  const sensitiveFields = ['phone', 'address', 'notes'];
  return encryptSensitiveFields(userData, sensitiveFields);
}

function decryptUserData(userData) {
  const sensitiveFields = ['phone', 'address', 'notes'];
  return decryptSensitiveFields(userData, sensitiveFields);
}

// Specific middleware for financial data encryption
function encryptFinancialData(financialData) {
  const sensitiveFields = ['account_number', 'bank_details', 'payment_info'];
  return encryptSensitiveFields(financialData, sensitiveFields);
}

function decryptFinancialData(financialData) {
  const sensitiveFields = ['account_number', 'bank_details', 'payment_info'];
  return decryptSensitiveFields(financialData, sensitiveFields);
}

module.exports = {
  encryptResponse,
  decryptRequest,
  encryptSensitiveFields,
  decryptSensitiveFields,
  encryptUserData,
  decryptUserData,
  encryptFinancialData,
  decryptFinancialData
};