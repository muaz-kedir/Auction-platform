# API Quick Reference Card

## 🔐 Authentication

```typescript
import { useAuth } from './contexts/AuthContext';

// In your component
const { user, token, login, register, logout, isAuthenticated } = useAuth();

// Login
await login('email@example.com', 'password');

// Register
await register('John Doe', 'email@example.com', 'password');

// Logout
logout();
```

## 🎯 Direct API Calls

```typescript
import { api } from './services/api';

// All API calls return promises
// Errors are thrown and should be caught with try/catch
```

### Authentication
```typescript
// Register
const { token, user } = await api.auth.register({
  name: 'John Doe',
  email: 'john@example.com',
  password: 'password123'
});

// Login
const { token, user } = await api.auth.login({
  email: 'john@example.com',
  password: 'password123'
});
```

### Auctions
```typescript
// Get all auctions
const auctions = await api.auctions.getAll();

// Get with filters
const auctions = await api.auctions.getAll({
  search: 'laptop',
  category: 'electronics',
  min: 100,
  max: 1000
});

// Get single auction
const auction = await api.auctions.getById('auction_id');

// Create auction (requires auth)
const formData = new FormData();
formData.append('title', 'Gaming Laptop');
formData.append('description', 'High-end gaming laptop');
formData.append('startingBid', '500');
formData.append('endTime', '2024-12-31T23:59:59Z');
formData.append('category', 'electronics');
formData.append('images', imageFile1);
formData.append('images', imageFile2);

const newAuction = await api.auctions.create(formData);
```

### Bidding
```typescript
// Place a bid (requires auth)
await api.bids.placeBid('auction_id', 550);
```

### Wallet
```typescript
// Get wallet balance and transactions (requires auth)
const { balance, transactions } = await api.wallet.getBalance();

// Deposit funds (requires auth)
await api.wallet.deposit(1000);
```

### Withdrawals
```typescript
// Request withdrawal (requires auth)
await api.withdraw.request(500, 'bank_transfer');

// Approve withdrawal (admin only)
await api.withdraw.approve('withdrawal_id');
```

### Escrow
```typescript
// Mark item as shipped (requires auth)
await api.escrow.ship('order_id', 'TRACKING123');

// Confirm delivery (requires auth)
await api.escrow.confirm('order_id');

// Process refund (requires auth)
await api.escrow.refund('order_id');
```

### Categories
```typescript
// Get all categories
const categories = await api.categories.getAll();

// Create category
await api.categories.create('Electronics', 'Electronic items');
```

### Ratings
```typescript
// Submit rating (requires auth)
await api.ratings.create('seller_id', 5, 'Great seller!');

// Get seller ratings
const ratings = await api.ratings.getBySeller('seller_id');
```

### Notifications
```typescript
// Get all notifications (requires auth)
const notifications = await api.notifications.getAll();

// Mark as read (requires auth)
await api.notifications.markAsRead('notification_id');
```

### Disputes
```typescript
// Create dispute (requires auth)
await api.disputes.create('order_id', 'Item not received', 'Detailed description');

// Resolve dispute (requires auth)
await api.disputes.resolve('dispute_id', 'Refund issued');
```

## 🎣 Custom Hooks

### useAuctions
```typescript
import { useAuctions } from './hooks/useAuctions';

function MyComponent() {
  const { auctions, loading, error } = useAuctions({
    search: 'laptop',
    category: 'electronics',
    min: 100,
    max: 1000
  });

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      {auctions.map(auction => (
        <div key={auction._id}>{auction.title}</div>
      ))}
    </div>
  );
}
```

### useWallet
```typescript
import { useWallet } from './hooks/useWallet';

function MyComponent() {
  const { wallet, loading, error, deposit, refetch } = useWallet();

  const handleDeposit = async () => {
    const result = await deposit(1000);
    if (result.success) {
      console.log('Deposit successful');
    }
  };

  return (
    <div>
      <p>Balance: ${wallet?.balance}</p>
      <button onClick={handleDeposit}>Deposit $1000</button>
    </div>
  );
}
```

## 🔌 Socket.io Real-time

```typescript
import { socketService } from './services/socket';
import { useEffect } from 'react';

function AuctionComponent({ auctionId }) {
  useEffect(() => {
    // Connect to socket
    socketService.connect();
    
    // Join auction room
    socketService.joinAuction(auctionId);
    
    // Listen for bid updates
    socketService.onBidUpdate((data) => {
      console.log('New bid:', data);
      // Update UI with new bid
    });
    
    // Cleanup
    return () => {
      socketService.offBidUpdate();
    };
  }, [auctionId]);

  const placeBid = async (amount) => {
    await api.bids.placeBid(auctionId, amount);
    // Socket will automatically broadcast to all users
  };

  return <div>Auction Component</div>;
}
```

## 🛡️ Protected Routes

```typescript
import { ProtectedRoute } from './components/ProtectedRoute';

// In your routes
<Route 
  path="/dashboard" 
  element={
    <ProtectedRoute>
      <Dashboard />
    </ProtectedRoute>
  } 
/>

// Admin only route
<Route 
  path="/admin" 
  element={
    <ProtectedRoute requireAdmin>
      <AdminPanel />
    </ProtectedRoute>
  } 
/>
```

## 🎨 With Toast Notifications

```typescript
import { toast } from 'sonner';

try {
  await api.bids.placeBid(auctionId, amount);
  toast.success('Bid placed successfully!');
} catch (error) {
  toast.error(error.message || 'Failed to place bid');
}
```

## 📝 TypeScript Types

```typescript
// User
interface User {
  id: string;
  name: string;
  email: string;
  role?: string;
}

// Auction
interface Auction {
  _id: string;
  title: string;
  description: string;
  startingBid: number;
  currentBid?: number;
  endTime: string;
  category?: string;
  images?: string[];
  seller: {
    _id: string;
    name: string;
  };
  status: 'active' | 'ended' | 'cancelled';
  createdAt: string;
}

// Wallet
interface WalletData {
  balance: number;
  transactions: Array<{
    _id: string;
    type: 'deposit' | 'withdrawal' | 'bid' | 'refund' | 'payment';
    amount: number;
    description: string;
    createdAt: string;
  }>;
}
```

## 🔑 Environment Variables

### Backend (.env)
```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/online_auction_platform
JWT_SECRET=your_secret_key
JWT_EXPIRE=30d
NODE_ENV=development
```

### Frontend (.env)
```env
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

## 🚀 Quick Start Commands

```bash
# Backend
cd backend
npm install
npm start

# Frontend
cd frontend
npm install
npm run dev

# Or use the startup script
./start-dev.bat  # Windows
./start-dev.sh   # Mac/Linux
```

## 📍 URLs

- Frontend: http://localhost:3000
- Backend API: http://localhost:5000/api
- Socket.io: http://localhost:5000

## 🐛 Common Issues

### "Unauthorized" error
→ Token expired or invalid. Call `logout()` and login again.

### "Network Error"
→ Backend not running. Start with `npm start` in backend folder.

### Socket not connecting
→ Check VITE_SOCKET_URL in frontend/.env

### MongoDB connection error
→ Start MongoDB service or use MongoDB Atlas

## 📚 More Examples

See `frontend/src/examples/ApiUsageExample.tsx` for complete working examples of all features.
