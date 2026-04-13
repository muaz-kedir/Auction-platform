@echo off
REM Start Development Servers Script for Windows

echo 🚀 Starting Online Auction Platform...
echo.

REM Check if .env files exist
if not exist "backend\.env" (
    echo ⚠️  Backend .env file not found!
    echo Please create it: cd backend && copy .env.example .env
    echo.
    pause
    exit /b 1
)

if not exist "frontend\.env" (
    echo ⚠️  Frontend .env file not found!
    echo Please create it: cd frontend && copy .env.example .env
    echo.
    pause
    exit /b 1
)

REM Check if MongoDB is running
echo 📦 Checking MongoDB connection...
net start | findstr /i "MongoDB" >nul
if errorlevel 1 (
    echo ⚠️  MongoDB service is not running!
    echo Please start MongoDB first. See MONGODB_SETUP.md for instructions.
    echo.
    echo To start MongoDB service, run: net start MongoDB
    echo.
    pause
)

REM Start Backend
echo.
echo 🔧 Starting Backend Server...
start "Backend Server" cmd /k "cd backend && npm start"

REM Wait for backend to start
timeout /t 3 /nobreak >nul

REM Start Frontend
echo.
echo 🎨 Starting Frontend Server...
start "Frontend Server" cmd /k "cd frontend && npm run dev"

echo.
echo ✅ Servers started!
echo.
echo 📍 Backend:  http://localhost:5000
echo 📍 Frontend: http://localhost:3000
echo.
echo Close the terminal windows to stop the servers
echo.
pause
