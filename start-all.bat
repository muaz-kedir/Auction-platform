@echo off
echo ========================================
echo Starting Auction Platform
echo ========================================
echo.

echo Step 1: Starting MongoDB...
start "MongoDB" cmd /k "mongod --dbpath C:\data\db"
timeout /t 3 /nobreak > nul

echo Step 2: Starting Backend Server...
start "Backend Server" cmd /k "cd backend && npm start"
timeout /t 5 /nobreak > nul

echo Step 3: Starting Frontend Server...
start "Frontend Server" cmd /k "cd frontend && npm run dev"

echo.
echo ========================================
echo All servers started!
echo ========================================
echo.
echo MongoDB: Running in background
echo Backend: http://localhost:5000
echo Frontend: http://localhost:3000
echo.
echo Press any key to close this window...
pause > nul
