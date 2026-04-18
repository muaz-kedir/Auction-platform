# Quick Start Guide - Auction Platform

## 🚀 Getting Started in 5 Minutes

### Step 1: Start MongoDB
```bash
start-mongodb-simple.bat
```
Wait for "MongoDB Connected" message.

### Step 2: Start Backend
```bash
cd backend
npm start
```
Wait for "Server running on port 5000" message.

### Step 3: Start Frontend
```bash
cd frontend
npm run dev
```
Wait for "Local: http://localhost:3000" message.

### Step 4: Open Browser
Navigate to: `http://localhost:3000`

---

## 🎯 Test the Complete Flow

### Test 1: View Auctions (No Login Required)
1. Open `http://localhost:3000`
2. Scroll to "Featured Auctions" section
3. You should see auction cards with images

### Test 2: Try to View Auction Details (Requires Login)
1. Click on any auction card
2. You'll be redirected to `/login`
3. This is expected behavior!

### Test 3: Login and View Auction
1. Login with:
   - Email: `superadmine@gmail.com`
   - Password: `superadmine123`
2. You'll be redirected to the auction detail page
3. You should see:
   - Full auction details
   - Image gallery
   - Countdown timer
   - Bid placement form

### Test 4: Place a Bid
1. Enter a bid amount (must be higher than current bid)
2. Click "Bid" button
3. You should see a success message
4. Current bid should update

### Test 5: Create Auction with Images
1. Go to Dashboard → Create Auction
2. Fill in all fields:
   - Title: "Test Auction"
   - Category: Select any
   - Description: "Testing image upload"
   - Starting Bid: 100
   - Duration: 7 days
3. Click "Upload" and select 1-3 images
4. Click "Create Auction"
5. Success! Auction created with status PENDING

### Test 6: Approve Auction
1. Go to Admin Panel → Auction Approval
2. Find your test auction
3. Click "Submit for Approval" (if Admin)
4. Click "Approve" (if Super Admin)
5. Auction status changes to APPROVED + ACTIVE

### Test 7: Verify on Landing Page
1. Logout or open incognito window
2. Go to `http://localhost:3000`
3. Your auction should appear in "Featured Auctions"
4. Image should load from Cloudinary
5. Click it → redirected to login (if not logged in)

---

## 📋 Admin Credentials

### Super Admin (Full Access)
- Email: `superadmine@gmail.com`
- Password: `superadmine123`
- Can: Create, approve, manage everything

### Admin (Limited Access)
- Email: `admin@gmail.com`
- Password: `admin123`
- Can: Create, submit for approval, manage users

---

## 🎨 Key Features to Test

### Landing Page
- ✅ View auctions without login
- ✅ See images from Cloudinary
- ✅ Click auction → redirected to login
- ✅ After login → see auction details

### Auction Detail Page
- ✅ Requires login to access
- ✅ Shows full auction information
- ✅ Image gallery with thumbnails
- ✅ Countdown timer
- ✅ Place bids
- ✅ Seller information

### Image Upload
- ✅ Upload multiple images (auctions)
- ✅ Upload profile image (settings)
- ✅ Images stored in Cloudinary
- ✅ Images display on landing page

### Admin Dashboard
- ✅ Create auctions
- ✅ Approve auctions
- ✅ Manage users
- ✅ View statistics

---

## 🐛 Troubleshooting

### Auctions not showing on landing page?
**Solution:** Make sure auction is:
1. Status: ACTIVE
2. Approval Status: APPROVED
3. Has at least one image

### Cannot access auction detail?
**Solution:** You must be logged in!
1. Click auction → redirected to login
2. Login with credentials
3. You'll be redirected back to auction

### Images not uploading?
**Solution:** Check Cloudinary credentials in `backend/.env`:
```env
CLOUDINARY_CLOUD_NAME=dqhqxfqzv
CLOUDINARY_API_KEY=522588872652158
CLOUDINARY_API_SECRET=6up0iZ5xJ7q1ODIshd1ZwCeLGNk
```

### Cannot place bid?
**Solution:** Check:
1. You are logged in
2. Auction is ACTIVE
3. Bid amount >= current bid + $10
4. You have sufficient wallet balance

---

## 📁 Project Structure

```
auction-platform/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── cloudinary.js          # Cloudinary config
│   │   ├── controllers/
│   │   │   ├── auctionController.js   # Auction logic
│   │   │   └── adminController.js     # Admin logic
│   │   ├── middleware/
│   │   │   └── cloudinaryUpload.js    # Upload middleware
│   │   ├── models/
│   │   │   └── Auction.js             # Auction schema
│   │   └── routes/
│   │       └── auctionRoutes.js       # Auction routes
│   ├── .env                           # Environment variables
│   └── server.js                      # Express server
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── auction/
│   │   │   │   └── AuctionCard.tsx    # Auction card component
│   │   │   ├── FeaturedAuctions.tsx   # Landing page auctions
│   │   │   └── ProtectedRoute.tsx     # Auth protection
│   │   ├── pages/
│   │   │   ├── LandingPage.tsx        # Home page
│   │   │   ├── AuctionDetail.tsx      # Auction details
│   │   │   └── CreateAuction.tsx      # Create auction
│   │   ├── contexts/
│   │   │   └── AuthContext.tsx        # Authentication
│   │   ├── services/
│   │   │   └── api.ts                 # API calls
│   │   └── routes.tsx                 # Route configuration
│   └── package.json
│
└── Documentation/
    ├── QUICK_START_GUIDE.md           # This file
    ├── AUCTION_FLOW_GUIDE.md          # Detailed flow
    ├── CLOUDINARY_SETUP.md            # Image upload guide
    └── IMPLEMENTATION_SUMMARY.md      # What was built
```

---

## 🔗 Important URLs

- **Landing Page:** `http://localhost:3000`
- **Login:** `http://localhost:3000/login`
- **Dashboard:** `http://localhost:3000/dashboard`
- **Create Auction:** `http://localhost:3000/dashboard/seller/create`
- **Admin Panel:** `http://localhost:3000/dashboard/admin`
- **Backend API:** `http://localhost:5000/api`

---

## 📚 Documentation

For more detailed information, see:

1. **AUCTION_FLOW_GUIDE.md** - Complete user flow and features
2. **CLOUDINARY_SETUP.md** - Image upload configuration
3. **CLOUDINARY_QUICK_TEST.md** - Testing image uploads
4. **IMPLEMENTATION_SUMMARY.md** - What was implemented
5. **ADMIN_DASHBOARD_COMPLETE.md** - Admin features

---

## ✅ Success Checklist

After following this guide, you should be able to:

- [ ] View auctions on landing page
- [ ] Click auction and be redirected to login
- [ ] Login and see auction details
- [ ] Place a bid on an auction
- [ ] Create auction with images
- [ ] Approve auction as admin
- [ ] See approved auction on landing page
- [ ] Upload profile image
- [ ] Navigate between pages

---

## 🎉 You're All Set!

The auction platform is now fully functional with:
- ✅ Real auction data on landing page
- ✅ Cloudinary image uploads
- ✅ Protected auction detail pages
- ✅ Bidding functionality
- ✅ Admin approval workflow
- ✅ User authentication

**Happy Bidding! 🎯**
