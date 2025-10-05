@echo off
echo Starting Finance Dashboard Development Servers...
echo.

echo Starting backend server...
start "Backend Server" cmd /k "cd backend && npm run dev"
timeout /t 3

echo Starting frontend server...
start "Frontend Server" cmd /k "cd frontend && npm start"

echo.
echo Development servers starting...
echo Backend: http://localhost:3001
echo Frontend: http://localhost:3000
echo.
echo Press any key to close this window (servers will continue running)
pause
