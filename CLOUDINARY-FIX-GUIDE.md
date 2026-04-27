# Cloudinary "Invalid Signature" Fix Guide

## Problem
Getting "Invalid Signature" error when uploading auction images to Cloudinary in production (Render).

## Root Causes
1. ❌ Cloudinary API Secret on Render doesn't match local .env
2. ❌ API Secret has extra spaces, newlines, or hidden characters
3. ❌ Cloudinary credentials are incorrect or expired
4. ❌ Environment variables not properly set on Render

## Solution Steps

### Step 1: Verify Cloudinary Credentials

1. Go to [Cloudinary Dashboard](https://console.cloudinary.com/)
2. Login to your account
3. Go to "Dashboard" → "Account Details"
4. Copy the EXACT credentials:
   - Cloud Name
   - API Key
   - API Secret

### Step 2: Update Render Environment Variables

1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Select your backend service
3. Go to "Environment" tab
4. Add/Update these variables (click "Add Environment Variable"):

```
CLOUDINARY_CLOUD_NAME=dclwjaycx
CLOUDINARY_API_KEY=522588872652158
CLOUDINARY_API_SECRET=6up0iZ5xJ7q1ODIshd1ZwCeLGNk
```

⚠️ IMPORTANT: 
- Copy-paste directly from Cloudinary dashboard
- NO spaces before or after the values
- NO quotes around the values
- Click "Save Changes" after adding all three

### Step 3: Test Locally First

Run this test script to verify credentials work:

```bash
cd backend
node test-cloudinary-signature.js
```

You should see:
```
✅ Signature generation successful!
```

If you see errors, your credentials are wrong.

### Step 4: Redeploy Backend

After updating Render environment variables:

1. Render will auto-redeploy
2. OR manually trigger: "Manual Deploy" → "Deploy latest commit"
3. Wait for deployment to complete (check logs)

### Step 5: Check Render Logs

After deployment, check logs for:

```
✓ Cloudinary configured with cloud_name: dclwjaycx
```

If you see:
```
⚠ Cloudinary not properly configured. Using local storage.
```

Then environment variables are not set correctly on Render.

### Step 6: Test Upload

1. Go to your frontend: https://auction-platform-expk.vercel.app
2. Try creating an auction with images
3. Check browser console for errors
4. Check Render logs for upload attempts

## Alternative: Use Local Storage (Temporary)

If Cloudinary continues to fail, you can temporarily use local storage:

### On Render:

1. Remove or comment out Cloudinary env vars
2. Redeploy
3. Backend will automatically fall back to local storage

⚠️ WARNING: Local storage on Render is ephemeral (files deleted on restart)

## Debugging Commands

### Test Cloudinary Connection
```bash
cd backend
node test-cloudinary.js
```

### Check Environment Variables on Render
In Render logs, you should see:
```
✓ Cloudinary configured with cloud_name: YOUR_CLOUD_NAME
```

### Verify API Secret Length
Your API secret should be around 24-27 characters long.

Current secret length: 27 characters ✅

## Common Mistakes

❌ Adding quotes: `CLOUDINARY_API_SECRET="6up0iZ5xJ7q1ODIshd1ZwCeLGNk"`
✅ Correct: `CLOUDINARY_API_SECRET=6up0iZ5xJ7q1ODIshd1ZwCeLGNk`

❌ Extra spaces: `CLOUDINARY_API_SECRET= 6up0iZ5xJ7q1ODIshd1ZwCeLGNk `
✅ Correct: `CLOUDINARY_API_SECRET=6up0iZ5xJ7q1ODIshd1ZwCeLGNk`

❌ Wrong variable name: `CLOUDINARY_SECRET=...`
✅ Correct: `CLOUDINARY_API_SECRET=...`

## Expected Result

After fix:
- ✅ Images upload to Cloudinary successfully
- ✅ No "Invalid Signature" errors
- ✅ Auction creation works
- ✅ Images display correctly

## Still Not Working?

1. Regenerate Cloudinary API Secret:
   - Go to Cloudinary Dashboard
   - Settings → Security → API Keys
   - Click "Regenerate API Secret"
   - Update both local .env and Render

2. Check Cloudinary upload preset:
   - Dashboard → Settings → Upload
   - Ensure "unsigned uploads" are disabled
   - Use signed uploads (current implementation)

3. Contact me with:
   - Render logs (last 50 lines)
   - Browser console errors
   - Cloudinary dashboard screenshot (hide secret)
