# Quick Start Guide - Auction Platform

## Prerequisites
- MongoDB installed and running
- Node.js installed
- Both backend and frontend dependencies installed

## Option 1: Use the All-in-One Script (Easiest)

Double-click `start-all.bat` in the root folder.

This will:
1. Start MongoDB
2. Start Backend (port 5000)
3. Start Frontend (port 3000)

## Option 2: Manual Start (Recommended for Development)

### Terminal 1: Start MongoDB
```bash
mongod --dbpath C:\data\db
```
Or use:
```bash
start-mongodb-simple.bat
```

### Terminal 2: Start Backend
```bash
cd backend
npm start
```

Wait until you see:
```
MongoDB connected
Server running on port 5000
```

### Terminal 3: Start Frontend
```bash
cd frontend
npm run dev
```

Wait until you see:
```
VITE ready
Local: http://localhost:3000
```

## Access the Application

1. **Frontend**: http://localhost:3000
2. **Backend API**: http://localhost:5000/api

## Test Accounts

### Seller Account
- Email: ayub@gmail.com
- Password: ayub123
- Can create auctions

### Admin Account
- Email: admin@gmail.com
- Password: admin123
- Can approve auctions

### Super Admin Account
- Email: superadmine@gmail.com
- Password: superadmine123
- Full admin access

## Workflow

### 1. Create Auction (as Seller)
1. Login as ayub@gmail.com
2. Go to Dashboard → Create Auction
3. Fill form and upload images
4. Submit (status: PENDING)

### 2. Approve Auction (as Admin)
1. Logout and login as superadmine@gmail.com
2. Go to Admin Dashboard → Auction Approval
3. Find the auction
4. Click "Submit for Approval" (status: SUBMITTED)
5. Click "Approve" (status: APPROVED + ACTIVE)

### 3. View on Landing Page
1. Go to home page
2. Scroll to "Featured Auctions"
3. See your approved auction!

## Troubleshooting

### Backend won't start
- Check if MongoDB is running
- Check if port 5000 is available
- Check backend/.env file exists

### Frontend shows connection error
- Make sure backend is running on port 5000
- Check frontend/.env has VITE_API_URL=http://localhost:5000/api

### Images not uploading
- Check Cloudinary credentials in backend/.env
- Or use local storage (automatic fallback)

### No auctions on landing page
- Make sure auction is APPROVED and ACTIVE
- Check browser console for errors
- Verify backend is returning data: http://localhost:5000/api/auctions

## Cloudinary Setup (Optional)

For production-ready image hosting:

1. Get free account: https://cloudinary.com/users/register_free
2. Get credentials from dashboard
3. Update backend/.env:
```env
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```
4. Restart backend

See `SETUP_CLOUDINARY_PROPERLY.md` for detailed instructions.

## Common Issues

### Port 5000 already in use
```bash
# Find and kill the process
netstat -ano | findstr :5000
taskkill /PID <process_id> /F
```

### Port 3000 already in use
```bash
# Find and kill the process
netstat -ano | findstr :3000
taskkill /PID <process_id> /F
```

### MongoDB connection failed
- Make sure MongoDB service is running
- Check connection string in backend/.env
- Default: mongodb://127.0.0.1:27017/auction_db

## Development Tips

- Keep all 3 terminals open while developing
- Backend auto-restarts on file changes (if using nodemon)
- Frontend hot-reloads automatically
- Check backend terminal for API logs
- Check frontend browser console for errors

## Need Help?

Check these files:
- `SETUP_CLOUDINARY_PROPERLY.md` - Cloudinary setup
- `ADMIN_DASHBOARD_COMPLETE.md` - Admin features
- `SELLER_DASHBOARD_COMPLETE.md` - Seller features
- `ARCHITECTURE.md` - System architecture
