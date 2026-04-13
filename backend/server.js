const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
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


const cron = require("node-cron");

const app = express();

app.use(cors());
app.use(express.json());
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

// MongoDB
mongoose.connect(process.env.MONGO_URI)
.then(() => console.log("MongoDB Connected"))
.catch(err => console.log(err));


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