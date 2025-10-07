const encryption = require('../utils/encryption');

// Middleware to decrypt incoming encrypted requests
const decryptRequest = (req, res, next) => {
  try {
    // Check if request is marked as encrypted
    const isEncrypted = req.headers['x-encrypted'] === 'true';
    
    if (isEncrypted && req.body && req.body.encrypted) {
      console.log('🔓 Decrypting incoming request...');
      const decryptedData = encryption.decryptAPIRequest(req.body);
      req.body = decryptedData;
      console.log('✅ Request decrypted successfully');
    }
    
    next();
  } catch (error) {
    console.error('❌ Request decryption error:', error);
    return res.status(400).json({ error: 'Invalid encrypted request' });
  }
};

// Middleware to encrypt outgoing responses for sensitive data
const encryptResponse = (sensitiveEndpoints = []) => {
  return (req, res, next) => {
    // Check if this endpoint should encrypt responses
    const shouldEncrypt = sensitiveEndpoints.some(pattern => 
      req.path.includes(pattern) || req.originalUrl.includes(pattern)
    );
    
    if (!shouldEncrypt) {
      return next();
    }

    // Store original res.json
    const originalJson = res.json;
    
    res.json = function(data) {
      try {
        // Check if client requested encrypted response
        const clientAcceptsEncryption = req.headers['accept-encryption'] === 'true';
        
        if (clientAcceptsEncryption && data && typeof data === 'object') {
          console.log('🔒 Encrypting outgoing response...');
          const encryptedData = encryption.encryptAPIRequest(data);
          
          res.setHeader('X-Encrypted', 'true');
          return originalJson.call(this, encryptedData);
        }
        
        return originalJson.call(this, data);
      } catch (error) {
        console.error('❌ Response encryption error:', error);
        return originalJson.call(this, data);
      }
    };
    
    next();
  };
};

// Middleware to handle encrypted form data
const decryptFormData = (sensitiveFields = []) => {
  return (req, res, next) => {
    try {
      if (req.body && typeof req.body === 'object') {
        sensitiveFields.forEach(field => {
          if (req.body[field] && typeof req.body[field] === 'string') {
            // Try to decrypt the field
            const decrypted = encryption.decrypt(req.body[field]);
            if (decrypted !== null) {
              req.body[field] = decrypted;
            }
          }
        });
      }
      next();
    } catch (error) {
      console.error('❌ Form data decryption error:', error);
      next(); // Continue even if decryption fails
    }
  };
};

// Security headers middleware
const securityHeaders = (req, res, next) => {
  // Set security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'geolocation=(), camera=(), microphone=()');
  
  // Add HSTS in production
  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
  
  next();
};

// Rate limiting for sensitive endpoints
const createRateLimiter = (windowMs = 15 * 60 * 1000, max = 5) => {
  const requests = new Map();
  
  return (req, res, next) => {
    const ip = req.ip || req.connection.remoteAddress;
    const now = Date.now();
    
    // Clean old entries
    for (const [key, value] of requests.entries()) {
      if (now - value.firstRequest > windowMs) {
        requests.delete(key);
      }
    }
    
    const userRequests = requests.get(ip) || { count: 0, firstRequest: now };
    
    if (userRequests.count >= max) {
      return res.status(429).json({ error: 'Too many requests' });
    }
    
    userRequests.count++;
    requests.set(ip, userRequests);
    
    next();
  };
};

// Log security events
const logSecurityEvent = (eventType, details = {}) => {
  const logEntry = {
    timestamp: new Date().toISOString(),
    type: eventType,
    details: {
      ...details,
      // Hash sensitive information
      ip: details.ip ? encryption.hashIdentifier(details.ip) : undefined,
      email: details.email ? encryption.hashIdentifier(details.email) : undefined
    }
  };
  
  console.log('🔒 Security Event:', JSON.stringify(logEntry));
};

// Authentication logging middleware
const logAuthentication = (req, res, next) => {
  // Store original methods
  const originalJson = res.json;
  const startTime = Date.now();
  
  res.json = function(data) {
    const duration = Date.now() - startTime;
    
    // Log authentication attempts
    if (req.path.includes('/login') || req.path.includes('/register')) {
      const success = res.statusCode < 400;
      
      logSecurityEvent(success ? 'AUTH_SUCCESS' : 'AUTH_FAILURE', {
        ip: req.ip,
        email: req.body?.email,
        endpoint: req.path,
        duration: duration,
        statusCode: res.statusCode
      });
    }
    
    return originalJson.call(this, data);
  };
  
  next();
};

module.exports = {
  decryptRequest,
  encryptResponse,
  decryptFormData,
  securityHeaders,
  createRateLimiter,
  logSecurityEvent,
  logAuthentication
};