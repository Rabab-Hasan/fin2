const encryption = require('../utils/encryption');

// Fields that should be encrypted in the database
const SENSITIVE_FIELDS = {
  users: ['email', 'name', 'phone', 'address'],
  clients: ['client_name', 'email', 'phone', 'address', 'company_name'],
  campaigns: ['campaign_name', 'targeting_details', 'creative_content'],
  social_media_tokens: ['access_token', 'refresh_token', 'user_data'],
  reports: ['client_name', 'financial_data']
};

// Fields that should NOT be encrypted (keep them searchable)
const EXCLUDE_FROM_ENCRYPTION = ['id', '_id', 'created_at', 'updated_at', 'user_type', 'association', 'platform'];

class DatabaseEncryption {
  constructor() {
    this.encryption = encryption;
  }

  // Encrypt sensitive fields in an object before saving to database
  encryptForDatabase(tableName, data) {
    try {
      if (!data || typeof data !== 'object') {
        return data;
      }

      const sensitiveFields = SENSITIVE_FIELDS[tableName] || [];
      const result = { ...data };

      sensitiveFields.forEach(field => {
        if (result[field] !== undefined && 
            result[field] !== null && 
            !EXCLUDE_FROM_ENCRYPTION.includes(field)) {
          
          // Only encrypt if not already encrypted
          if (!this.isAlreadyEncrypted(result[field])) {
            result[field] = this.encryption.encryptDatabaseField(result[field]);
          }
        }
      });

      return result;
    } catch (error) {
      console.error(`Database encryption error for ${tableName}:`, error);
      return data; // Return original data if encryption fails
    }
  }

  // Decrypt sensitive fields when retrieving from database
  decryptFromDatabase(tableName, data) {
    try {
      if (!data || typeof data !== 'object') {
        return data;
      }

      const sensitiveFields = SENSITIVE_FIELDS[tableName] || [];
      
      // Handle single object
      if (!Array.isArray(data)) {
        return this.decryptSingleRecord(tableName, data, sensitiveFields);
      }

      // Handle array of objects
      return data.map(record => this.decryptSingleRecord(tableName, record, sensitiveFields));
    } catch (error) {
      console.error(`Database decryption error for ${tableName}:`, error);
      return data; // Return original data if decryption fails
    }
  }

  // Decrypt a single database record
  decryptSingleRecord(tableName, record, sensitiveFields) {
    try {
      const result = { ...record };

      sensitiveFields.forEach(field => {
        if (result[field] !== undefined && 
            result[field] !== null && 
            this.isAlreadyEncrypted(result[field])) {
          
          const decrypted = this.encryption.decryptDatabaseField(result[field]);
          if (decrypted !== null) {
            result[field] = decrypted;
          }
        }
      });

      return result;
    } catch (error) {
      console.error(`Record decryption error for ${tableName}:`, error);
      return record;
    }
  }

  // Check if a value is already encrypted (contains encryption pattern)
  isAlreadyEncrypted(value) {
    if (typeof value !== 'string') return false;
    // Check for various encryption patterns
    return /^[0-9a-f]+:[0-9a-f]+$/i.test(value) ||  // hex:hex format (current)
           /^[0-9a-f]+:[0-9a-f]+:[0-9a-f]+$/i.test(value) || // hex:hex:hex format (GCM)
           value.startsWith('b64:') ||  // base64 fallback
           value.startsWith('xor:') ||  // XOR obfuscation
           value.startsWith('plain:');  // plain base64
  }

  // Safely encrypt user passwords (separate method for special handling)
  async encryptPassword(password) {
    try {
      return await this.encryption.hashPassword(password);
    } catch (error) {
      console.error('Password encryption error:', error);
      throw new Error('Password encryption failed');
    }
  }

  // Verify user password
  async verifyPassword(password, hashedPassword) {
    try {
      return await this.encryption.verifyPassword(password, hashedPassword);
    } catch (error) {
      console.error('Password verification error:', error);
      return false;
    }
  }

  // Encrypt for specific search (creates searchable encrypted versions)
  createSearchableEncryption(value) {
    try {
      if (!value) return null;
      
      // Create a hash that can be used for exact matches but doesn't reveal the original value
      return this.encryption.simpleEncrypt(value.toLowerCase().trim());
    } catch (error) {
      console.error('Searchable encryption error:', error);
      return null;
    }
  }

  // SQLite-specific encryption helpers
  encryptForSQLite(tableName, data) {
    return this.encryptForDatabase(tableName, data);
  }

  decryptFromSQLite(tableName, data) {
    return this.decryptFromDatabase(tableName, data);
  }

  // MongoDB-specific encryption helpers
  encryptForMongo(collectionName, data) {
    return this.encryptForDatabase(collectionName, data);
  }

  decryptFromMongo(collectionName, data) {
    return this.decryptFromDatabase(collectionName, data);
  }

  // Middleware for Express routes to automatically encrypt/decrypt
  createEncryptionMiddleware(tableName) {
    return (req, res, next) => {
      // Encrypt request body if it contains sensitive data
      if (req.body && Object.keys(req.body).length > 0) {
        req.body = this.encryptForDatabase(tableName, req.body);
      }

      // Store original res.json to intercept response
      const originalJson = res.json;
      
      res.json = (data) => {
        // Decrypt response data before sending
        if (data && typeof data === 'object') {
          const decryptedData = this.decryptFromDatabase(tableName, data);
          return originalJson.call(res, decryptedData);
        }
        return originalJson.call(res, data);
      };

      next();
    };
  }

  // Environment configuration encryption
  encryptEnvValue(value) {
    return this.encryption.encrypt(value);
  }

  decryptEnvValue(encryptedValue) {
    return this.encryption.decrypt(encryptedValue);
  }

  // Validate encryption setup
  async validateEncryptionSetup() {
    try {
      const testData = 'encryption-test-data';
      const encrypted = this.encryption.encrypt(testData);
      const decrypted = this.encryption.decrypt(encrypted);
      
      const isValid = decrypted === testData;
      
      if (isValid) {
        console.log('✅ Encryption system validated successfully');
      } else {
        console.error('❌ Encryption validation failed');
      }
      
      return isValid;
    } catch (error) {
      console.error('❌ Encryption validation error:', error);
      return false;
    }
  }
}

// Create singleton instance
const databaseEncryption = new DatabaseEncryption();

module.exports = databaseEncryption;