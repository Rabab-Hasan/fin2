import clientEncryption from './encryption';

class SecureApiClient {
  constructor() {
    this.baseURL = process.env.REACT_APP_API_URL || 'https://localhost:2346/api';
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
      const headers = this.buildHeaders(options.headers);
      
      let body = options.body;
      
      // Encrypt request body if it's a POST/PUT/PATCH with data
      if (body && ['POST', 'PUT', 'PATCH'].includes(options.method?.toUpperCase())) {
        const encryptedData = clientEncryption.encryptAPIRequest(body);
        if (encryptedData) {
          body = JSON.stringify({ encrypted: encryptedData });
          headers['X-Encrypted-Request'] = 'true';
        } else {
          body = JSON.stringify(body);
        }
      }

      const response = await fetch(url, {
        ...options,
        headers,
        body,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const responseData = await response.json();

      // Check if response is encrypted
      if (response.headers.get('X-Encrypted-Response') === 'true' && responseData.encrypted) {
        const decryptedData = clientEncryption.decryptAPIResponse(responseData.encrypted);
        if (decryptedData) {
          return decryptedData;
        }
      }

      return responseData;
    } catch (error) {
      console.error('Secure API request error:', error);
      throw error;
    }
  }

  // GET request
  async get(endpoint, options = {}) {
    return this.makeRequest(endpoint, {
      ...options,
      method: 'GET',
    });
  }

  // POST request
  async post(endpoint, data, options = {}) {
    return this.makeRequest(endpoint, {
      ...options,
      method: 'POST',
      body: data,
    });
  }

  // PUT request
  async put(endpoint, data, options = {}) {
    return this.makeRequest(endpoint, {
      ...options,
      method: 'PUT',
      body: data,
    });
  }

  // PATCH request
  async patch(endpoint, data, options = {}) {
    return this.makeRequest(endpoint, {
      ...options,
      method: 'PATCH',
      body: data,
    });
  }

  // DELETE request
  async delete(endpoint, options = {}) {
    return this.makeRequest(endpoint, {
      ...options,
      method: 'DELETE',
    });
  }

  // Login with encrypted credentials
  async login(email, password) {
    try {
      // Encrypt credentials before sending
      const credentials = clientEncryption.encryptFormData(
        { email, password },
        ['password']
      );

      const response = await this.post('/auth/login', credentials);
      
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
}

// Create singleton instance
const secureApiClient = new SecureApiClient();

export default secureApiClient;