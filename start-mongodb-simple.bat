@echo off
echo ========================================
echo Starting MongoDB for Auction Platform
echo ========================================
echo.

REM Try to start MongoDB service first
echo Attempting to start MongoDB service...
net start MongoDB 2>nul

if %errorlevel% equ 0 (
    echo SUCCESS: MongoDB service started!
    echo.
    echo MongoDB is now running on mongodb://localhost:27017
    echo.
    echo Next steps:
    echo 1. The backend server will automatically connect
    echo 2. Run: cd backend
    echo 3. Run: node src/utils/seedAdmins.js
    echo 4. Go to http://localhost:3000/login
    echo.
    pause
    exit /b 0
)

echo.
echo Service start failed. Trying manual start...
echo.

REM If service fails, try manual start
cd /d "%ProgramFiles%\MongoDB\Server\8.2\bin"
if not exist mongod.exe (
    echo ERROR: MongoDB not found at expected location
    echo Please install MongoDB or update the path in this script
    pause
    exit /b 1
)

echo Starting MongoDB manually...
start "MongoDB Server" mongod.exe --dbpath "%ProgramFiles%\MongoDB\Server\8.2\data"

timeout /t 3 /nobreak >nul

echo.
echo MongoDB should now be running!
echo.
echo Next steps:
echo 1. Keep the MongoDB window open
echo 2. Run: cd backend
echo 3. Run: node src/utils/seedAdmins.js  
echo 4. Go to http://localhost:3000/login
echo.
pause
