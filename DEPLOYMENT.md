# 🌊 DigitalOcean App Platform Deployment Guide

## Quick Deployment Checklist

### Pre-Deployment
- [ ] Run `npm run deploy-check` to verify configuration
- [ ] Copy `.env.example` files to `.env` with production values
- [ ] Push all changes to your main branch
- [ ] Test locally with `npm run build && npm start`

### DigitalOcean Setup
- [ ] Create new app in App Platform
- [ ] Connect GitHub repository  
- [ ] Configure backend as Web Service
- [ ] Configure frontend as Static Site
- [ ] Set all environment variables
- [ ] Deploy and test

## Step-by-Step Deployment

### 1. Prepare Your Repository

```bash
# Clone your repository
git clone https://github.com/your-username/finance-dashboard.git
cd finance-dashboard

# Install dependencies and check configuration
npm run install-all
npm run deploy-check

# If any checks fail, fix them before proceeding
```

### 2. Configure Environment Variables

**Backend Environment Variables:**
Create `backend/.env` with these values:
```env
NODE_ENV=production
PORT=8080
JWT_SECRET=your-super-secure-jwt-secret-key-here
ENCRYPTION_KEY=your-32-character-encryption-key-here
FRONTEND_URL=https://your-frontend-app.ondigitalocean.app
ALLOWED_ORIGINS=https://your-frontend-app.ondigitalocean.app
DB_TYPE=sqlite
SQLITE_PATH=./data/finance_dashboard.db
SECURITY_LEVEL=production
```

**Frontend Environment Variables:**
Create `frontend/.env` with these values:
```env
REACT_APP_API_URL=https://your-backend-app.ondigitalocean.app
REACT_APP_ENVIRONMENT=production
GENERATE_SOURCEMAP=false
```

### 3. Create App in DigitalOcean

1. Go to [DigitalOcean App Platform](https://cloud.digitalocean.com/apps)
2. Click **"Create App"**
3. Choose **GitHub** source
4. Select your repository and **main** branch

### 4. Configure Backend Service

**Service Settings:**
- **Name:** `backend`
- **Type:** Web Service
- **Source Directory:** `/backend`
- **Build Command:** `npm install --production`
- **Run Command:** `npm start`
- **Instance Size:** Basic ($5/month)
- **Instance Count:** 1

**Environment Variables:**
Add all the backend environment variables listed above.

**HTTP Routes:**
- Path: `/api`
- Preserve path prefix: Yes

### 5. Configure Frontend Service

**Service Settings:**
- **Name:** `frontend`
- **Type:** Static Site
- **Source Directory:** `/frontend`
- **Build Command:** `npm install && npm run build`
- **Output Directory:** `build`
- **Instance Size:** Basic ($3/month)

**Environment Variables:**
Add all the frontend environment variables listed above.

**HTTP Routes:**
- Path: `/`
- Catchall: Yes (for React Router)

### 6. Deploy and Configure

1. Click **"Create Resources"**
2. Wait for deployment (5-10 minutes)
3. Note the generated URLs:
   - Backend: `https://backend-xxx.ondigitalocean.app`
   - Frontend: `https://frontend-xxx.ondigitalocean.app`

### 7. Update CORS Configuration

After deployment, update your environment variables with the actual URLs:

**Backend:**
```env
FRONTEND_URL=https://frontend-xxx.ondigitalocean.app
ALLOWED_ORIGINS=https://frontend-xxx.ondigitalocean.app
```

**Frontend:**
```env
REACT_APP_API_URL=https://backend-xxx.ondigitalocean.app
```

Redeploy after updating these variables.

## Database Options

### Option A: SQLite (Recommended for MVP)
- **Cost:** Free
- **Setup:** Already configured
- **Pros:** Simple, no additional services
- **Cons:** Data may be lost on container restarts

### Option B: DigitalOcean Managed PostgreSQL
- **Cost:** $15/month minimum
- **Setup:** Create database service in DigitalOcean
- **Pros:** Persistent, scalable, automatic backups
- **Cons:** Additional cost and complexity

To use PostgreSQL, add these backend environment variables:
```env
DB_TYPE=postgresql
DB_HOST=your-db-host.db.ondigitalocean.com
DB_PORT=25060
DB_NAME=defaultdb
DB_USERNAME=your-db-user
DB_PASSWORD=your-db-password
DB_SSL=true
```

## Custom Domain Setup

1. **Add Domain in App Platform:**
   - Go to Settings → Domains
   - Add your custom domain
   - Note the CNAME record provided

2. **Configure DNS:**
   ```
   Type: CNAME
   Name: @ (or subdomain)
   Value: [provided by DigitalOcean]
   ```

3. **Update Environment Variables:**
   ```env
   FRONTEND_URL=https://yourdomain.com
   ALLOWED_ORIGINS=https://yourdomain.com
   REACT_APP_API_URL=https://api.yourdomain.com
   ```

## Monitoring and Maintenance

### Application Logs
- Access logs through App Platform dashboard
- Monitor for errors and performance issues
- Set up log-based alerts

### Performance Monitoring
- Monitor CPU and memory usage
- Track response times and error rates
- Scale instances based on traffic

### Security Updates
- Regularly update dependencies
- Monitor security advisories
- Review and rotate secrets periodically

## Cost Optimization

**Basic Setup Cost:**
- Frontend (Static Site): $3/month
- Backend (Web Service): $5/month
- **Total:** $8/month

**With Database:**
- Add PostgreSQL: +$15/month
- **Total:** $23/month

**Scaling:**
- Pro instances: $12-24/month per service
- Auto-scaling available on Pro plans
- Additional bandwidth charges may apply

## Troubleshooting

### Common Issues

**Build Failures:**
```bash
# Check build logs in App Platform
# Verify all dependencies in package.json
# Ensure Node.js version compatibility
```

**CORS Errors:**
```bash
# Verify ALLOWED_ORIGINS matches frontend URL exactly
# Check for trailing slashes in URLs
# Ensure frontend and backend can communicate
```

**Environment Variable Issues:**
```bash
# Restart services after changing variables
# Check App Platform logs for missing variables
# Verify variable names match code expectations
```

**Database Connection Problems:**
```bash
# For SQLite: Ensure data directory exists and is writable
# For PostgreSQL: Verify connection string and credentials
# Check network connectivity and firewall rules
```

### Support Resources

- **DigitalOcean Documentation:** [App Platform Docs](https://docs.digitalocean.com/products/app-platform/)
- **Community Forum:** [DigitalOcean Community](https://www.digitalocean.com/community)
- **Support Tickets:** Available for paid accounts

## Production Checklist

**Before Going Live:**
- [ ] All environment variables set with strong secrets
- [ ] CORS properly configured for production domain
- [ ] Database backups configured (if using PostgreSQL)
- [ ] Custom domain configured with SSL
- [ ] Monitoring and alerting set up
- [ ] Error tracking implemented
- [ ] Performance testing completed
- [ ] Security review conducted
- [ ] Documentation updated for team

**Post-Deployment:**
- [ ] Verify all features work correctly
- [ ] Test user registration and authentication
- [ ] Validate file upload functionality
- [ ] Check API endpoints respond properly
- [ ] Monitor application performance
- [ ] Set up regular backup procedures
- [ ] Document any deployment-specific configurations

## Continuous Deployment

### Automatic Deployment
App Platform automatically deploys when you push to the connected branch:

```bash
# Make changes
git add .
git commit -m "Update feature"
git push origin main

# App Platform will automatically:
# 1. Pull latest code
# 2. Run build commands
# 3. Deploy new version
# 4. Health check new deployment
```

### Manual Deployment
You can also trigger deployments manually from the App Platform dashboard.

### Rollback Procedure
If deployment fails:
1. Go to App Platform dashboard
2. Click on the failed deployment
3. Choose "Rollback to previous version"
4. Investigate and fix the issue
5. Redeploy when ready

## Security Considerations

### Environment Variables
- Use strong, unique secrets for production
- Never commit `.env` files to version control
- Rotate secrets regularly
- Use DigitalOcean's SECRET type for sensitive values

### Network Security
- Enable HTTPS (automatic with App Platform)
- Configure proper CORS origins
- Use rate limiting for API endpoints
- Implement proper authentication

### Data Security
- Enable database field encryption
- Use secure database connections (SSL)
- Implement proper access controls
- Regular security audits

This guide should help you successfully deploy your Finance Dashboard to DigitalOcean App Platform. For additional support, consult the DigitalOcean documentation or reach out to their support team.