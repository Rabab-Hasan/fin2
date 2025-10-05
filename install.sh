#!/bin/bash

echo "Installing Finance Dashboard..."
echo

echo "Installing backend dependencies..."
cd backend
npm install
if [ $? -ne 0 ]; then
    echo "Failed to install backend dependencies"
    exit 1
fi

echo
echo "Installing frontend dependencies..."
cd ../frontend
npm install
if [ $? -ne 0 ]; then
    echo "Failed to install frontend dependencies"
    exit 1
fi

echo
echo "Installation complete!"
echo
echo "Next steps:"
echo "1. Set up PostgreSQL database"
echo "2. Copy backend/.env.example to backend/.env and configure database settings"
echo "3. Run: npm run migrate (in backend directory)"
echo "4. Run: npm run dev (in backend directory)"
echo "5. Run: npm start (in frontend directory)"
echo
