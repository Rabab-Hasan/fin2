const crypto = require('crypto');
const CryptoJS = require('crypto-js');
const bcrypt = require('bcrypt');

// Configuration
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || crypto.randomBytes(32).toString('hex');
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const SALT_ROUNDS = 12;

class EncryptionService {
  constructor() {
    // Ensure encryption key is available
    if (!process.env.ENCRYPTION_KEY) {
      console.warn('⚠️  No ENCRYPTION_KEY found in environment. Using temporary key.');
      console.warn('🔑 Generated key:', ENCRYPTION_KEY);
      console.warn('📝 Add this to your .env file: ENCRYPTION_KEY=' + ENCRYPTION_KEY);
    }
  }

  // Password hashing with bcrypt
  async hashPassword(password) {
    try {
      const saltRounds = SALT_ROUNDS;
      const hashedPassword = await bcrypt.hash(password, saltRounds);
      return hashedPassword;
    } catch (error) {
      throw new Error('Password hashing failed: ' + error.message);
    }
  }

  async verifyPassword(password, hashedPassword) {
    try {
      return await bcrypt.compare(password, hashedPassword);
    } catch (error) {
      throw new Error('Password verification failed: ' + error.message);
    }
  }

  // AES encryption for sensitive data
  encrypt(text) {
    try {
      if (!text || typeof text !== 'string') {
        throw new Error('Text must be a non-empty string');
      }

      const iv = crypto.randomBytes(IV_LENGTH);
      const cipher = crypto.createCipher(ALGORITHM, ENCRYPTION_KEY);
      cipher.setAAD(Buffer.from('additional-data'));
      
      let encrypted = cipher.update(text, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      const authTag = cipher.getAuthTag();
      
      return {
        encrypted,
        iv: iv.toString('hex'),
        authTag: authTag.toString('hex')
      };
    } catch (error) {
      throw new Error('Encryption failed: ' + error.message);
    }
  }

  decrypt(encryptedData) {
    try {
      if (!encryptedData || !encryptedData.encrypted || !encryptedData.iv || !encryptedData.authTag) {
        throw new Error('Invalid encrypted data format');
      }

      const decipher = crypto.createDecipher(ALGORITHM, ENCRYPTION_KEY);
      decipher.setAAD(Buffer.from('additional-data'));
      decipher.setAuthTag(Buffer.from(encryptedData.authTag, 'hex'));
      
      let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      return decrypted;
    } catch (error) {
      throw new Error('Decryption failed: ' + error.message);
    }
  }

  // Simple encryption for less sensitive data
  simpleEncrypt(text) {
    try {
      return CryptoJS.AES.encrypt(text, ENCRYPTION_KEY).toString();
    } catch (error) {
      throw new Error('Simple encryption failed: ' + error.message);
    }
  }

  simpleDecrypt(encryptedText) {
    try {
      const bytes = CryptoJS.AES.decrypt(encryptedText, ENCRYPTION_KEY);
      return bytes.toString(CryptoJS.enc.Utf8);
    } catch (error) {
      throw new Error('Simple decryption failed: ' + error.message);
    }
  }

  // JWT token encryption
  encryptJWTPayload(payload) {
    try {
      const jsonString = JSON.stringify(payload);
      return this.simpleEncrypt(jsonString);
    } catch (error) {
      throw new Error('JWT payload encryption failed: ' + error.message);
    }
  }

  decryptJWTPayload(encryptedPayload) {
    try {
      const jsonString = this.simpleDecrypt(encryptedPayload);
      return JSON.parse(jsonString);
    } catch (error) {
      throw new Error('JWT payload decryption failed: ' + error.message);
    }
  }

  // Database field encryption
  encryptDatabaseField(value) {
    if (!value) return null;
    try {
      return this.simpleEncrypt(String(value));
    } catch (error) {
      console.error('Database field encryption error:', error);
      return value; // Return original if encryption fails
    }
  }

  decryptDatabaseField(encryptedValue) {
    if (!encryptedValue) return null;
    try {
      return this.simpleDecrypt(encryptedValue);
    } catch (error) {
      console.error('Database field decryption error:', error);
      return encryptedValue; // Return original if decryption fails
    }
  }

  // Generate secure random tokens
  generateSecureToken(length = 32) {
    return crypto.randomBytes(length).toString('hex');
  }

  // Hash data with salt (for non-password data that needs to be hashed)
  hashData(data, salt = null) {
    try {
      const actualSalt = salt || crypto.randomBytes(16).toString('hex');
      const hash = crypto.createHmac('sha256', actualSalt);
      hash.update(data);
      return {
        hash: hash.digest('hex'),
        salt: actualSalt
      };
    } catch (error) {
      throw new Error('Data hashing failed: ' + error.message);
    }
  }

  // API request/response encryption
  encryptAPIData(data) {
    try {
      const jsonString = JSON.stringify(data);
      const timestamp = Date.now().toString();
      const dataWithTimestamp = jsonString + '|' + timestamp;
      return this.simpleEncrypt(dataWithTimestamp);
    } catch (error) {
      throw new Error('API data encryption failed: ' + error.message);
    }
  }

  decryptAPIData(encryptedData) {
    try {
      const decryptedString = this.simpleDecrypt(encryptedData);
      const parts = decryptedString.split('|');
      
      if (parts.length < 2) {
        throw new Error('Invalid encrypted data format');
      }
      
      const timestamp = parseInt(parts.pop());
      const jsonString = parts.join('|');
      
      // Check if data is not too old (5 minutes)
      if (Date.now() - timestamp > 5 * 60 * 1000) {
        throw new Error('Encrypted data has expired');
      }
      
      return JSON.parse(jsonString);
    } catch (error) {
      throw new Error('API data decryption failed: ' + error.message);
    }
  }
}

module.exports = new EncryptionService();