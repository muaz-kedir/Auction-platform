@echo off
echo ========================================
echo   MongoDB Connection Fix Script
echo ========================================
echo.

echo [1/5] Stopping any running Node processes...
taskkill /F /IM node.exe 2>nul
if %errorlevel% == 0 (
    echo    - Node processes stopped
) else (
    echo    - No Node processes running
)
echo.

echo [2/5] Starting MongoDB...
call start-mongodb-simple.bat
echo    - MongoDB start command sent
echo.

echo [3/5] Waiting for MongoDB to initialize...
timeout /t 5 /nobreak >nul
echo    - Wait complete
echo.

echo [4/5] Testing MongoDB connection...
mongosh --eval "db.adminCommand('ping')" >nul 2>&1
if %errorlevel% == 0 (
    echo    - MongoDB is running! [OK]
) else (
    echo    - MongoDB connection failed [ERROR]
    echo    - Please start MongoDB manually
    pause
    exit /b 1
)
echo.

echo [5/5] Starting backend server...
cd backend
start "Backend Server" cmd /k "npm start"
echo    - Backend server starting in new window
echo.

echo ========================================
echo   Fix Complete!
echo ========================================
echo.
echo Check the "Backend Server" window for:
echo   - "Server running on port 5000"
echo   - "MongoDB Connected"
echo.
echo If you see these messages, the fix worked!
echo.
pause
