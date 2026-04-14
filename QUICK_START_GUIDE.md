# 🚀 Quick Start Guide - Auction Platform

## Current Status
✅ Backend server: Running on port 5000
✅ Frontend server: Running on port 3000
✅ MongoDB URI: Configured for local (mongodb://127.0.0.1:27017/auction_db)
❌ MongoDB: **NOT RUNNING** - This is what we need to fix!

## 🔧 Fix MongoDB Connection (Choose ONE method)

### ⭐ Method 1: Use the Batch Script (EASIEST)
1. **Right-click** on `start-mongodb-simple.bat` in the project root
2. Select **"Run as administrator"**
3. Follow the on-screen instructions
4. Done! MongoDB will start automatically

### Method 2: Command Prompt (Manual)
1. Press `Win + X` and select **"Command Prompt (Admin)"**
2. Run: `net start MongoDB`
3. You should see: "The MongoDB Server service was started successfully."

### Method 3: MongoDB Compass
1. Open **MongoDB Compass** application
2. Connect to `mongodb://localhost:27017`
3. MongoDB will start automatically

## 📝 After MongoDB is Running

### Step 1: Verify Connection
Wait 2-3 seconds, then check the backend terminal. You should see:
```
MongoDB Connected
```

### Step 2: Create Admin Accounts
Open a **new terminal** in the project folder:
```bash
cd backend
node src/utils/seedAdmins.js
```

You should see:
```
✓ Super Admin created successfully
✓ Admin created successfully

=== Admin Accounts ===
Super Admin:
  Email: superadmine@gmail.com
  Password: superadmine123

Admin:
  Email: admin@gmail.com
  Password: admin123
```

### Step 3: Login and Test
1. Open browser: http://localhost:3000/login
2. Enter credentials:
   - Email: `admin@gmail.com`
   - Password: `admin123`
3. Click **"Sign In"**
4. You should be redirected to the dashboard! 🎉

## 🎯 What You'll See

After successful login:
- **Dashboard** with real-time statistics
- **User Management** - View, ban, delete users
- **Auction Management** - View, delete auctions
- **Dispute Resolution** - Resolve disputes
- **Withdrawal Approvals** - Approve/reject withdrawals

## ❓ Troubleshooting

### "Access is denied" when starting MongoDB
- You need Administrator privileges
- Right-click Command Prompt and select "Run as administrator"

### Backend still shows connection errors
- Make sure MongoDB is actually running
- Check: `Get-Service -Name MongoDB` in PowerShell
- Should show Status: **Running**

### "User not found" when logging in
- MongoDB is running but database is empty
- Run the seed script: `node src/utils/seedAdmins.js`

### Port 5000 or 3000 already in use
- Kill Node processes: `taskkill /F /IM node.exe`
- Restart servers

## 🔄 Restart Everything (If Needed)

If something goes wrong, restart everything:

1. **Stop all processes:**
   ```bash
   taskkill /F /IM node.exe
   taskkill /F /IM mongod.exe
   ```

2. **Start MongoDB:**
   - Right-click `start-mongodb-simple.bat` → Run as administrator

3. **Start Backend:**
   ```bash
   cd backend
   npm start
   ```

4. **Start Frontend:**
   ```bash
   cd frontend
   npm run dev
   ```

5. **Seed Database:**
   ```bash
   cd backend
   node src/utils/seedAdmins.js
   ```

## 📚 Additional Resources

- `START_MONGODB_INSTRUCTIONS.md` - Detailed MongoDB setup
- `ADMIN_DASHBOARD_INTEGRATION.md` - Dashboard features documentation
- `ADMIN_SETUP.md` - Admin account management
- `SERVER_STATUS.md` - Server status and monitoring

## 🎉 Success Checklist

- [ ] MongoDB is running
- [ ] Backend shows "MongoDB Connected"
- [ ] Admin accounts created (seed script ran successfully)
- [ ] Can login at http://localhost:3000/login
- [ ] Dashboard loads with statistics
- [ ] Can view users, auctions, disputes, withdrawals

Once all checkboxes are checked, you're ready to go! 🚀
