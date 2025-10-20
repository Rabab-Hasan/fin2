# Deployment Guide - Backend and Frontend Separation

## Problem
The frontend is trying to connect to `localhost:2345` which doesn't exist in production. You need to deploy the backend separately and configure the frontend to use the correct backend URL.

## Solution Steps

### 1. Deploy Backend to Render.com

1. **Create a new Render service** for the backend:
   - Go to Render.com dashboard
   - Click "New +"
   - Choose "Web Service"
   - Connect your GitHub repository
   - Set the following:
     - **Name**: `finance-dashboard-backend`
     - **Runtime**: Node
     - **Build Command**: `cd backend && npm install && npm rebuild sqlite3`
     - **Start Command**: `cd backend && npm start`
     - **Root Directory**: Leave blank (use root of repo)

2. **Set Environment Variables** in Render:
   ```
   NODE_ENV=production
   PORT=10000
   JWT_SECRET=(auto-generate)
   ENCRYPTION_KEY=(auto-generate)
   API_SECRET_KEY=(auto-generate)
   MONGODB_URI=mongodb+srv://rhasan:GlassDoor2025@cluster0.tj04exd.mongodb.net/genius_db?retryWrites=true&w=majority&appName=Cluster0
   ```

3. **Note your backend URL** after deployment (e.g., `https://finance-dashboard-backend.onrender.com`)

### 2. Update Frontend Environment Variables

Your frontend `.env.production` file has been updated to point to:
```
REACT_APP_API_URL=https://finance-dashboard-backend.onrender.com
```

**IMPORTANT**: Replace `finance-dashboard-backend` with your actual Render service name.

### 3. Redeploy Frontend

After the backend is deployed and you have the correct URL:

1. **Update the URL** in both files:
   - `frontend/.env.production`
   - `netlify.toml`

2. **Redeploy your frontend** on Netlify (it will automatically use the new environment variable)

### 4. Alternative: Use Environment Variables in Netlify

Instead of hardcoding in netlify.toml, you can set environment variables directly in Netlify:

1. Go to Netlify dashboard → Site settings → Environment variables
2. Add: `REACT_APP_API_URL` = `https://your-backend-url.onrender.com`

## Quick Test Commands

### Test Backend Health (replace with your backend URL):
```bash
curl https://finance-dashboard-backend.onrender.com/api/health
```

### Test Frontend Build Locally:
```bash
cd frontend
npm run build
npm run serve
```

## Files Modified:
- ✅ `frontend/.env.production` - Production API URL
- ✅ `netlify.toml` - Build environment variable
- ✅ `backend-render.yaml` - Backend deployment config

## Next Steps:
1. Deploy backend using the backend-render.yaml configuration
2. Update the API URLs with your actual backend URL
3. Redeploy frontend on Netlify
4. Test login functionality