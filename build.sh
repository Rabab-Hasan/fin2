#!/bin/bash
# Render build script for Finance Dashboard

echo "🚀 Starting Render build process..."

# Install root dependencies
echo "📦 Installing root dependencies..."
npm install

# Rebuild SQLite3 for the target architecture
echo "🔧 Rebuilding SQLite3 for Linux..."
cd backend
npm rebuild sqlite3
cd ..

# Install frontend dependencies and build
echo "🎨 Building frontend..."
cd frontend
npm install
chmod +x node_modules/.bin/react-scripts
npm run build
cd ..

echo "✅ Build completed successfully!"