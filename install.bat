@echo off
echo Installing Finance Dashboard...
echo.

echo Installing backend dependencies...
cd backend
call npm install
if errorlevel 1 (
    echo Failed to install backend dependencies
    pause
    exit /b 1
)

echo.
echo Installing frontend dependencies...
cd ..\frontend
call npm install
if errorlevel 1 (
    echo Failed to install frontend dependencies
    pause
    exit /b 1
)

echo.
echo Installation complete!
echo.
echo Next steps:
echo 1. Set up PostgreSQL database
echo 2. Copy backend\.env.example to backend\.env and configure database settings
echo 3. Run: npm run migrate (in backend directory)
echo 4. Run: npm run dev (in backend directory)
echo 5. Run: npm start (in frontend directory)
echo.
pause
