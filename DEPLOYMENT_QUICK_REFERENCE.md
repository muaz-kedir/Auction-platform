# Deployment Quick Reference

## Render Backend Deployment

### 🚀 Quick Setup

**Root Directory:**
```
backend
```

**Build Command:**
```bash
npm install
```

**Start Command:**
```bash
npm start
```

### 🔐 Environment Variables

Add these in Render dashboard:

```
NODE_ENV=production
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/online_auction_platform
JWT_SECRET=your_generated_secret_key_here
JWT_EXPIRE=30d
```

### 📋 Step-by-Step Checklist

1. **MongoDB Atlas Setup**
   - [ ] Create MongoDB Atlas account
   - [ ] Create cluster (M0 Free)
   - [ ] Create database user
   - [ ] Whitelist all IPs (0.0.0.0/0)
   - [ ] Copy connection string

2. **Render Setup**
   - [ ] Sign up at render.com
   - [ ] New → Web Service
   - [ ] Connect GitHub repo
   - [ ] Set Root Directory: `backend`
   - [ ] Set Build Command: `npm install`
   - [ ] Set Start Command: `npm start`
   - [ ] Add environment variables
   - [ ] Click "Create Web Service"

3. **After Deployment**
   - [ ] Wait for build to complete
   - [ ] Copy your Render URL
   - [ ] Test API endpoint
   - [ ] Update frontend .env with new URL

### 🧪 Test Your Deployment

```bash
# Replace YOUR_APP_NAME with your Render service name
curl https://YOUR_APP_NAME.onrender.com/api/auth/login

# Should return: Cannot GET /api/auth/login (means server is running)
```

### 🔗 Update Frontend

After backend is deployed, update `frontend/.env`:

```env
VITE_API_URL=https://YOUR_APP_NAME.onrender.com/api
VITE_SOCKET_URL=https://YOUR_APP_NAME.onrender.com
```

### ⚡ Generate JWT Secret

```bash
# Run this command to generate a secure secret:
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### 📊 Expected Result

After deployment:
- ✅ Backend URL: `https://YOUR_APP_NAME.onrender.com`
- ✅ API Base: `https://YOUR_APP_NAME.onrender.com/api`
- ✅ Socket.io: `https://YOUR_APP_NAME.onrender.com`

### ⚠️ Important Notes

- **Free Tier**: Service sleeps after 15 min inactivity
- **First Request**: May take 30-60 seconds after sleep
- **File Uploads**: Use Cloudinary or S3 (ephemeral storage on free tier)
- **MongoDB**: Must use Atlas or external MongoDB (not local)

### 🐛 Common Issues

**Build Fails:**
- Check `backend/package.json` exists
- Verify Root Directory is set to `backend`

**Server Won't Start:**
- Verify MONGO_URI is correct
- Check MongoDB Atlas network access (0.0.0.0/0)

**502 Bad Gateway:**
- Wait 30-60 seconds (server starting)
- Check Render logs for errors

### 📱 Frontend Deployment Options

After backend is live, deploy frontend on:
- **Vercel** (Recommended for React)
- **Netlify**
- **Render** (Static Site)

See FRONTEND_DEPLOYMENT.md for details.

---

**Your Render Configuration:**

```
Service Type: Web Service
Root Directory: backend
Build Command: npm install
Start Command: npm start
Environment: Node
```

That's it! Your backend will be live in 2-3 minutes. 🎉
