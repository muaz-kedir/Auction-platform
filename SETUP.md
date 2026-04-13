# Online Auction Platform - Setup Guide

## Prerequisites
- Node.js (v16 or higher)
- MongoDB (running locally or connection string)
- npm or yarn

## Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables:
   - Copy `.env.example` to `.env`: `cp .env.example .env`
   - Update `MONGO_URI` if your MongoDB is running on a different host/port
   - Change `JWT_SECRET` to a secure random string for production

4. Start the backend server:
```bash
npm start
```

Or for development with auto-reload:
```bash
npm run dev
```

The backend will run on `http://localhost:5000`

## Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables:
   - Copy `.env.example` to `.env`: `cp .env.example .env`
   - Update `VITE_API_URL` and `VITE_SOCKET_URL` if your backend runs on a different port

4. Start the frontend development server:
```bash
npm run dev
```

The frontend will run on `http://localhost:3000`

## API Endpoints

### Authentication (`/api/auth`)
- `POST /auth/register` - Register a new account
- `POST /auth/login` - Login and receive JWT token

### Auctions (`/api/auctions`)
- `POST /auctions` - Create a new auction (Auth Required)
- `GET /auctions` - Fetch all auctions (with filters)
- `GET /auctions/:id` - Fetch specific auction details

### Bidding (`/api/bids`)
- `POST /bids/:id` - Place a bid on an auction (Auth Required)

### Wallet (`/api/wallet`)
- `GET /wallet` - View balance and transaction history (Auth Required)
- `POST /wallet/deposit` - Add funds to wallet (Auth Required)

### Withdrawals (`/api/withdraw`)
- `POST /withdraw` - Request a withdrawal (Auth Required)
- `PUT /withdraw/:id/approve` - Approve withdrawal (Admin Only)

### Escrow (`/api/escrow`)
- `POST /escrow/ship/:id` - Mark item as shipped (Auth Required)
- `POST /escrow/confirm/:id` - Confirm delivery (Auth Required)
- `POST /escrow/refund/:id` - Process refund (Auth Required)

### Categories (`/api/categories`)
- `GET /categories` - List all categories
- `POST /categories` - Create new category

### Ratings (`/api/ratings`)
- `POST /ratings` - Submit a rating (Auth Required)
- `GET /ratings/:id` - View ratings for a seller

### Notifications (`/api/notifications`)
- `GET /notifications` - Fetch user notifications (Auth Required)
- `PUT /notifications/:id/read` - Mark notification as read (Auth Required)

### Disputes (`/api/disputes`)
- `POST /disputes` - Open a dispute (Auth Required)
- `PUT /disputes/:id/resolve` - Resolve a dispute (Auth Required)

## Real-time Features

The application uses Socket.io for real-time bidding updates:
- Automatic bid updates when users place bids
- Live auction status changes
- Real-time notifications

## Frontend Integration

The frontend includes:
- `AuthContext` - Authentication state management
- `api.ts` - API service layer for all backend endpoints
- `socket.ts` - Socket.io client for real-time features

### Using the API in Components

```typescript
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

// In your component
const { user, login, logout } = useAuth();

// Fetch auctions
const auctions = await api.auctions.getAll({ search: 'laptop' });

// Place a bid
await api.bids.placeBid(auctionId, amount);
```

### Using Socket.io

```typescript
import { socketService } from '../services/socket';

// Connect to socket
socketService.connect();

// Join auction room
socketService.joinAuction(auctionId);

// Listen for bid updates
socketService.onBidUpdate((data) => {
  console.log('New bid:', data);
});
```

## Running Both Servers

You can run both servers simultaneously:

1. Terminal 1 (Backend):
```bash
cd backend && npm start
```

2. Terminal 2 (Frontend):
```bash
cd frontend && npm run dev
```

## Troubleshooting

- If MongoDB connection fails, ensure MongoDB is running: `mongod`
- If ports are in use, update the PORT in backend `.env` and VITE_API_URL in frontend `.env`
- Clear browser cache if you encounter authentication issues
- Check browser console for detailed error messages
