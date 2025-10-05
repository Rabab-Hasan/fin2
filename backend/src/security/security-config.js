const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cors = require('cors');
const https = require('https');
const fs = require('fs');
const path = require('path');

// Security middleware configuration
const securityConfig = {
  // Helmet configuration for security headers
  helmet: {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        imgSrc: ["'self'", "data:", "https:"],
        scriptSrc: ["'self'"],
        connectSrc: ["'self'", "https://api.finance-dashboard.com"],
        frameSrc: ["'none'"],
        objectSrc: ["'none'"],
        baseUri: ["'self'"],
        formAction: ["'self'"],
      },
    },
    crossOriginEmbedderPolicy: false,
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true
    }
  },

  // Rate limiting configuration
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: process.env.NODE_ENV === 'production' ? 100 : 1000, // Higher limit for development
    message: {
      error: 'Too many requests from this IP, please try again later.',
      retryAfter: '15 minutes'
    },
    standardHeaders: true,
    legacyHeaders: false,
  },

  // API Rate limiting (stricter)
  apiRateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes  
    max: process.env.NODE_ENV === 'production' ? 50 : 500, // Higher limit for development
    message: {
      error: 'API rate limit exceeded, please try again later.',
      retryAfter: '15 minutes'
    }
  },

  // CORS configuration
  cors: {
    origin: process.env.NODE_ENV === 'production' 
      ? ['https://finance-dashboard.com', 'https://www.finance-dashboard.com']
      : ['http://localhost:3000', 'http://127.0.0.1:3000', 'https://localhost:3000', 'https://127.0.0.1:3000'],
    credentials: true,
    optionsSuccessStatus: 200,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-API-Key', 'Access-Control-Allow-Origin'],
    preflightContinue: false
  }
};

// SSL/TLS configuration
const sslConfig = {
  // Generate self-signed certificates for development
  generateDevCertificates() {
    const forge = require('node-forge');
    
    // Generate a keypair
    console.log('🔐 Generating SSL certificates for development...');
    const keys = forge.pki.rsa.generateKeyPair(2048);
    
    // Create a certificate
    const cert = forge.pki.createCertificate();
    cert.publicKey = keys.publicKey;
    cert.serialNumber = '01';
    cert.validity.notBefore = new Date();
    cert.validity.notAfter = new Date();
    cert.validity.notAfter.setFullYear(cert.validity.notBefore.getFullYear() + 1);
    
    const attrs = [{
      name: 'commonName',
      value: 'localhost'
    }, {
      name: 'countryName',
      value: 'US'
    }, {
      shortName: 'ST',
      value: 'Virginia'
    }, {
      name: 'localityName',
      value: 'Blacksburg'
    }, {
      name: 'organizationName',
      value: 'Finance Dashboard'
    }, {
      shortName: 'OU',
      value: 'Development'
    }];
    
    cert.setSubject(attrs);
    cert.setIssuer(attrs);
    cert.sign(keys.privateKey);
    
    // Convert to PEM format
    const pem = {
      privateKey: forge.pki.privateKeyToPem(keys.privateKey),
      certificate: forge.pki.certificateToPem(cert)
    };
    
    // Save certificates
    const certDir = path.join(__dirname, '../certificates');
    if (!fs.existsSync(certDir)) {
      fs.mkdirSync(certDir, { recursive: true });
    }
    
    fs.writeFileSync(path.join(certDir, 'private-key.pem'), pem.privateKey);
    fs.writeFileSync(path.join(certDir, 'certificate.pem'), pem.certificate);
    
    console.log('✅ SSL certificates generated successfully');
    return {
      key: pem.privateKey,
      cert: pem.certificate
    };
  },

  // Get SSL credentials
  getSSLCredentials() {
    const certDir = path.join(__dirname, '../certificates');
    const keyPath = path.join(certDir, 'private-key.pem');
    const certPath = path.join(certDir, 'certificate.pem');
    
    try {
      // Try to read existing certificates
      if (fs.existsSync(keyPath) && fs.existsSync(certPath)) {
        return {
          key: fs.readFileSync(keyPath, 'utf8'),
          cert: fs.readFileSync(certPath, 'utf8')
        };
      }
    } catch (error) {
      console.warn('⚠️  Could not read SSL certificates:', error.message);
    }
    
    // Generate new certificates if not found
    return this.generateDevCertificates();
  }
};

// Security middleware setup function
function setupSecurity(app) {
  // Enable trust proxy for production
  if (process.env.NODE_ENV === 'production') {
    app.set('trust proxy', 1);
  }

  // Apply security headers
  app.use(helmet(securityConfig.helmet));

  // Apply CORS
  app.use(cors(securityConfig.cors));

  // Apply rate limiting to all routes
  app.use(rateLimit(securityConfig.rateLimit));

  // Apply stricter rate limiting to API routes
  app.use('/api/', rateLimit(securityConfig.apiRateLimit));

  // Force HTTPS in production
  if (process.env.NODE_ENV === 'production') {
    app.use((req, res, next) => {
      if (req.header('x-forwarded-proto') !== 'https') {
        res.redirect(`https://${req.header('host')}${req.url}`);
      } else {
        next();
      }
    });
  }

  // Security headers middleware
  app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
    next();
  });

  console.log('🛡️  Security middleware configured');
}

// HTTPS server creation
function createSecureServer(app) {
  const credentials = sslConfig.getSSLCredentials();
  const httpsServer = https.createServer(credentials, app);
  
  return httpsServer;
}

module.exports = {
  securityConfig,
  sslConfig,
  setupSecurity,
  createSecureServer
};