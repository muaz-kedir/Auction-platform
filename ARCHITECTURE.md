# 🏗️ Architecture Overview

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND (React)                         │
│                     http://localhost:3000                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   Pages      │  │  Components  │  │   Layouts    │          │
│  │              │  │              │  │              │          │
│  │ - Landing    │  │ - AuctionCard│  │ - Dashboard  │          │
│  │ - Login      │  │ - Timer      │  │              │          │
│  │ - Dashboard  │  │ - StatCard   │  │              │          │
│  │ - Auctions   │  │ - UI Comps   │  │              │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                    State Management                       │  │
│  │                                                            │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐   │  │
│  │  │ AuthContext  │  │ useAuctions  │  │  useWallet   │   │  │
│  │  │              │  │              │  │              │   │  │
│  │  │ - user       │  │ - auctions   │  │ - balance    │   │  │
│  │  │ - token      │  │ - loading    │  │ - deposit()  │   │  │
│  │  │ - login()    │  │ - error      │  │ - refetch()  │   │  │
│  │  └──────────────┘  └──────────────┘  └──────────────┘   │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                    Services Layer                         │  │
│  │                                                            │  │
│  │  ┌──────────────────────┐  ┌──────────────────────┐     │  │
│  │  │   api.ts             │  │   socket.ts          │     │  │
│  │  │                      │  │                      │     │  │
│  │  │ - auth.login()       │  │ - connect()          │     │  │
│  │  │ - auctions.getAll()  │  │ - joinAuction()      │     │  │
│  │  │ - bids.placeBid()    │  │ - onBidUpdate()      │     │  │
│  │  │ - wallet.deposit()   │  │ - emitNewBid()       │     │  │
│  │  └──────────────────────┘  └──────────────────────┘     │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                   │
└───────────────────────┬─────────────────────┬───────────────────┘
                        │                     │
                   HTTP │                     │ WebSocket
                   REST │                     │ Socket.io
                        │                     │
┌───────────────────────┴─────────────────────┴───────────────────┐
│                      BACKEND (Express.js)                        │
│                     http://localhost:5000                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                    API Routes                             │  │
│  │                                                            │  │
│  │  /api/auth          /api/auctions      /api/bids         │  │
│  │  /api/wallet        /api/withdraw      /api/escrow       │  │
│  │  /api/categories    /api/ratings       /api/notifications│  │
│  │  /api/disputes                                            │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                    Controllers                            │  │
│  │                                                            │  │
│  │  - authController      - auctionController                │  │
│  │  - bidController       - walletController                 │  │
│  │  - escrowController    - notificationController           │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                    Middleware                             │  │
│  │                                                            │  │
│  │  - authMiddleware (JWT verification)                      │  │
│  │  - roleMiddleware (Admin checks)                          │  │
│  │  - validation (Input validation)                          │  │
│  │  - upload (File upload handling)                          │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                    Models (Mongoose)                      │  │
│  │                                                            │  │
│  │  - User            - Auction          - Bid               │  │
│  │  - Wallet          - Notification     - Rating            │  │
│  │  - Dispute         - Category         - Withdraw          │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                    Utilities                              │  │
│  │                                                            │  │
│  │  - Socket.io Server (Real-time events)                    │  │
│  │  - Cron Jobs (Auto-end auctions every 10s)               │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                   │
└───────────────────────────────┬─────────────────────────────────┘
                                │
                                │ Mongoose ODM
                                │
┌───────────────────────────────┴─────────────────────────────────┐
│                      MongoDB Database                            │
│                  mongodb://localhost:27017                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  Collections:                                                    │
│  - users           - auctions        - bids                     │
│  - wallets         - notifications   - ratings                  │
│  - disputes        - categories      - withdrawals              │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

## Data Flow Examples

### 1. User Registration Flow

```
┌─────────┐                ┌─────────┐                ┌─────────┐
│ Browser │                │ Backend │                │ MongoDB │
└────┬────┘                └────┬────┘                └────┬────┘
     │                          │                          │
     │ POST /api/auth/register  │                          │
     │ {name, email, password}  │                          │
     ├─────────────────────────>│                          │
     │                          │                          │
     │                          │ Hash password (bcrypt)   │
     │                          │                          │
     │                          │ Save user                │
     │                          ├─────────────────────────>│
     │                          │                          │
     │                          │ User created             │
     │                          │<─────────────────────────┤
     │                          │                          │
     │                          │ Generate JWT token       │
     │                          │                          │
     │ {token, user}            │                          │
     │<─────────────────────────┤                          │
     │                          │                          │
     │ Store token in           │                          │
     │ localStorage             │                          │
     │                          │                          │
```

### 2. Real-time Bidding Flow

```
┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐
│ User A  │  │ User B  │  │ Backend │  │Socket.io│  │ MongoDB │
└────┬────┘  └────┬────┘  └────┬────┘  └────┬────┘  └────┬────┘
     │            │             │             │             │
     │ Place bid  │             │             │             │
     │ $550       │             │             │             │
     ├───────────────────────────>            │             │
     │            │             │             │             │
     │            │             │ Validate    │             │
     │            │             │ bid amount  │             │
     │            │             │             │             │
     │            │             │ Save bid    │             │
     │            │             ├─────────────────────────>│
     │            │             │             │             │
     │            │             │ Bid saved   │             │
     │            │             │<─────────────────────────┤
     │            │             │             │             │
     │            │             │ Broadcast   │             │
     │            │             │ bidUpdate   │             │
     │            │             ├────────────>│             │
     │            │             │             │             │
     │ Bid        │             │             │ Emit to all │
     │ confirmed  │             │             │ in room     │
     │<───────────────────────────            │             │
     │            │             │             │             │
     │            │ New bid     │             │             │
     │            │ $550        │             │             │
     │            │<────────────────────────────            │
     │            │             │             │             │
```

### 3. Wallet Deposit Flow

```
┌─────────┐                ┌─────────┐                ┌─────────┐
│ Browser │                │ Backend │                │ MongoDB │
└────┬────┘                └────┬────┘                └────┬────┘
     │                          │                          │
     │ POST /api/wallet/deposit │                          │
     │ {amount: 1000}           │                          │
     │ + JWT token              │                          │
     ├─────────────────────────>│                          │
     │                          │                          │
     │                          │ Verify JWT token         │
     │                          │                          │
     │                          │ Find user wallet         │
     │                          ├─────────────────────────>│
     │                          │                          │
     │                          │ Wallet found             │
     │                          │<─────────────────────────┤
     │                          │                          │
     │                          │ Update balance           │
     │                          │ Add transaction record   │
     │                          ├─────────────────────────>│
     │                          │                          │
     │                          │ Updated wallet           │
     │                          │<─────────────────────────┤
     │                          │                          │
     │ {balance, transactions}  │                          │
     │<─────────────────────────┤                          │
     │                          │                          │
```

## Authentication Flow

```
┌──────────────────────────────────────────────────────────────┐
│                     Authentication Process                    │
└──────────────────────────────────────────────────────────────┘

1. User Login
   ↓
2. Backend validates credentials
   ↓
3. Backend generates JWT token
   ↓
4. Token sent to frontend
   ↓
5. Frontend stores token in localStorage
   ↓
6. Frontend includes token in all API requests
   ↓
7. Backend middleware verifies token
   ↓
8. Request processed if valid

Token Structure:
{
  "userId": "user_id",
  "email": "user@example.com",
  "role": "user",
  "iat": 1234567890,
  "exp": 1234567890
}
```

## Real-time Communication

```
┌──────────────────────────────────────────────────────────────┐
│                   Socket.io Event Flow                        │
└──────────────────────────────────────────────────────────────┘

Client Side:
1. socketService.connect()
   → Establishes WebSocket connection

2. socketService.joinAuction(auctionId)
   → Joins specific auction room

3. socketService.onBidUpdate(callback)
   → Listens for bid updates

Server Side:
1. io.on('connection', (socket) => {...})
   → Accepts new connections

2. socket.on('joinAuction', (auctionId) => {...})
   → Adds socket to auction room

3. io.to(auctionId).emit('bidUpdate', data)
   → Broadcasts to all in room

Events:
- connection: New client connects
- joinAuction: Client joins auction room
- newBid: New bid placed
- bidUpdate: Broadcast bid to all clients
- disconnect: Client disconnects
```

## File Structure

```
project/
│
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── db.js                 # MongoDB connection
│   │   ├── controllers/
│   │   │   ├── authController.js     # Auth logic
│   │   │   ├── auctionController.js  # Auction CRUD
│   │   │   ├── bidController.js      # Bidding logic
│   │   │   └── ...
│   │   ├── middleware/
│   │   │   ├── authMiddleware.js     # JWT verification
│   │   │   ├── roleMiddleware.js     # Role checks
│   │   │   └── validation.js         # Input validation
│   │   ├── models/
│   │   │   ├── User.js               # User schema
│   │   │   ├── Auction.js            # Auction schema
│   │   │   └── ...
│   │   ├── routes/
│   │   │   ├── authRoutes.js         # Auth endpoints
│   │   │   ├── auctionRoutes.js      # Auction endpoints
│   │   │   └── ...
│   │   └── utils/
│   │       ├── socket.js             # Socket.io setup
│   │       └── auctionAutoEnd.js     # Cron job
│   ├── .env                          # Environment variables
│   ├── package.json
│   └── server.js                     # Entry point
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── auction/              # Auction components
│   │   │   ├── ui/                   # UI components
│   │   │   └── ProtectedRoute.tsx    # Route guard
│   │   ├── contexts/
│   │   │   └── AuthContext.tsx       # Auth state
│   │   ├── hooks/
│   │   │   ├── useAuctions.ts        # Auctions hook
│   │   │   └── useWallet.ts          # Wallet hook
│   │   ├── pages/
│   │   │   ├── LandingPage.tsx
│   │   │   ├── Dashboard.tsx
│   │   │   └── ...
│   │   ├── services/
│   │   │   ├── api.ts                # API client
│   │   │   └── socket.ts             # Socket client
│   │   ├── App.tsx                   # Root component
│   │   └── routes.tsx                # Route config
│   ├── .env                          # Environment variables
│   └── package.json
│
└── Documentation/
    ├── README.md                     # Main documentation
    ├── SETUP.md                      # Setup guide
    ├── GETTING_STARTED.md            # Quick start
    ├── API_QUICK_REFERENCE.md        # API reference
    ├── MONGODB_SETUP.md              # MongoDB guide
    └── ARCHITECTURE.md               # This file
```

## Technology Stack Details

### Frontend Stack
```
React 18.3.1
├── TypeScript (Type safety)
├── Vite 6.3.5 (Build tool)
├── React Router (Navigation)
├── Tailwind CSS (Styling)
├── Radix UI (Component library)
├── Socket.io-client (Real-time)
├── Axios (HTTP client)
└── Sonner (Toast notifications)
```

### Backend Stack
```
Node.js + Express 4.18.2
├── MongoDB + Mongoose 8.0.0 (Database)
├── JWT (Authentication)
├── Bcrypt (Password hashing)
├── Socket.io 4.7.0 (Real-time)
├── Multer (File uploads)
├── Node-cron (Scheduled tasks)
├── CORS (Cross-origin)
└── Helmet (Security)
```

## Security Measures

```
┌──────────────────────────────────────────────────────────────┐
│                     Security Layers                           │
└──────────────────────────────────────────────────────────────┘

1. Password Security
   - Bcrypt hashing (10 rounds)
   - Never stored in plain text

2. Authentication
   - JWT tokens with expiration
   - Secure token storage (localStorage)
   - Token verification on every request

3. Authorization
   - Role-based access control
   - Middleware checks for protected routes
   - Admin-only endpoints

4. Input Validation
   - Express-validator for all inputs
   - Sanitization of user data
   - File upload restrictions

5. HTTP Security
   - Helmet.js for security headers
   - CORS configuration
   - Rate limiting

6. Database Security
   - Mongoose schema validation
   - Query sanitization
   - Connection string in .env
```

## Performance Optimizations

```
Frontend:
- Code splitting with React Router
- Lazy loading of components
- Optimized re-renders with React hooks
- Vite for fast builds

Backend:
- MongoDB indexing on frequently queried fields
- Connection pooling
- Efficient Socket.io room management
- Cron job optimization (10s intervals)

Real-time:
- Socket.io rooms for targeted broadcasts
- Event-based architecture
- Minimal data transfer
```

This architecture provides a scalable, secure, and maintainable foundation for your online auction platform!
