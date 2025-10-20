# Finance Dashboard

A comprehensive marketing data analysis and campaign management platform with AI-powered insights.

> **🚀 Latest Update**: Marketing Analysis Dashboard - Upload CSV files for comprehensive campaign performance analysis with hour-by-hour comparisons and AI insights!

## Features

- **Smart Data Import**: Excel/CSV import with header normalization and JSONB merge upserts
- **Flexible Schema**: Dynamic columns that automatically expand without migrations
- **Backup & Recovery**: Automated backup system with integrity checking
- **Real-time Analytics**: Dashboard with KPIs and strategic insights
- **Data Persistence**: PostgreSQL with JSONB for flexible data storage

## Architecture

### Backend (Node.js + Express + PostgreSQL)
- **Database**: PostgreSQL with JSONB for flexible data storage
- **Smart Upsert**: Header normalization with alias mapping
- **JSONB Merge**: Updates only overwrite provided fields, preserving existing data
- **Backup System**: Automated CSV backups with integrity checking
- **API Endpoints**: RESTful API for all CRUD operations

### Frontend (React + TypeScript + Tailwind)
- **React Query**: Data fetching and caching
- **React Router**: Client-side routing
- **Tailwind CSS**: Utility-first styling
- **File Upload**: Drag-and-drop Excel/CSV import
- **Real-time Updates**: Automatic data refresh

## Quick Start

### Prerequisites
- Node.js 16+
- PostgreSQL 12+

### Backend Setup
```bash
cd backend
npm install
npm run migrate  # Create database tables
npm run dev      # Start development server on port 3001
```

### Frontend Setup
```bash
cd frontend
npm install
npm start        # Start development server on port 3000
```

### Database Configuration
Set these environment variables or update `backend/src/database.js`:
```
DB_HOST=localhost
DB_PORT=5432
DB_NAME=finance_dashboard
DB_USER=postgres
DB_PASSWORD=password
```

## API Endpoints

### Reports
- `GET /api/reports` - Get all reports (with optional month filter)
- `POST /api/reports` - Create/update a report
- `DELETE /api/reports` - Clear all data
- `GET /api/reports/stats` - Dashboard statistics
- `GET /api/reports/rollups` - Monthly aggregates

### Import/Export
- `POST /api/import` - Import Excel/CSV file
- `GET /api/template.csv` - Download template CSV
- `GET /api/export/csv` - Export all data as CSV

### Backup
- `GET /api/backup/status` - Backup status and sizes
- `POST /api/backup/run` - Create backup
- `POST /api/backup/integrity` - Check data integrity
- `POST /api/backup/recover` - Recover from backup

### Columns
- `GET /api/columns` - Get dynamic columns
- `PUT /api/columns/:key` - Update column properties

## Smart Import Rules

### Header Normalization
1. Convert to lowercase and trim
2. Replace non-alphanumerics with underscores
3. Apply alias mapping:
   - `date`, `report date` → `report_date`
   - `registered onboarded` → `registered_onboarded`
   - etc.

### JSONB Merge Upsert
- **New dates**: Insert new record
- **Existing dates**: Merge only provided fields
- **Missing fields**: Preserve existing values
- **New columns**: Auto-register in columns_registry

### Data Coercion
- Numeric strings → numbers
- Empty strings → null
- Date formats: YYYY-MM-DD, DD/MM/YYYY, MM/DD/YYYY

## Pages

### Home (/)
- Welcome message and dashboard overview
- KPI cards: Total Records, Months Tracked, Strategic Notes
- Quick action buttons to Business Data and Action Labs
- Data persistence status with backup controls

### Business Data (/business)
- File import (Excel/CSV) with drag-and-drop
- Manual entry form for all metrics
- Data management: export, clear all

### Action Labs (/labs)
- **Data Entry Tab**: Filterable table with month selector
- **Strategy View Tab**: Charts and analytics
- Import/export capabilities
- Summary statistics

## Database Schema

### reports table
```sql
CREATE TABLE reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  report_date DATE UNIQUE NOT NULL,
  month_label TEXT,
  data JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### columns_registry table
```sql
CREATE TABLE columns_registry (
  key TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  first_seen_at TIMESTAMPTZ DEFAULT NOW(),
  last_seen_at TIMESTAMPTZ DEFAULT NOW(),
  display_order INTEGER
);
```

## Acceptance Criteria

✅ Home KPIs reflect database after imports  
✅ Import with new dates inserts rows  
✅ Import with existing dates updates only provided fields  
✅ New columns auto-register without migrations  
✅ Missing columns in import preserve existing values  
✅ Duplicate dates in same file - last row wins  
✅ Manual entry upserts correctly  
✅ Month filter shows correct subset  
✅ Export includes union of all dynamic columns  
✅ Backup system works with status updates  

## Technology Stack

**Backend:**
- Node.js + Express
- PostgreSQL with JSONB
- Multer (file uploads)
- XLSX + CSV parsing
- Moment.js (date handling)

**Frontend:**
- React 18 + TypeScript
- React Query (data fetching)
- React Router (routing)
- Tailwind CSS (styling)
- Lucide React (icons)

## Development

### Backend Development
```bash
cd backend
npm run dev     # Nodemon auto-restart
npm run migrate # Run database migrations
```

### Frontend Development
```bash
cd frontend
npm start       # React development server
npm run build   # Production build
```

### Environment Variables
```bash
# Backend
DB_HOST=localhost
DB_PORT=5432
DB_NAME=finance_dashboard
DB_USER=postgres
DB_PASSWORD=password
PORT=3001

# Frontend (via proxy in package.json)
REACT_APP_API_URL=http://localhost:3001
```

## 🚀 Deployment Options

### Quick Start (All Platforms)
```bash
# Install all dependencies
npm run install-all

# Development (runs both frontend and backend)
npm run dev

# Production build
npm run build
npm start
```

### Platform-Specific Deployment

#### 🌊 **DigitalOcean App Platform** (Recommended for Full-Stack Apps)

##### Project Structure for DigitalOcean
Ensure your repository follows this structure:
```
/finance-dashboard
  /frontend        # React frontend
    - package.json
    - .env.example
  /backend         # Node.js backend  
    - package.json
    - .env.example
  Procfile        # App Platform deployment configuration
  README.md
```

##### Step 1: Prepare Repository for Deployment
1. **Ensure all dependencies are properly listed** in respective `package.json` files
2. **Copy environment examples to production files**:
   ```bash
   # Backend
   cp backend/.env.example backend/.env
   # Frontend  
   cp frontend/.env.example frontend/.env
   ```
3. **Update environment variables** in both `.env` files with production values

##### Step 2: Create App on DigitalOcean App Platform
1. Go to [DigitalOcean App Platform](https://cloud.digitalocean.com/apps)
2. Click **"Create App"**
3. Choose **GitHub** and select your repository
4. Select the **main** branch for deployment

##### Step 3: Configure Backend (Node.js API)
**App Component Settings:**
- **Component Type**: Web Service
- **Source Directory**: `/backend`
- **Build Command**: `npm install --production`
- **Start Command**: `npm start`
- **Port**: `8080` (App Platform automatically sets PORT env var)

**Environment Variables for Backend:**
```env
NODE_ENV=production
JWT_SECRET=your-super-secure-jwt-secret-key-here
ENCRYPTION_KEY=your-32-character-encryption-key-here
FRONTEND_URL=https://your-frontend-app.ondigitalocean.app
ALLOWED_ORIGINS=https://your-frontend-app.ondigitalocean.app
DB_TYPE=sqlite
SQLITE_PATH=./data/finance_dashboard.db
UPLOAD_MAX_SIZE=10485760
SECURITY_LEVEL=production
```

##### Step 4: Configure Frontend (React Static Site)
**App Component Settings:**
- **Component Type**: Static Site
- **Source Directory**: `/frontend`  
- **Build Command**: `npm install && npm run build`
- **Output Directory**: `build`

**Environment Variables for Frontend:**
```env
REACT_APP_API_URL=https://your-backend-app.ondigitalocean.app
REACT_APP_ENVIRONMENT=production
GENERATE_SOURCEMAP=false
```

##### Step 5: Database Configuration
**Option A: SQLite (Recommended for Small to Medium Apps)**
- Uses local file storage within the backend container
- No additional database service needed
- Data persists across deploys in the `/data` directory

**Option B: DigitalOcean Managed PostgreSQL Database**
1. Create a PostgreSQL database in DigitalOcean
2. Add these environment variables to backend:
```env
DB_TYPE=postgresql
DB_HOST=your-db-host.db.ondigitalocean.com
DB_PORT=25060
DB_NAME=defaultdb
DB_USERNAME=your-db-user
DB_PASSWORD=your-db-password
DB_SSL=true
```

##### Step 6: Deploy and Configure
1. **Click "Create Resources"** - App Platform will build and deploy both components
2. **Wait for deployment** (usually 5-10 minutes)
3. **Get your app URLs**:
   - Backend API: `https://your-backend-app.ondigitalocean.app`
   - Frontend: `https://your-frontend-app.ondigitalocean.app`

##### Step 7: Update Cross-Origin Configuration
After deployment, update the environment variables with actual URLs:

**Backend Environment Variables:**
```env
FRONTEND_URL=https://your-actual-frontend.ondigitalocean.app
ALLOWED_ORIGINS=https://your-actual-frontend.ondigitalocean.app
```

**Frontend Environment Variables:**
```env
REACT_APP_API_URL=https://your-actual-backend.ondigitalocean.app
```

##### Step 8: Custom Domain (Optional)
1. Add your custom domain in App Platform settings
2. Update CORS settings with your custom domain
3. Configure DNS records as provided by DigitalOcean

##### Monitoring and Logs
- **Application Logs**: Available in the App Platform dashboard
- **Runtime Metrics**: CPU, Memory usage monitoring
- **Health Checks**: Automatic health monitoring
- **Scaling**: Auto-scaling based on traffic (paid plans)

##### Cost Optimization
- **Basic Plan**: $5-12/month per component
- **Pro Plan**: $12-24/month per component (includes auto-scaling)
- **Database**: $15/month for managed PostgreSQL (or use SQLite for free)

##### Troubleshooting Common Issues

**Build Failures:**
```bash
# Check build logs in App Platform dashboard
# Ensure all dependencies are in package.json
# Verify Node.js version compatibility
```

**CORS Errors:**
```bash
# Update ALLOWED_ORIGINS in backend .env
# Ensure frontend URL matches exactly
# No trailing slashes in URLs
```

**Database Connection Issues:**
```bash
# For SQLite: Ensure data directory exists
# For PostgreSQL: Verify connection string
# Check firewall settings for managed database
```

**Environment Variable Issues:**
```bash
# Ensure all required variables are set in App Platform
# Restart app after changing environment variables
# Check logs for missing variable errors
```

##### Production Checklist
- [ ] All environment variables set with production values
- [ ] Strong JWT_SECRET and ENCRYPTION_KEY generated
- [ ] CORS properly configured for frontend domain
- [ ] Database migrations run successfully
- [ ] File upload limits appropriate for production
- [ ] Monitoring and alerting configured
- [ ] Custom domain configured (if applicable)
- [ ] SSL certificates active
- [ ] Backup strategy in place (for important data)

#### 📦 **Vercel** (Frontend + Serverless API)
1. Connect your GitHub repo to Vercel
2. Set build command: `cd frontend && npm run build`
3. Set output directory: `frontend/build`
4. Add environment variables in Vercel dashboard

#### 🌐 **Netlify**
1. Connect GitHub repo
2. Build settings automatically detected from `netlify.toml`
3. Add environment variables in site settings

#### 🐳 **Docker** (Any Cloud Provider)
```bash
# Build and run with Docker
docker build -t finance-dashboard .
docker run -p 2345:2345 finance-dashboard

# Or use Docker Compose
docker-compose up -d
```

#### ☁️ **Heroku**
```bash
# Add buildpacks
heroku buildpacks:set heroku/nodejs
heroku buildpacks:add --index 1 heroku-community/multi-procfile

# Deploy
git push heroku main
```

#### 🖥️ **VPS/Server**
```bash
# Clone and setup
git clone <your-repo>
cd finance-dashboard
npm run install-all

# Build and start
npm run build
pm2 start backend/src/server.js --name finance-dashboard
```

### Environment Variables
Create `.env` files in both `frontend/` and `backend/` directories:

**Backend (.env):**
```env
PORT=2345
NODE_ENV=production
ENCRYPTION_KEY=your-secret-key
```

**Frontend (.env):**
```env
REACT_APP_API_URL=https://your-backend-url.com
```

### 🔧 Build Configuration
The project includes configurations for:
- ✅ **package.json** - Root project configuration
- ✅ **vercel.json** - Vercel deployment settings
- ✅ **netlify.toml** - Netlify build configuration  
- ✅ **Dockerfile** - Container deployment
- ✅ **docker-compose.yml** - Local development with Docker

### 📊 Features
- **Marketing Data Analysis** - Upload CSV files for comprehensive analysis
- **Hour-by-Hour Comparison** - Compare performance across different days for each hour
- **AI Campaign Assistant** - Ollama-powered insights from actual GFH data
- **Real-time Analytics** - Interactive dashboards and visualizations
- **Data Security** - Encrypted sensitive data storage
