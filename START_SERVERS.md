# Start Both Servers

## The Error
`ERR_CONNECTION_REFUSED` means the backend server is not running on port 5000.

## Quick Fix

### Step 1: Start MongoDB
Open a terminal and run:
```bash
start-mongodb-simple.bat
```

### Step 2: Start Backend Server
Open another terminal and run:
```bash
cd backend
npm start
```

You should see:
```
MongoDB connected
Server running on port 5000
✓ Using Cloudinary for image storage
(or)
⚠ Cloudinary not configured, using local storage
```

### Step 3: Start Frontend Server
Open another terminal and run:
```bash
cd frontend
npm run dev
```

You should see:
```
VITE ready
Local: http://localhost:3000
```

## All-in-One Script

I'll create a script that starts everything:
