# Start MongoDB Service
Write-Host "Starting MongoDB Service..." -ForegroundColor Yellow

try {
    Start-Service -Name MongoDB -ErrorAction Stop
    Write-Host "SUCCESS: MongoDB service started!" -ForegroundColor Green
    Write-Host ""
    Write-Host "MongoDB is now running on mongodb://localhost:27017" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Yellow
    Write-Host "1. Wait 2-3 seconds for backend to connect"
    Write-Host "2. Run: cd backend"
    Write-Host "3. Run: node src/utils/seedAdmins.js"
    Write-Host "4. Go to http://localhost:3000/login"
    Write-Host ""
} catch {
    Write-Host "ERROR: Failed to start MongoDB service" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please run this script as Administrator:" -ForegroundColor Yellow
    Write-Host "Right-click on start-mongodb.ps1 and select 'Run with PowerShell as Administrator'" -ForegroundColor Yellow
}

Read-Host "Press Enter to exit"
