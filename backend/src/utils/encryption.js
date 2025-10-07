const crypto = require('crypto');
const bcrypt = require('bcryptjs');

// Default encryption key (use environment variable in production)
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'finance-dashboard-default-key-32-chars';
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16; // 128 bits
const TAG_LENGTH = 16; // 128 bits
const SALT_LENGTH = 32; // 256 bits

class EncryptionService {
  constructor() {
    // Ensure encryption key is proper length
    this.encryptionKey = this.deriveKey(ENCRYPTION_KEY);
    
    // Warn if using default key
    if (!process.env.ENCRYPTION_KEY) {
      console.warn('⚠️ Using default encryption key. Set ENCRYPTION_KEY environment variable in production.');
    }
  }

  // Derive a 32-byte key from any input
  deriveKey(input) {
    return crypto.pbkdf2Sync(input, 'finance-dashboard-salt', 100000, 32, 'sha256');
  }

  // Password hashing with bcrypt
  async hashPassword(password) {
    try {
      const saltRounds = 12;
      return await bcrypt.hash(password, saltRounds);
    } catch (error) {
      console.error('Password hashing error:', error);
      throw new Error('Password hashing failed');
    }
  }

  async verifyPassword(password, hashedPassword) {
    try {
      return await bcrypt.compare(password, hashedPassword);
    } catch (error) {
      console.error('Password verification error:', error);
      return false;
    }
  }

  // AES encryption for sensitive data using modern crypto API
  encrypt(text) {
    try {
      if (!text) return null;
      
      const iv = crypto.randomBytes(16);
      const key = crypto.scryptSync(this.encryptionKey.toString(), 'salt', 32);
      const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
      
      let encrypted = cipher.update(String(text), 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      // Return iv + encrypted data
      return iv.toString('hex') + ':' + encrypted;
    } catch (error) {
      // Fallback to base64 if crypto fails
      console.warn('Crypto encryption failed, using base64 fallback');
      return 'b64:' + Buffer.from(String(text)).toString('base64');
    }
  }

  decrypt(encryptedData) {
    try {
      if (!encryptedData || typeof encryptedData !== 'string') return null;
      
      // Handle base64 fallback
      if (encryptedData.startsWith('b64:')) {
        return Buffer.from(encryptedData.substring(4), 'base64').toString('utf8');
      }
      
      const parts = encryptedData.split(':');
      if (parts.length !== 2) return null;
      
      const iv = Buffer.from(parts[0], 'hex');
      const encrypted = parts[1];
      
      const key = crypto.scryptSync(this.encryptionKey.toString(), 'salt', 32);
      const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
      
      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      return decrypted;
    } catch (error) {
      console.error('Decryption error:', error);
      return null;
    }
  }

  // Simple encryption for less sensitive data (base64 with obfuscation)
  simpleEncrypt(text) {
    try {
      if (!text) return null;
      
      // Use simple base64 encoding with a basic XOR obfuscation
      const textBytes = Buffer.from(String(text), 'utf8');
      const keyBytes = Buffer.from(this.encryptionKey.substring(0, textBytes.length), 'utf8');
      
      const obfuscated = Buffer.alloc(textBytes.length);
      for (let i = 0; i < textBytes.length; i++) {
        obfuscated[i] = textBytes[i] ^ keyBytes[i % keyBytes.length];
      }
      
      return 'xor:' + obfuscated.toString('base64');
    } catch (error) {
      // Ultimate fallback
      return 'plain:' + Buffer.from(String(text)).toString('base64');
    }
  }

  simpleDecrypt(encryptedText) {
    try {
      if (!encryptedText || typeof encryptedText !== 'string') return null;
      
      if (encryptedText.startsWith('xor:')) {
        const obfuscated = Buffer.from(encryptedText.substring(4), 'base64');
        const keyBytes = Buffer.from(this.encryptionKey.substring(0, obfuscated.length), 'utf8');
        
        const original = Buffer.alloc(obfuscated.length);
        for (let i = 0; i < obfuscated.length; i++) {
          original[i] = obfuscated[i] ^ keyBytes[i % keyBytes.length];
        }
        
        return original.toString('utf8');
      }
      
      if (encryptedText.startsWith('plain:')) {
        return Buffer.from(encryptedText.substring(6), 'base64').toString('utf8');
      }
      
      // Legacy format without prefix
      return Buffer.from(encryptedText, 'base64').toString('utf8');
    } catch (error) {
      console.error('Simple decryption error:', error);
      return null;
    }
  }

  // JWT token encryption
  encryptJWTPayload(payload) {
    try {
      const jsonString = JSON.stringify(payload);
      return this.encrypt(jsonString);
    } catch (error) {
      console.error('JWT payload encryption error:', error);
      return null;
    }
  }

  decryptJWTPayload(encryptedPayload) {
    try {
      const decrypted = this.decrypt(encryptedPayload);
      return decrypted ? JSON.parse(decrypted) : null;
    } catch (error) {
      console.error('JWT payload decryption error:', error);
      return null;
    }
  }

  // Database field encryption
  encryptDatabaseField(value) {
    if (!value) return null;
    return this.encrypt(String(value));
  }

  decryptDatabaseField(encryptedValue) {
    return this.decrypt(encryptedValue);
  }

  // Generate secure random tokens
  generateSecureToken(length = 32) {
    return crypto.randomBytes(length).toString('hex');
  }

  // Encrypt object with specific field encryption
  encryptObject(obj, fieldsToEncrypt = []) {
    try {
      const result = { ...obj };
      
      fieldsToEncrypt.forEach(field => {
        if (result[field] !== undefined && result[field] !== null) {
          result[field] = this.encryptDatabaseField(result[field]);
        }
      });
      
      return result;
    } catch (error) {
      console.error('Object encryption error:', error);
      return obj;
    }
  }

  // Decrypt object with specific field decryption
  decryptObject(obj, fieldsToDecrypt = []) {
    try {
      const result = { ...obj };
      
      fieldsToDecrypt.forEach(field => {
        if (result[field] !== undefined && result[field] !== null) {
          const decrypted = this.decryptDatabaseField(result[field]);
          if (decrypted !== null) {
            result[field] = decrypted;
          }
        }
      });
      
      return result;
    } catch (error) {
      console.error('Object decryption error:', error);
      return obj;
    }
  }

  // Encrypt API request data
  encryptAPIRequest(data) {
    try {
      const jsonString = JSON.stringify(data);
      const encrypted = this.encrypt(jsonString);
      
      return {
        encrypted: true,
        data: encrypted,
        timestamp: Date.now()
      };
    } catch (error) {
      console.error('API request encryption error:', error);
      return data;
    }
  }

  // Decrypt API request data
  decryptAPIRequest(encryptedRequest) {
    try {
      if (!encryptedRequest.encrypted || !encryptedRequest.data) {
        return encryptedRequest;
      }
      
      const decrypted = this.decrypt(encryptedRequest.data);
      return decrypted ? JSON.parse(decrypted) : encryptedRequest;
    } catch (error) {
      console.error('API request decryption error:', error);
      return encryptedRequest;
    }
  }

  // Hash sensitive identifiers (for logging/debugging without exposure)
  hashIdentifier(identifier) {
    return crypto.createHash('sha256').update(String(identifier)).digest('hex').substring(0, 8);
  }

  // Validate encryption integrity
  validateEncryption(originalData, encryptedData) {
    try {
      const decrypted = this.decrypt(encryptedData);
      return decrypted === originalData;
    } catch (error) {
      return false;
    }
  }
}

// Create singleton instance
const encryptionService = new EncryptionService();

module.exports = encryptionService;
