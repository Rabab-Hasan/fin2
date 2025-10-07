// Frontend encryption utilities using crypto-js
import CryptoJS from 'crypto-js';

// Storage prefix to identify encrypted items
const STORAGE_KEY_PREFIX = 'enc_';
const ENCRYPTION_KEY = process.env.REACT_APP_ENCRYPTION_KEY || 'finance-dashboard-frontend-key-32';

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
      const encrypted = CryptoJS.AES.encrypt(jsonString, ENCRYPTION_KEY).toString();
      
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

  // Decrypt API responses
  decryptAPIResponse(encryptedData) {
    try {
      if (!encryptedData || !encryptedData.encrypted) {
        return encryptedData;
      }
      
      const bytes = CryptoJS.AES.decrypt(encryptedData.data, ENCRYPTION_KEY);
      const decryptedString = bytes.toString(CryptoJS.enc.Utf8);
      
      return JSON.parse(decryptedString);
    } catch (error) {
      console.error('API response decryption error:', error);
      return encryptedData;
    }
  }

  // Encrypt sensitive form data
  encryptFormData(formData, sensitiveFields = []) {
    try {
      const result = { ...formData };
      
      sensitiveFields.forEach(field => {
        if (result[field] !== undefined && result[field] !== null) {
          result[field] = CryptoJS.AES.encrypt(String(result[field]), ENCRYPTION_KEY).toString();
        }
      });
      
      return result;
    } catch (error) {
      console.error('Form data encryption error:', error);
      return formData;
    }
  }

  // Decrypt sensitive form data
  decryptFormData(encryptedFormData, sensitiveFields = []) {
    try {
      const result = { ...encryptedFormData };
      
      sensitiveFields.forEach(field => {
        if (result[field] !== undefined && result[field] !== null) {
          try {
            const bytes = CryptoJS.AES.decrypt(result[field], ENCRYPTION_KEY);
            const decrypted = bytes.toString(CryptoJS.enc.Utf8);
            if (decrypted) {
              result[field] = decrypted;
            }
          } catch (fieldError) {
            console.warn(`Failed to decrypt field ${field}:`, fieldError);
          }
        }
      });
      
      return result;
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

  // Validate client-side encryption
  validateEncryption(originalData, encryptedData) {
    try {
      const decrypted = this.decryptFromStorage(encryptedData);
      return JSON.stringify(decrypted) === JSON.stringify(originalData);
    } catch (error) {
      return false;
    }
  }

  // Hash sensitive data for client-side logging (without exposing actual values)
  hashForLogging(data) {
    try {
      const hash = CryptoJS.SHA256(String(data)).toString();
      return hash.substring(0, 8); // First 8 characters only
    } catch (error) {
      return 'hash_error';
    }
  }

  // Encrypt user preferences and settings
  setSecurePreferences(preferences) {
    return this.setSecureItem('user_preferences', preferences);
  }

  getSecurePreferences() {
    return this.getSecureItem('user_preferences');
  }

  // Encrypt client selection
  setSecureClientSelection(clientData) {
    return this.setSecureItem('selected_client', clientData);
  }

  getSecureClientSelection() {
    return this.getSecureItem('selected_client');
  }

  // Clear all user-specific encrypted data on logout
  clearUserData() {
    this.clearSecureToken();
    this.removeSecureItem('user_preferences');
    this.removeSecureItem('selected_client');
    this.removeSecureItem('user_data');
  }
}

// Create and export singleton instance
const clientEncryption = new ClientEncryption();
export default clientEncryption;
