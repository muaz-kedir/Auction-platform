# Admin Dashboard - Quick Start Guide

## Access the Admin Dashboard

### 1. Login as Admin
```
URL: http://localhost:3000/login
Email: admin@gmail.com
Password: admin123
```

### 2. Login as Super Admin
```
URL: http://localhost:3000/login
Email: superadmine@gmail.com
Password: superadmine123
```

## Main Features

### 📊 Admin Panel Dashboard
**URL**: `/dashboard/admin`

Quick overview with:
- Total users, auctions, revenue
- Pending withdrawals and disputes
- Quick navigation to all admin features

### 👥 User & Role Management
**URL**: `/dashboard/admin/users`

**What you can do**:
- Create new users (Admin, Seller, Buyer)
- Edit user information
- Change user roles (Super Admin only)
- Ban/unban users
- Delete users (Super Admin only)
- Search and filter users

**Try it**:
1. Click "Create User" button
2. Fill in name, email, password
3. Select role from dropdown
4. Click "Create User"

### 🎯 Auction Approval Management
**URL**: `/dashboard/admin/auctions`

**Workflow**:
1. Seller creates auction → Status: PENDING
2. Admin reviews and clicks "Submit" → Status: SUBMITTED
3. Super Admin clicks "Approve" or "Reject" → Status: APPROVED/REJECTED

**As Admin**:
- View all auctions
- Submit pending auctions for approval
- Cannot approve/reject (Super Admin only)

**As Super Admin**:
- Approve submitted auctions
- Reject with reason
- Auctions become ACTIVE when approved

**Try it**:
1. Go to Auction Approval page
2. Filter by "Pending" or "Submitted"
3. Click action buttons based on your role

### 📢 Announcements Management
**URL**: `/dashboard/admin/announcements`

**What you can do**:
- Create announcements for homepage or dashboard
- Edit existing announcements
- Delete announcements
- Toggle active/inactive status

**Try it**:
1. Click "Create Announcement"
2. Enter title: "Welcome to BidSmart!"
3. Enter content: "Start bidding on amazing items today"
4. Select visibility: "Homepage"
5. Check "Active"
6. Click "Create"

## Quick Actions

### Create an Announcement
```
1. Go to /dashboard/admin/announcements
2. Click "Create Announcement"
3. Fill in the form
4. Click "Create"
```

### Submit Auction for Approval (Admin)
```
1. Go to /dashboard/admin/auctions
2. Find a PENDING auction
3. Click "Submit" button
4. Auction sent to Super Admin
```

### Approve Auction (Super Admin)
```
1. Go to /dashboard/admin/auctions
2. Filter by "Submitted"
3. Click "Approve" button
4. Auction becomes ACTIVE
```

### Create a New Admin User (Super Admin)
```
1. Go to /dashboard/admin/users
2. Click "Create User"
3. Fill in details
4. Select role: "Admin"
5. Click "Create User"
```

## Navigation

From Admin Panel, you can access:
- **Users** button → User & Role Management
- **Auctions** button → Auction Approval Management
- **Announcements** button → Announcements Management

Or use direct URLs:
- `/dashboard/admin` - Main dashboard
- `/dashboard/admin/users` - User management
- `/dashboard/admin/auctions` - Auction approval
- `/dashboard/admin/announcements` - Announcements

## Role Differences

### Admin Can:
✅ Create Admins, Sellers, Buyers
✅ Submit auctions for approval
✅ Create announcements
✅ View all data
❌ Cannot create Super Admins
❌ Cannot approve/reject auctions
❌ Cannot delete Admins

### Super Admin Can:
✅ Everything Admin can do
✅ Create Super Admins
✅ Approve/reject auctions
✅ Delete any user
✅ Change user roles

## Status Badges

### Auction Approval Status
- 🟡 **PENDING** - Waiting for Admin review
- 🔵 **SUBMITTED** - Sent to Super Admin
- 🟢 **APPROVED** - Approved and active
- 🔴 **REJECTED** - Rejected with reason

### User Status
- 🟢 **Active** - Can use platform
- 🔴 **Suspended** - Banned from platform
- ⚪ **Unverified** - Not yet verified

### Announcement Status
- 🟢 **Active** - Visible to users
- ⚪ **Inactive** - Hidden from users

## Common Tasks

### Task 1: Create and Publish Announcement
1. Login as Admin
2. Go to Announcements
3. Create new announcement
4. Set visibility to "Homepage"
5. Make sure "Active" is checked
6. Save
7. ✅ Announcement now visible on landing page

### Task 2: Approve a Seller's Auction
1. Login as Admin
2. Go to Auction Approval
3. Find pending auction
4. Click "Submit"
5. Logout
6. Login as Super Admin
7. Go to Auction Approval
8. Filter by "Submitted"
9. Click "Approve"
10. ✅ Auction is now ACTIVE

### Task 3: Create a New Seller Account
1. Login as Admin
2. Go to User Management
3. Click "Create User"
4. Name: "John Seller"
5. Email: "john@seller.com"
6. Password: "password123"
7. Role: "Seller"
8. Click "Create User"
9. ✅ New seller can now login and create auctions

## Troubleshooting

### Cannot see Admin menu
- Make sure you're logged in as Admin or Super Admin
- Check your role in the profile dropdown

### Cannot create Super Admin
- Only Super Admin can create Super Admins
- Login with Super Admin account

### Cannot approve auctions
- Only Super Admin can approve auctions
- Admins can only submit for approval

### Announcement not showing
- Check if "Active" is enabled
- Check visibility setting
- Refresh the page

## API Testing

You can test the APIs directly:

### Get Announcements (Public)
```bash
curl http://localhost:5000/api/announcements/public?isActive=true
```

### Create Announcement (Admin)
```bash
curl -X POST http://localhost:5000/api/announcements \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Announcement",
    "content": "This is a test",
    "visibility": "homepage"
  }'
```

### Submit Auction for Approval
```bash
curl -X POST http://localhost:5000/api/admin/auctions/AUCTION_ID/submit \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Summary

The Admin Dashboard provides complete control over:
- ✅ User management
- ✅ Auction approval workflow
- ✅ Platform announcements
- ✅ Role-based access control

**Start exploring**: Login → Go to `/dashboard/admin` → Click the navigation buttons!
