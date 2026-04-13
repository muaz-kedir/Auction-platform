# Setup Checklist

Use this checklist to ensure your environment is properly configured.

## ✅ Initial Setup

- [ ] Node.js installed (v16 or higher)
- [ ] MongoDB installed or MongoDB Atlas account created
- [ ] Git repository cloned

## ✅ Backend Setup

- [ ] Navigate to backend directory: `cd backend`
- [ ] Install dependencies: `npm install`
- [ ] Create .env file: `cp .env.example .env`
- [ ] Update MONGO_URI in .env (if needed)
- [ ] Update JWT_SECRET in .env (for production)
- [ ] MongoDB is running (check with `mongosh` or service status)
- [ ] Start backend: `npm start`
- [ ] Verify "MongoDB Connected" message appears
- [ ] Backend running on http://localhost:5000

## ✅ Frontend Setup

- [ ] Navigate to frontend directory: `cd frontend`
- [ ] Install dependencies: `npm install`
- [ ] Create .env file: `cp .env.example .env`
- [ ] Verify VITE_API_URL points to backend
- [ ] Verify VITE_SOCKET_URL points to backend
- [ ] Start frontend: `npm run dev`
- [ ] Frontend running on http://localhost:3000

## ✅ Testing

- [ ] Open browser to http://localhost:3000
- [ ] Register a new user account
- [ ] Login with credentials
- [ ] Create a test auction
- [ ] Place a test bid
- [ ] Check wallet functionality
- [ ] Verify real-time bid updates work

## ✅ Git Configuration

- [ ] .gitignore properly configured
- [ ] .env files NOT committed
- [ ] node_modules NOT committed
- [ ] Only source code and documentation committed

## 🚀 Quick Start Commands

```bash
# Create .env files
cd backend && cp .env.example .env
cd ../frontend && cp .env.example .env

# Install all dependencies
cd backend && npm install
cd ../frontend && npm install

# Start both servers (use one of these methods)

# Method 1: Separate terminals
# Terminal 1:
cd backend && npm start

# Terminal 2:
cd frontend && npm run dev

# Method 2: Use startup script
# Windows:
start-dev.bat

# Mac/Linux:
chmod +x start-dev.sh
./start-dev.sh
```

## 🐛 Troubleshooting Checklist

If something doesn't work, check:

- [ ] MongoDB is running
- [ ] .env files exist in both directories
- [ ] MONGO_URI is correct in backend/.env
- [ ] Backend shows "MongoDB Connected"
- [ ] No port conflicts (5000 and 3000)
- [ ] node_modules installed in both directories
- [ ] Browser console shows no errors
- [ ] Backend console shows no errors

## 📚 Next Steps

After setup is complete:

- [ ] Read API_QUICK_REFERENCE.md for API usage
- [ ] Check frontend/src/examples/ApiUsageExample.tsx for code examples
- [ ] Review ARCHITECTURE.md to understand the system
- [ ] Start building your features!

## 🔒 Security Checklist (Before Production)

- [ ] Change JWT_SECRET to a strong random string
- [ ] Use MongoDB Atlas or secure MongoDB instance
- [ ] Enable HTTPS
- [ ] Set NODE_ENV=production
- [ ] Review and update CORS settings
- [ ] Enable rate limiting
- [ ] Set up proper logging
- [ ] Configure backup strategy
- [ ] Review all environment variables

---

Need help? Check the documentation:
- GETTING_STARTED.md - Quick start guide
- SETUP.md - Detailed setup instructions
- MONGODB_SETUP.md - Database setup help
- README.md - Complete project documentation
