import CryptoJS from 'crypto-js';

// Encryption configuration
const ENCRYPTION_KEY = process.env.REACT_APP_ENCRYPTION_KEY || 'default-client-key-change-in-production';
const STORAGE_KEY_PREFIX = 'enc_';

class ClientEncryption {
  constructor() {
    // Warn if using default key
    if (!process.env.REACT_APP_ENCRYPTION_KEY) {
      console.warn('⚠️ Using default encryption key. Set REACT_APP_ENCRYPTION_KEY in production.');
    }
  }

  // Encrypt data for localStorage
  encryptForStorage(data) {
    try {
      const jsonString = JSON.stringify(data);
      const encrypted = CryptoJS.AES.encrypt(jsonString, ENCRYPTION_KEY).toString();
      return encrypted;
    } catch (error) {
      console.error('Storage encryption error:', error);
      return null;
    }
  }

  // Decrypt data from localStorage
  decryptFromStorage(encryptedData) {
    try {
      if (!encryptedData) return null;
      
      const bytes = CryptoJS.AES.decrypt(encryptedData, ENCRYPTION_KEY);
      const decryptedString = bytes.toString(CryptoJS.enc.Utf8);
      
      if (!decryptedString) {
        throw new Error('Failed to decrypt data');
      }
      
      return JSON.parse(decryptedString);
    } catch (error) {
      console.error('Storage decryption error:', error);
      return null;
    }
  }

  // Secure localStorage methods
  setSecureItem(key, value) {
    try {
      const encryptedValue = this.encryptForStorage(value);
      if (encryptedValue) {
        localStorage.setItem(STORAGE_KEY_PREFIX + key, encryptedValue);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Secure storage set error:', error);
      return false;
    }
  }

  getSecureItem(key) {
    try {
      const encryptedValue = localStorage.getItem(STORAGE_KEY_PREFIX + key);
      return this.decryptFromStorage(encryptedValue);
    } catch (error) {
      console.error('Secure storage get error:', error);
      return null;
    }
  }

  removeSecureItem(key) {
    try {
      localStorage.removeItem(STORAGE_KEY_PREFIX + key);
      return true;
    } catch (error) {
      console.error('Secure storage remove error:', error);
      return false;
    }
  }

  // Clear all encrypted items
  clearSecureStorage() {
    try {
      const keys = Object.keys(localStorage).filter(key => key.startsWith(STORAGE_KEY_PREFIX));
      keys.forEach(key => localStorage.removeItem(key));
      return true;
    } catch (error) {
      console.error('Clear secure storage error:', error);
      return false;
    }
  }

  // Encrypt API requests
  encryptAPIRequest(data) {
    try {
      const jsonString = JSON.stringify(data);
      const timestamp = Date.now().toString();
      const dataWithTimestamp = jsonString + '|' + timestamp;
      const encrypted = CryptoJS.AES.encrypt(dataWithTimestamp, ENCRYPTION_KEY).toString();
      return encrypted;
    } catch (error) {
      console.error('API request encryption error:', error);
      return null;
    }
  }

  // Decrypt API responses
  decryptAPIResponse(encryptedData) {
    try {
      if (!encryptedData) return null;
      
      const bytes = CryptoJS.AES.decrypt(encryptedData, ENCRYPTION_KEY);
      const decryptedString = bytes.toString(CryptoJS.enc.Utf8);
      
      const parts = decryptedString.split('|');
      if (parts.length < 2) {
        throw new Error('Invalid encrypted response format');
      }
      
      const timestamp = parseInt(parts.pop());
      const jsonString = parts.join('|');
      
      // Check if data is not too old (5 minutes)
      if (Date.now() - timestamp > 5 * 60 * 1000) {
        throw new Error('Encrypted response has expired');
      }
      
      return JSON.parse(jsonString);
    } catch (error) {
      console.error('API response decryption error:', error);
      return null;
    }
  }

  // Encrypt sensitive form data
  encryptFormData(formData, sensitiveFields = []) {
    try {
      const encrypted = { ...formData };
      
      sensitiveFields.forEach(field => {
        if (encrypted[field]) {
          encrypted[field] = CryptoJS.AES.encrypt(
            String(encrypted[field]), 
            ENCRYPTION_KEY
          ).toString();
        }
      });
      
      return encrypted;
    } catch (error) {
      console.error('Form data encryption error:', error);
      return formData;
    }
  }

  // Decrypt sensitive form data
  decryptFormData(encryptedFormData, sensitiveFields = []) {
    try {
      const decrypted = { ...encryptedFormData };
      
      sensitiveFields.forEach(field => {
        if (decrypted[field]) {
          try {
            const bytes = CryptoJS.AES.decrypt(decrypted[field], ENCRYPTION_KEY);
            decrypted[field] = bytes.toString(CryptoJS.enc.Utf8);
          } catch (fieldError) {
            console.warn(`Could not decrypt field ${field}:`, fieldError);
            // Keep original value if decryption fails
          }
        }
      });
      
      return decrypted;
    } catch (error) {
      console.error('Form data decryption error:', error);
      return encryptedFormData;
    }
  }

  // Generate secure random values
  generateSecureRandom(length = 16) {
    const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    const randomArray = new Uint8Array(length);
    window.crypto.getRandomValues(randomArray);
    
    for (let i = 0; i < length; i++) {
      result += charset[randomArray[i] % charset.length];
    }
    
    return result;
  }

  // Secure session token handling
  setSecureToken(token) {
    // Encrypt token before storing
    const encryptedToken = this.encryptForStorage({ token, timestamp: Date.now() });
    if (encryptedToken) {
      sessionStorage.setItem(STORAGE_KEY_PREFIX + 'auth_token', encryptedToken);
      return true;
    }
    return false;
  }

  getSecureToken() {
    const encryptedToken = sessionStorage.getItem(STORAGE_KEY_PREFIX + 'auth_token');
    const decryptedData = this.decryptFromStorage(encryptedToken);
    
    if (decryptedData && decryptedData.token) {
      // Check if token is not too old (24 hours)
      const tokenAge = Date.now() - decryptedData.timestamp;
      if (tokenAge < 24 * 60 * 60 * 1000) {
        return decryptedData.token;
      }
    }
    
    return null;
  }

  clearSecureToken() {
    sessionStorage.removeItem(STORAGE_KEY_PREFIX + 'auth_token');
  }
}

// Create singleton instance
const clientEncryption = new ClientEncryption();

export default clientEncryption;