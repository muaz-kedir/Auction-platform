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

app.use(cors());
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

// MongoDB
mongoose.connect(process.env.MONGO_URI)
.then(() => {
  console.log("MongoDB Connected");
  // Seed admins after connection
  seedAdmins();
})
.catch(err => console.log(err));

// Auto-seed admins on startup
const seedAdmins = async () => {
  try {
    // Check if super admin exists
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