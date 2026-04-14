# How to Start MongoDB and Fix the Connection Issue

## Quick Fix (Choose ONE method)

### Method 1: Start MongoDB Service (Easiest)
1. Open **Command Prompt as Administrator**
   - Press `Win + X`
   - Click "Command Prompt (Admin)" or "Windows PowerShell (Admin)"

2. Run this command:
   ```cmd
   net start MongoDB
   ```

3. You should see: "The MongoDB Server (MongoDB) service was started successfully."

### Method 2: Start MongoDB Manually
1. Open **Command Prompt as Administrator**

2. Run:
   ```cmd
   mongod --dbpath "C:\Program Files\MongoDB\Server\8.2\data"
   ```
   
   Or if that doesn't work:
   ```cmd
   mongod
   ```

3. Leave this window open (MongoDB is running)

### Method 3: Using MongoDB Compass
1. Open **MongoDB Compass** application
2. Connect to `mongodb://localhost:27017`
3. This will automatically start MongoDB

## After MongoDB is Running

### Step 1: Restart Backend Server
The backend server should automatically connect once MongoDB is running.

### Step 2: Seed Admin Accounts
Open a new terminal in the project folder and run:
```bash
cd backend
node src/utils/seedAdmins.js
```

This will create:
- **Super Admin**: superadmine@gmail.com / superadmine123
- **Admin**: admin@gmail.com / admin123

### Step 3: Test Login
1. Go to http://localhost:3000/login
2. Enter admin credentials
3. Click "Sign In"
4. You should be redirected to the dashboard!

## Verify MongoDB is Running

Run this in PowerShell:
```powershell
Get-Service -Name MongoDB
```

Should show:
```
Status   Name      DisplayName
------   ----      -----------
Running  MongoDB   MongoDB Server (MongoDB)
```

## Troubleshooting

### "Access is denied" Error
- You need to run Command Prompt as Administrator
- Right-click Command Prompt and select "Run as administrator"

### "Service not found" Error
- MongoDB might not be installed as a service
- Use Method 2 (Start MongoDB Manually) instead

### Port 27017 Already in Use
- Another MongoDB instance might be running
- Kill it: `taskkill /F /IM mongod.exe`
- Then start MongoDB again

### Still Not Working?
- Check if MongoDB is installed: `mongod --version`
- If not installed, download from: https://www.mongodb.com/try/download/community
- Or use MongoDB Atlas (cloud) instead

## Alternative: Use MongoDB Atlas (Cloud)

If local MongoDB continues to have issues:

1. Edit `backend/.env`
2. Change the MONGO_URI back to Atlas:
   ```
   MONGO_URI=mongodb+srv://abdulkaderamiin376_db_user:eTLtRI6X8sIafXPS@cluster0.nndjckl.mongodb.net/online_auction_platform?retryWrites=true&w=majority
   ```
3. Make sure your IP is whitelisted in MongoDB Atlas Network Access
4. Restart the backend server

## Current Status

✅ Backend server: Running on port 5000
✅ Frontend server: Running on port 3000  
❌ MongoDB: Not connected (needs to be started)

Once MongoDB is running, everything will work!
