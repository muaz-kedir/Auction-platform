@echo off
echo ========================================
echo   Backend Connection Test
echo ========================================
echo.

echo [Test 1] Checking if MongoDB is running...
mongosh --eval "db.adminCommand('ping')" >nul 2>&1
if %errorlevel% == 0 (
    echo    [OK] MongoDB is running
) else (
    echo    [FAIL] MongoDB is NOT running
    echo    Run: start-mongodb-simple.bat
    pause
    exit /b 1
)
echo.

echo [Test 2] Checking if backend is responding...
curl -s http://localhost:5000/api/auctions >nul 2>&1
if %errorlevel% == 0 (
    echo    [OK] Backend is responding
) else (
    echo    [FAIL] Backend is NOT responding
    echo    Make sure backend is running: cd backend ^&^& npm start
    pause
    exit /b 1
)
echo.

echo [Test 3] Testing login API...
curl -X POST http://localhost:5000/api/auth/login -H "Content-Type: application/json" -d "{\"email\":\"superadmine@gmail.com\",\"password\":\"superadmine123\"}" > test-response.txt 2>&1
findstr /C:"token" test-response.txt >nul 2>&1
if %errorlevel% == 0 (
    echo    [OK] Login API works
    type test-response.txt
) else (
    echo    [FAIL] Login API failed
    echo    Response:
    type test-response.txt
    echo.
    echo    Try seeding database: cd backend ^&^& node src/utils/seedAdmins.js
)
del test-response.txt
echo.

echo ========================================
echo   Test Complete
echo ========================================
pause
