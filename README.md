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

#### 📦 **Vercel** (Recommended for Frontend + Serverless API)
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
