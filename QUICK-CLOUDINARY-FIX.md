# Quick Cloudinary Fix

## The Problem
"Invalid Signature" error when uploading auction images.

## The Cause
Cloudinary API Secret on Render is incorrect, incomplete, or missing.

## The Fix (3 Steps)

### 1. Get Correct Credentials
Go to: https://console.cloudinary.com/
Copy these THREE values:
- Cloud name
- API Key  
- API Secret (click to reveal, copy COMPLETE value)

### 2. Update Render
Go to: https://dashboard.render.com/
→ Your backend service
→ Environment tab
→ Add/Update these 3 variables:

```
CLOUDINARY_CLOUD_NAME=dclwjaycx
CLOUDINARY_API_KEY=522588872652158
CLOUDINARY_API_SECRET=[YOUR_COMPLETE_SECRET_HERE]
```

⚠️ NO quotes, NO spaces, paste directly from Cloudinary

### 3. Deploy
```bash
cd backend
git add .
git commit -m "Fix Cloudinary configuration"
git push
```

Render auto-deploys. Wait for completion.

## Verify It Works

Check Render logs for:
```
✓ Cloudinary configured successfully
  API Secret Length: 27 characters
```

Then test auction creation with images.

## Still Broken?

Your API Secret is wrong. Go back to Cloudinary dashboard and:
1. Settings → Security → API Keys
2. Click "Regenerate API Secret"
3. Copy NEW secret
4. Update Render again
5. Redeploy

## Test Locally First

```bash
cd backend
node test-cloudinary-signature.js
```

Should show: `✅ Signature generation successful!`

If not, your local `.env` has wrong credentials too.
