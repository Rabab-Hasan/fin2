// Secure API client with encryption support
import clientEncryption from './encryption.js';

// Use Render backend for production, localhost for development
const API_BASE = process.env.REACT_APP_API_URL || 'https://fin2-4.onrender.com';
console.log('🔗 API Base URL:', API_BASE);
console.log('🔗 Environment:', process.env.NODE_ENV);
console.log('🔗 React App API URL:', process.env.REACT_APP_API_URL);

class SecureApiClient {
  constructor() {
    this.baseURL = API_BASE;
    this.defaultHeaders = {
      'Content-Type': 'application/json',
    };
  }

  // Get auth token from secure storage
  getAuthToken() {
    return clientEncryption.getSecureToken();
  }

  // Set auth token in secure storage
  setAuthToken(token) {
    return clientEncryption.setSecureToken(token);
  }

  // Clear auth token
  clearAuthToken() {
    clientEncryption.clearSecureToken();
  }

  // Build headers with auth token
  buildHeaders(additionalHeaders = {}) {
    const headers = { ...this.defaultHeaders, ...additionalHeaders };
    
    const token = this.getAuthToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    return headers;
  }

  // Make secure API request
  async makeRequest(endpoint, options = {}) {
    try {
      const url = `${this.baseURL}${endpoint}`;
      const config = {
        ...options,
        headers: this.buildHeaders(options.headers),
      };

      // Encrypt sensitive request data
      if (config.body && options.encrypt !== false) {
        const bodyData = typeof config.body === 'string' ? JSON.parse(config.body) : config.body;
        
        // Check if this is sensitive data that should be encrypted
        if (this.isSensitiveData(bodyData, endpoint)) {
          const encryptedData = clientEncryption.encryptAPIRequest(bodyData);
          config.body = JSON.stringify(encryptedData);
          config.headers['X-Encrypted'] = 'true';
        }
      }

      const response = await fetch(url, config);
      
      // Handle response
      const contentType = response.headers.get('content-type');
      
      if (!response.ok) {
        const errorData = contentType?.includes('application/json') 
          ? await response.json() 
          : { error: `HTTP ${response.status}`, message: await response.text() };
        
        throw new Error(errorData.error || errorData.message || 'Request failed');
      }

      // Parse response data
      if (contentType?.includes('application/json')) {
        const data = await response.json();
        
        // Decrypt response if it was encrypted
        const isEncrypted = response.headers.get('X-Encrypted') === 'true';
        if (isEncrypted && data.encrypted) {
          return clientEncryption.decryptAPIResponse(data);
        }
        
        return data;
      }

      return response;
    } catch (error) {
      console.error(`API request failed for ${endpoint}:`, error);
      throw error;
    }
  }

  // Check if data contains sensitive information that should be encrypted
  isSensitiveData(data, endpoint) {
    const sensitiveEndpoints = [
      '/auth/register',
      '/auth/create-user',
      '/clients',
      '/campaigns',
      '/user-preferences'
    ];
    
    // Exclude login from automatic encryption to prevent double encryption

    const sensitiveFields = ['password', 'email', 'name', 'phone', 'address', 'financial_data'];
    
    // Always encrypt auth-related endpoints
    if (sensitiveEndpoints.some(pattern => endpoint.includes(pattern))) {
      return true;
    }

    // Check if data contains sensitive fields
    if (data && typeof data === 'object') {
      return sensitiveFields.some(field => data.hasOwnProperty(field));
    }

    return false;
  }

  // GET request
  async get(endpoint, options = {}) {
    return this.makeRequest(endpoint, {
      method: 'GET',
      ...options,
    });
  }

  // POST request
  async post(endpoint, data, options = {}) {
    return this.makeRequest(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
      ...options,
    });
  }

  // PUT request
  async put(endpoint, data, options = {}) {
    return this.makeRequest(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
      ...options,
    });
  }

  // PATCH request
  async patch(endpoint, data, options = {}) {
    return this.makeRequest(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(data),
      ...options,
    });
  }

  // DELETE request
  async delete(endpoint, options = {}) {
    return this.makeRequest(endpoint, {
      method: 'DELETE',
      ...options,
    });
  }

  // Login with encrypted credentials
  async login(email, password) {
    try {
      // Send plain credentials - let the backend handle encryption
      // The password will be hashed securely on the server side
      const credentials = { email, password };

      const response = await this.post('/auth/login', credentials, { encrypt: false });
      
      if (response.token) {
        this.setAuthToken(response.token);
      }
      
      return response;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  // Logout
  async logout() {
    try {
      this.clearAuthToken();
      // Clear all encrypted storage on logout for security
      clientEncryption.clearSecureStorage();
      return true;
    } catch (error) {
      console.error('Logout error:', error);
      return false;
    }
  }

  // Health check
  async healthCheck() {
    try {
      return await this.get('/health');
    } catch (error) {
      console.error('Health check failed:', error);
      throw error;
    }
  }

  // Secure user preferences
  async getUserPreferences() {
    try {
      const response = await this.get('/user-preferences');
      
      // Store preferences securely on client-side
      clientEncryption.setSecurePreferences(response.preferences);
      
      return response;
    } catch (error) {
      console.error('Get user preferences error:', error);
      throw error;
    }
  }

  async updateUserPreferences(preferences) {
    try {
      const response = await this.put('/user-preferences', preferences);
      
      // Update secure client-side storage
      clientEncryption.setSecurePreferences(preferences);
      
      return response;
    } catch (error) {
      console.error('Update user preferences error:', error);
      throw error;
    }
  }
}

// Create and export singleton instance
const secureApiClient = new SecureApiClient();
export default secureApiClient;
