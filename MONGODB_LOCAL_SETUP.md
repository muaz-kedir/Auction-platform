# Local MongoDB Setup Guide

## Current Issue
MongoDB is installed on your system but not running. The backend is trying to connect to `mongodb://127.0.0.1:27017/auction_db` but getting connection refused.

## Solution: Start MongoDB Service

### Option 1: Using the Batch Script (Recommended)
1. Right-click on `start-mongodb.bat` in the project root
2. Select "Run as administrator"
3. MongoDB will start automatically

### Option 2: Manual Start (Command Prompt as Admin)
1. Press `Win + X` and select "Command Prompt (Admin)" or "PowerShell (Admin)"
2. Run: `net start MongoDB`
3. You should see: "The MongoDB Server (MongoDB) service was started successfully."

### Option 3: Using Services Manager
1. Press `Win + R`
2. Type `services.msc` and press Enter
3. Find "MongoDB Server (MongoDB)" in the list
4. Right-click and select "Start"

### Option 4: Using MongoDB Compass
1. Open MongoDB Compass
2. It will automatically start the MongoDB service
3. Connect to `mongodb://localhost:27017`

## Verify MongoDB is Running

After starting MongoDB, check the status:
```powershell
Get-Service -Name MongoDB
```

You should see:
```
Status   Name               DisplayName
------   ----               -----------
Running  MongoDB            MongoDB Server (MongoDB)
```

## After Starting MongoDB

1. The backend server will automatically connect
2. You'll see "MongoDB Connected" in the backend terminal
3. You can now seed the admin accounts:
   ```bash
   cd backend
   npm run seed:admins
   ```

## Create Admin Accounts

Once MongoDB is running, create the admin accounts:
```bash
cd backend
node src/utils/seedAdmins.js
```

This will create:
- **Super Admin**: superadmine@gmail.com / superadmine123
- **Admin**: admin@gmail.com / admin123

## Test the Application

1. Go to http://localhost:3000/login
2. Login with admin credentials
3. You should be redirected to the dashboard

## Troubleshooting

### MongoDB Won't Start
- Make sure MongoDB is properly installed
- Check if another instance is running on port 27017
- Try restarting your computer

### Still Getting Connection Errors
- Verify MongoDB is running: `Get-Service -Name MongoDB`
- Check the port: MongoDB should be on 27017
- Restart the backend server after starting MongoDB

### Alternative: Use MongoDB Atlas
If local MongoDB continues to have issues, you can switch back to MongoDB Atlas:
1. Edit `backend/.env`
2. Uncomment the Atlas connection string
3. Comment out the local connection string
4. Make sure your IP is whitelisted in MongoDB Atlas

## Current Configuration

**Database**: `auction_db`
**Connection String**: `mongodb://127.0.0.1:27017/auction_db`
**Location**: `backend/.env`
