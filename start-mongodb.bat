@echo off
echo Starting MongoDB Service...
net start MongoDB
if %errorlevel% equ 0 (
    echo MongoDB started successfully!
) else (
    echo Failed to start MongoDB. Please run this script as Administrator.
    echo Right-click on start-mongodb.bat and select "Run as administrator"
)
pause
