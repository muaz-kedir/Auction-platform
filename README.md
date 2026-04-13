# Online Auction Platform

A full-stack real-time auction platform with secure authentication, bidding system, wallet management, and live updates.

## 🚀 Features

- **User Authentication**: Secure JWT-based authentication with role management
- **Real-time Bidding**: Live bid updates using Socket.io
- **Wallet System**: Integrated wallet for deposits, withdrawals, and transactions
- **Escrow Service**: Secure payment handling with shipping confirmation
- **Categories & Search**: Filter auctions by category, price range, and search terms
- **Ratings & Reviews**: Rate sellers and view their reputation
- **Notifications**: Real-time alerts for bids, auctions, and transactions
- **Dispute Resolution**: Built-in dispute management system
- **Admin Panel**: Manage users, auctions, and withdrawals

## 🛠️ Tech Stack

### Backend
- Node.js & Express.js
- MongoDB with Mongoose
- Socket.io for real-time communication
- JWT for authentication
- Multer for file uploads
- Bcrypt for password hashing

### Frontend
- React 18 with TypeScript
- Vite for fast development
- React Router for navigation
- Radix UI components
- Tailwind CSS for styling
- Socket.io-client for real-time updates
- Sonner for toast notifications

## 📋 Prerequisites

- Node.js (v16 or higher)
- MongoDB (local or Atlas)
- npm or yarn

## 🔧 Quick Start

### 1. Clone the repository
```bash
git clone <repository-url>
cd online-auction-platform
```

### 2. Setup MongoDB
See [MONGODB_SETUP.md](MONGODB_SETUP.md) for detailed MongoDB installation instructions.

### 3. Install Dependencies

Backend:
```bash
cd backend
npm install
```

Frontend:
```bash
cd frontend
npm install
```

### 4. Configure Environment Variables

Backend:
```bash
cd backend
cp .env.example .env
```

Then edit `backend/.env` and update if needed:
```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/online_auction_platform
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production_2024
JWT_EXPIRE=30d
NODE_ENV=development
```

Frontend:
```bash
cd frontend
cp .env.example .env
```

The frontend `.env` file should contain:
```env
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

### 5. Start the Servers

#### Option A: Using the start script (Windows)
```bash
start-dev.bat
```

#### Option B: Using the start script (Mac/Linux)
```bash
chmod +x start-dev.sh
./start-dev.sh
```

#### Option C: Manual start

Terminal 1 (Backend):
```bash
cd backend
npm start
```

Terminal 2 (Frontend):
```bash
cd frontend
npm run dev
```

### 6. Access the Application

- Frontend: http://localhost:3000
- Backend API: http://localhost:5000/api

## 📚 API Documentation

### Authentication Endpoints

#### Register
```http
POST /api/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}
```

### Auction Endpoints

#### Get All Auctions
```http
GET /api/auctions?search=laptop&category=electronics&min=100&max=1000
```

#### Get Auction by ID
```http
GET /api/auctions/:id
```

#### Create Auction (Auth Required)
```http
POST /api/auctions
Authorization: Bearer <token>
Content-Type: multipart/form-data

{
  "title": "Laptop",
  "description": "Gaming laptop",
  "startingBid": 500,
  "endTime": "2024-12-31T23:59:59Z",
  "category": "electronics",
  "images": [file1, file2]
}
```

### Bidding Endpoints

#### Place Bid (Auth Required)
```http
POST /api/bids/:auctionId
Authorization: Bearer <token>
Content-Type: application/json

{
  "amount": 550
}
```

### Wallet Endpoints

#### Get Wallet Balance (Auth Required)
```http
GET /api/wallet
Authorization: Bearer <token>
```

#### Deposit Funds (Auth Required)
```http
POST /api/wallet/deposit
Authorization: Bearer <token>
Content-Type: application/json

{
  "amount": 1000
}
```

### More Endpoints

See [SETUP.md](SETUP.md) for complete API documentation including:
- Withdrawals
- Escrow operations
- Categories
- Ratings
- Notifications
- Disputes

## 💻 Frontend Integration

### Using the API Service

```typescript
import { api } from './services/api';

// Fetch auctions
const auctions = await api.auctions.getAll({ search: 'laptop' });

// Place a bid
await api.bids.placeBid(auctionId, amount);

// Deposit to wallet
await api.wallet.deposit(1000);
```

### Using Authentication Context

```typescript
import { useAuth } from './contexts/AuthContext';

function MyComponent() {
  const { user, login, logout, isAuthenticated } = useAuth();
  
  // Use authentication state
}
```

### Using Custom Hooks

```typescript
import { useAuctions } from './hooks/useAuctions';
import { useWallet } from './hooks/useWallet';

function MyComponent() {
  const { auctions, loading } = useAuctions({ search: 'laptop' });
  const { wallet, deposit } = useWallet();
}
```

### Real-time Updates with Socket.io

```typescript
import { socketService } from './services/socket';

// Connect and join auction room
socketService.connect();
socketService.joinAuction(auctionId);

// Listen for bid updates
socketService.onBidUpdate((data) => {
  console.log('New bid:', data);
});
```

## 📁 Project Structure

```
online-auction-platform/
├── backend/
│   ├── src/
│   │   ├── config/         # Database configuration
│   │   ├── controllers/    # Route controllers
│   │   ├── middleware/     # Auth, validation, upload
│   │   ├── models/         # Mongoose models
│   │   ├── routes/         # API routes
│   │   └── utils/          # Socket.io, cron jobs
│   ├── .env               # Environment variables
│   └── server.js          # Entry point
├── frontend/
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── contexts/      # React contexts (Auth)
│   │   ├── hooks/         # Custom hooks
│   │   ├── pages/         # Page components
│   │   ├── services/      # API & Socket services
│   │   └── examples/      # Usage examples
│   └── .env              # Environment variables
└── README.md
```

## 🔍 Examples

Check out [frontend/src/examples/ApiUsageExample.tsx](frontend/src/examples/ApiUsageExample.tsx) for comprehensive examples of:
- Authentication
- Fetching and filtering auctions
- Placing bids with real-time updates
- Wallet operations
- Creating auctions
- Managing notifications
- Handling disputes

## 🐛 Troubleshooting

### MongoDB Connection Issues
- Ensure MongoDB is running: `mongod` or check Windows Services
- Verify MONGO_URI in backend/.env
- See [MONGODB_SETUP.md](MONGODB_SETUP.md) for detailed setup

### Port Already in Use
- Change PORT in backend/.env
- Update VITE_API_URL in frontend/.env accordingly

### Authentication Issues
- Clear browser localStorage
- Check JWT_SECRET in backend/.env
- Verify token is being sent in Authorization header

## 📝 License

This project is licensed under the MIT License.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
