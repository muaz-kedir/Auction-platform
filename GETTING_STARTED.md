# 🚀 Getting Started Guide

Welcome to the Online Auction Platform! This guide will help you get up and running quickly.

## ✅ What's Already Done

Your project is already set up with:
- ✅ Backend server configured and running
- ✅ Frontend development server running
- ✅ All dependencies installed
- ✅ API integration layer complete
- ✅ Socket.io for real-time features
- ✅ Authentication system ready
- ✅ Environment variables configured

## 🎯 Current Status

### Running Services
- **Frontend**: http://localhost:3000 ✅ RUNNING
- **Backend**: http://localhost:5000 ✅ RUNNING
- **MongoDB**: ⚠️ NEEDS SETUP (see below)

## 🔧 Step 1: Setup MongoDB (REQUIRED)

Before starting, you need to:

1. **Create environment files**:
   ```bash
   # Backend
   cd backend
   cp .env.example .env
   
   # Frontend
   cd frontend
   cp .env.example .env
   ```

2. **Setup MongoDB** - Choose one option:

### Option A: Local MongoDB (Recommended for Development)

#### Windows
1. Download MongoDB Community Server: https://www.mongodb.com/try/download/community
2. Run the installer (choose "Complete" installation)
3. Install as Windows Service
4. Start the service:
   ```bash
   net start MongoDB
   ```

#### Mac
```bash
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb-community
```

#### Linux
```bash
sudo apt-get install -y mongodb
sudo systemctl start mongodb
```

### Option B: MongoDB Atlas (Cloud - Free)

1. Go to https://www.mongodb.com/cloud/atlas
2. Create a free account
3. Create a new cluster (M0 Free tier)
4. Create a database user
5. Whitelist your IP (or use 0.0.0.0/0 for development)
6. Get your connection string
7. Update `backend/.env`:
   ```env
   MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/online_auction_platform
   ```

## 🔄 Step 2: Restart Backend

After MongoDB is set up, restart the backend:

1. Stop the current backend process (Ctrl+C in the backend terminal)
2. Start it again:
   ```bash
   cd backend
   npm start
   ```

You should see: **"MongoDB Connected"** ✅

## 🎉 Step 3: Start Using the Platform

### Access the Application
- Open your browser: http://localhost:3000
- The backend API is at: http://localhost:5000/api

### Test the Features

1. **Register a New Account**
   - Go to http://localhost:3000/register
   - Create your account

2. **Login**
   - Use your credentials to login
   - You'll receive a JWT token automatically

3. **Create an Auction**
   - Navigate to "Create Auction"
   - Fill in the details
   - Upload images (optional)
   - Submit

4. **Browse Auctions**
   - View all active auctions
   - Filter by category, price range
   - Search for specific items

5. **Place Bids**
   - Click on an auction
   - Enter your bid amount
   - See real-time updates when others bid

6. **Manage Wallet**
   - Deposit funds
   - View transaction history
   - Request withdrawals

## 💻 For Developers: Using the API

### Quick Example - Login and Fetch Auctions

```typescript
import { useAuth } from './contexts/AuthContext';
import { useAuctions } from './hooks/useAuctions';

function MyComponent() {
  const { login, user } = useAuth();
  const { auctions, loading } = useAuctions();

  const handleLogin = async () => {
    await login('user@example.com', 'password');
  };

  return (
    <div>
      <button onClick={handleLogin}>Login</button>
      {auctions.map(auction => (
        <div key={auction._id}>{auction.title}</div>
      ))}
    </div>
  );
}
```

### Quick Example - Place a Bid

```typescript
import { api } from './services/api';
import { socketService } from './services/socket';
import { useEffect, useState } from 'react';

function BidComponent({ auctionId }) {
  const [currentBid, setCurrentBid] = useState(0);

  useEffect(() => {
    // Connect to real-time updates
    socketService.connect();
    socketService.joinAuction(auctionId);
    
    socketService.onBidUpdate((data) => {
      setCurrentBid(data.amount);
    });
  }, [auctionId]);

  const placeBid = async (amount) => {
    try {
      await api.bids.placeBid(auctionId, amount);
      alert('Bid placed!');
    } catch (error) {
      alert('Failed to place bid');
    }
  };

  return (
    <div>
      <p>Current Bid: ${currentBid}</p>
      <button onClick={() => placeBid(currentBid + 10)}>
        Bid ${currentBid + 10}
      </button>
    </div>
  );
}
```

## 📚 Documentation

### Essential Docs
- **API_QUICK_REFERENCE.md** - Quick API reference with code snippets
- **SETUP.md** - Complete API endpoint documentation
- **MONGODB_SETUP.md** - Detailed MongoDB setup instructions
- **README.md** - Full project documentation

### Code Examples
- **frontend/src/examples/ApiUsageExample.tsx** - Complete working examples

## 🎯 Common Tasks

### How to: Create a New Page with API Integration

1. Create your page component:
```typescript
// frontend/src/pages/MyNewPage.tsx
import { useAuctions } from '../hooks/useAuctions';

export function MyNewPage() {
  const { auctions, loading } = useAuctions({ search: 'laptop' });
  
  if (loading) return <div>Loading...</div>;
  
  return (
    <div>
      {auctions.map(auction => (
        <div key={auction._id}>{auction.title}</div>
      ))}
    </div>
  );
}
```

2. Add route in `frontend/src/routes.tsx`:
```typescript
{
  path: "/my-page",
  Component: MyNewPage,
}
```

### How to: Make an Authenticated API Call

```typescript
import { api } from './services/api';

// The API automatically includes the JWT token from localStorage
const wallet = await api.wallet.getBalance();
```

### How to: Handle Real-time Updates

```typescript
import { socketService } from './services/socket';

// Connect
socketService.connect();

// Join a room
socketService.joinAuction(auctionId);

// Listen for updates
socketService.onBidUpdate((data) => {
  console.log('New bid:', data);
});

// Cleanup
socketService.offBidUpdate();
```

## 🐛 Troubleshooting

### Backend shows "MongoDB connection error"
**Solution**: MongoDB is not running. Follow Step 1 above to set up MongoDB.

### Frontend shows "Network Error"
**Solution**: Backend is not running. Start it with:
```bash
cd backend
npm start
```

### "Unauthorized" error when making API calls
**Solution**: 
1. Clear browser localStorage
2. Login again
3. Check if JWT_SECRET in backend/.env is set

### Real-time updates not working
**Solution**: 
1. Check browser console for Socket.io connection errors
2. Verify VITE_SOCKET_URL in frontend/.env
3. Ensure backend is running

### Port already in use
**Solution**: 
1. Change PORT in backend/.env
2. Update VITE_API_URL in frontend/.env
3. Restart both servers

## 🎓 Learning Resources

### Understanding the Architecture

```
┌─────────────┐         ┌─────────────┐         ┌─────────────┐
│   Browser   │ ◄─────► │   Backend   │ ◄─────► │   MongoDB   │
│  (React)    │  HTTP   │  (Express)  │         │  (Database) │
│             │ Socket  │             │         │             │
└─────────────┘         └─────────────┘         └─────────────┘
```

### Key Concepts

1. **Authentication Flow**
   - User registers/logs in
   - Backend returns JWT token
   - Token stored in localStorage
   - Token sent with every API request

2. **Real-time Bidding**
   - User places bid via HTTP POST
   - Backend saves bid to database
   - Backend broadcasts update via Socket.io
   - All connected clients receive update

3. **Wallet System**
   - Users deposit funds
   - Funds held in escrow during auction
   - Released to seller on confirmation
   - Refunded to buyer if disputed

## 🚀 Next Steps

1. ✅ Setup MongoDB (if not done)
2. ✅ Test the application in browser
3. 📖 Read API_QUICK_REFERENCE.md for API usage
4. 💻 Start building your features
5. 🎨 Customize the UI components
6. 🔧 Add your business logic

## 💡 Tips

- Use the custom hooks (`useAuctions`, `useWallet`) for cleaner code
- Check `frontend/src/examples/ApiUsageExample.tsx` for patterns
- Use `toast` from 'sonner' for user notifications
- Wrap protected routes with `<ProtectedRoute>`
- Use TypeScript types for better development experience

## 🤝 Need Help?

- Check the documentation files in the root directory
- Look at example code in `frontend/src/examples/`
- Review the API endpoints in SETUP.md
- Check troubleshooting section above

## ✨ You're Ready!

Once MongoDB is connected, you have a fully functional auction platform with:
- ✅ User authentication
- ✅ Real-time bidding
- ✅ Wallet management
- ✅ Escrow system
- ✅ Notifications
- ✅ Dispute resolution
- ✅ Admin panel

Happy building! 🎉
