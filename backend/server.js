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

const cron = require("node-cron");
const bcrypt = require("bcryptjs");
const User = require("./src/models/User");

const app = express();

// CORS configuration for production
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://auction-platform-seven-rosy.vercel.app', 'https://your-frontend-url.vercel.app'] 
    : ['http://localhost:3000', 'http://localhost:5173'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
};
app.use(cors(corsOptions));
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
app.use("/uploads", express.static("uploads"));
app.use("/api/categories", categoryRoutes);
app.use("/api/ratings", ratingRoutes);
app.use("/api/disputes", disputeRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/announcements", announcementRoutes);

// MongoDB Connection with Atlas-optimized options
const mongooseOptions = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 30000, // 30 seconds
  socketTimeoutMS: 45000, // 45 seconds
  connectTimeoutMS: 30000, // 30 seconds
  maxPoolSize: 10,
  retryWrites: true,
  w: 'majority'
};

mongoose.connect(process.env.MONGO_URI, mongooseOptions)
.then(() => {
  console.log("✅ MongoDB Connected Successfully");
  // Seed admins after connection
  seedAdmins();
})
.catch(err => {
  console.error("❌ MongoDB Connection Error:", err.message);
  console.error("Please check your MONGO_URI environment variable");
});

// Auto-seed admins on startup
const seedAdmins = async () => {
  try {
    // Aggressively ensure super admin exists with correct credentials
    const hashedPassword = await bcrypt.hash("superadmine123", 10);
    await User.findOneAndUpdate(
      { role: "super_admin" },
      {
        name: "Super Admin",
        email: "superadmine@gmail.com",
        password: hashedPassword,
        verified: true,
        isBanned: false
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    console.log(" Super Admin forced: superadmine@gmail.com / superadmine123");

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

// Cron Job (auto end auction)
cron.schedule("*/10 * * * * *", () => {
  autoEndAuctions();
});


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

console.log("User connected:", socket.id);

// join auction room
socket.on("joinAuction", (auctionId) => {
socket.join(auctionId);
});

// new bid
socket.on("newBid", (data) => {
io.to(data.auctionId).emit("bidUpdate", data);
});

socket.on("disconnect", () => {
console.log("User disconnected");
});

});