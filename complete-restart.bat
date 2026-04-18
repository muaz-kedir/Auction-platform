@echo off
echo ========================================
echo   Complete System Restart
echo ========================================
echo.

echo [Step 1/6] Stopping all Node processes...
taskkill /F /IM node.exe >nul 2>&1
if %errorlevel% == 0 (
    echo    - Stopped Node processes
) else (
    echo    - No Node processes running
)
echo.

echo [Step 2/6] Stopping MongoDB...
taskkill /F /IM mongod.exe >nul 2>&1
echo    - MongoDB stop command sent
echo.

echo [Step 3/6] Starting MongoDB...
start /B mongod --dbpath C:\data\db >nul 2>&1
echo    - MongoDB starting...
timeout /t 5 /nobreak >nul
echo.

echo [Step 4/6] Testing MongoDB connection...
mongosh --eval "db.adminCommand('ping')" >nul 2>&1
if %errorlevel% == 0 (
    echo    [OK] MongoDB is running
) else (
    echo    [FAIL] MongoDB failed to start
    echo    Try running: start-mongodb-simple.bat
    pause
    exit /b 1
)
echo.

echo [Step 5/6] Seeding admin users...
cd backend
call node src/utils/seedAdmins.js
cd ..
echo.

echo [Step 6/6] Starting servers...
echo    - Starting backend in new window...
start "Backend Server" cmd /k "cd backend && npm start"
timeout /t 3 /nobreak >nul

echo    - Starting frontend in new window...
start "Frontend Server" cmd /k "cd frontend && npm run dev"
echo.

echo ========================================
echo   Restart Complete!
echo ========================================
echo.
echo Check the new windows for:
echo   Backend: "MongoDB Connected"
echo   Frontend: "Local: http://localhost:3000"
echo.
echo Then test login at: http://localhost:3000
echo   Email: superadmine@gmail.com
echo   Password: superadmine123
echo.
pause
