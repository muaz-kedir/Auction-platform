# Quick Deploy - Do This Now

## Your Correct Cloudinary Credentials ✅

```
CLOUDINARY_CLOUD_NAME=mediaflows_6ff295c8-b0bb-4438-bf1c-d23252f93de4
CLOUDINARY_API_KEY=595352926672551
CLOUDINARY_API_SECRET=TS5PR8LEvIlS7G-PthG7HAxoTcc
```

Tested locally: ✅ Works perfectly!

## 1. Deploy Code (30 seconds)

```bash
cd backend
git add .
git commit -m "Fix Cloudinary credentials"
git push
```

## 2. Update Render (2 minutes)

https://dashboard.render.com/

→ Your backend service
→ Environment tab
→ Add these 3 variables (copy-paste exactly):

```
CLOUDINARY_CLOUD_NAME = mediaflows_6ff295c8-b0bb-4438-bf1c-d23252f93de4
CLOUDINARY_API_KEY = 595352926672551
CLOUDINARY_API_SECRET = TS5PR8LEvIlS7G-PthG7HAxoTcc
```

NO quotes, NO spaces!

→ Save Changes

## 3. Test (1 minute)

Create auction with images → Works! ✅

## Total: 3.5 minutes

Done! 🎉
