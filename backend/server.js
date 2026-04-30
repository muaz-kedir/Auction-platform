const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

const notificationRoutes = require("./src/routes/notificationRoutes");
const withdrawRoutes = require("./src/routes/withdrawRoutes");
const authRoutes = require("./src/routes/authRoutes");
const auctionRoutes = require("./src/routes/auctionRoutes");
const bidRoutes = require("./src/routes/bidRoutes");
const paymentRoutes = require("./src/routes/paymentRoutes");
const escrowRoutes = require("./src/routes/escrowRoutes");
const walletRoutes = require("./src/routes/walletRoutes");
const autoEndAuctions = require("./src/utils/auctionAutoEnd");
const { initSocket } = require("./src/utils/socket");
const categoryRoutes = require("./src/routes/categoryRoutes");
const ratingRoutes = require("./src/routes/ratingRoutes");
const disputeRoutes = require("./src/routes/disputeRoutes");
const adminRoutes = require("./src/routes/adminRoutes");
const profileRoutes = require("./src/routes/profileRoutes");
const announcementRoutes = require("./src/routes/announcementRoutes");
const dashboardRoutes = require("./src/routes/dashboardRoutes");

const cron = require("node-cron");
const bcrypt = require("bcryptjs");
const User = require("./src/models/User");

const app = express();

// CORS configuration - allow frontend origins
const allowedOrigins = [
  'https://auction-platform-expk.vercel.app',
  'https://auction-platform-seven-rosy.vercel.app',
  'http://localhost:3000',
  'http://localhost:5173'
];

// Allow any subdomain of vercel.app that belongs to this project, plus the
// explicit origins above. This makes preview deployments work too.
const isAllowedOrigin = (origin) => {
  if (!origin) return true; // non-browser tools (curl, server-to-server)
  if (allowedOrigins.includes(origin)) return true;
  try {
    const { hostname } = new URL(origin);
    // Allow any *.vercel.app deployment (preview / production aliases)
    if (hostname.endsWith('.vercel.app')) return true;
  } catch (_) {
    return false;
  }
  return false;
};

const corsOptions = {
  origin: function (origin, callback) {
    console.log('🔍 Incoming request from origin:', origin);
    if (isAllowedOrigin(origin)) {
      console.log('✅ Origin allowed:', origin);
      callback(null, true);
    } else {
      console.log('❌ CORS blocked origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  optionsSuccessStatus: 204
};

// Debug middleware - log all incoming requests
app.use((req, res, next) => {
  console.log(`📥 ${req.method} ${req.path} - Origin: ${req.headers.origin || 'none'}`);
  next();
});

// Apply CORS middleware BEFORE routes
app.use(cors(corsOptions));

// Handle preflight OPTIONS requests explicitly
app.options('*', cors(corsOptions));

// Safety net: ensure CORS headers are always present, even on error responses
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (isAllowedOrigin(origin) && origin) {
    res.header('Access-Control-Allow-Origin', origin);
    res.header('Vary', 'Origin');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,PATCH,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept');
  }
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  next();
});

app.use(express.json());

// Serve uploaded files as static
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.use("/api/notifications", notificationRoutes);
app.use("/api/wallet", walletRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/auctions", auctionRoutes);
app.use("/api/bids", bidRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/escrow", escrowRoutes);
app.use("/api/withdraw", withdrawRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/ratings", ratingRoutes);
app.use("/api/disputes", disputeRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/announcements", announcementRoutes);
app.use("/api/dashboard", dashboardRoutes);

// MongoDB Connection with Atlas-optimized options
const mongooseOptions = {
  serverSelectionTimeoutMS: 30000, // 30 seconds
  socketTimeoutMS: 45000, // 45 seconds
  connectTimeoutMS: 30000, // 30 seconds
  maxPoolSize: 10,
  retryWrites: true,
  w: 'majority'
};

mongoose.connect(process.env.MONGO_URI, mongooseOptions)
.then(() => {
  const dbName = mongoose.connection.name;
  console.log("✅ MongoDB Connected Successfully");
  console.log("📂 Connected to database:", dbName);
  console.log("🌐 Database host:", mongoose.connection.host);
  // Seed admins after connection
  seedAdmins();
  // Start cron job only after MongoDB connects
  startCronJob();
})
.catch(err => {
  console.error("❌ MongoDB Connection Error:", err.message);
  console.error("Please check your MONGO_URI environment variable");
});

// Auto-seed admins on startup
const seedAdmins = async () => {
  try {
    // Check if super admin exists by email first
    const superAdminExists = await User.findOne({ email: "superadmine@gmail.com" });
    if (!superAdminExists) {
      const hashedPassword = await bcrypt.hash("superadmine123", 10);
      await User.create({
        name: "Super Admin",
        email: "superadmine@gmail.com",
        password: hashedPassword,
        role: "super_admin",
        verified: true,
        isBanned: false
      });
      console.log(" Super Admin created: superadmine@gmail.com / superadmine123");
    } else {
      console.log(" Super Admin already exists");
    }

    // Check if admin exists
    const adminExists = await User.findOne({ email: "admin@gmail.com" });
    if (!adminExists) {
      const hashedPassword = await bcrypt.hash("admin123", 10);
      await User.create({
        name: "Admin",
        email: "admin@gmail.com",
        password: hashedPassword,
        role: "admin",
        verified: true,
        isBanned: false
      });
      console.log(" Admin created: admin@gmail.com / admin123");
    } else {
      console.log(" Admin already exists");
    }
  } catch (error) {
    console.error("Error seeding admins:", error);
  }
};

// Cron Job (auto end auction) - start only after MongoDB connects
let cronJob = null;
const startCronJob = () => {
  if (cronJob) return; // Already started
  cronJob = cron.schedule("*/10 * * * * *", () => {
    autoEndAuctions();
  });
  console.log("⏰ Auto-end auction cron job started");
};

// Server
const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () =>
console.log(`Server running on port ${PORT}`)
);


// Socket.io
const { Server } = require("socket.io");

const io = new Server(server, {
cors: {
origin: "*"
}
});

initSocket(io);

io.on("connection", (socket) => {

console.log("✅ User connected:", socket.id);

// join auction room
socket.on("joinAuction", (auctionId) => {
console.log(`🔌 Socket ${socket.id} joining auction room:`, auctionId);
socket.join(auctionId);
console.log(`✅ Socket ${socket.id} joined room ${auctionId}`);
console.log(`📊 Room ${auctionId} now has ${io.sockets.adapter.rooms.get(auctionId)?.size || 0} clients`);
});

// leave auction room
socket.on("leaveAuction", (auctionId) => {
console.log(`🔌 Socket ${socket.id} leaving auction room:`, auctionId);
socket.leave(auctionId);
console.log(`✅ Socket ${socket.id} left room ${auctionId}`);
console.log(`📊 Room ${auctionId} now has ${io.sockets.adapter.rooms.get(auctionId)?.size || 0} clients`);
});

// get room info
socket.on("getRoomInfo", (auctionId, callback) => {
const room = io.sockets.adapter.rooms.get(auctionId);
callback({
  auctionId,
  clientsInRoom: room?.size || 0,
  socketId: socket.id
});
});

// new bid
socket.on("newBid", (data) => {
console.log("📨 Received newBid event:", data);
io.to(data.auctionId).emit("bidUpdate", data);
});

socket.on("disconnect", () => {
console.log("❌ User disconnected:", socket.id);
});

});
