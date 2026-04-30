const mongoose = require("mongoose");
require("dotenv").config();

const Auction = require("./src/models/Auction");
const User = require("./src/models/User");

console.log("=== TEST AUCTION CREATION ===\n");

async function testCreateAuction() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 30000,
    });
    
    console.log("✅ Connected to MongoDB");
    console.log("📂 Database:", mongoose.connection.name);
    console.log("");

    // Find a seller (admin or super_admin)
    const seller = await User.findOne({ role: { $in: ["admin", "super_admin", "seller"] } });
    
    if (!seller) {
      console.error("❌ No seller found in database!");
      console.log("Creating a test seller...");
      
      const bcrypt = require("bcryptjs");
      const hashedPassword = await bcrypt.hash("seller123", 10);
      const newSeller = await User.create({
        name: "Test Seller",
        email: "seller@test.com",
        password: hashedPassword,
        role: "seller",
        verified: true,
        isBanned: false
      });
      
      console.log("✅ Test seller created:", newSeller.email);
      seller = newSeller;
    } else {
      console.log("✅ Found seller:", seller.name, `(${seller.email})`);
    }
    console.log("");

    // Create a test auction
    console.log("🧪 Creating test auction...");
    
    const auctionData = {
      title: "Test Auction - " + new Date().toISOString(),
      description: "This is a test auction created by the test script",
      startingBid: 100,
      currentBid: 100,
      endTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      seller: seller._id,
      images: ["https://via.placeholder.com/400"],
      status: "PENDING",
      approvalStatus: "PENDING"
    };

    console.log("Auction data:", JSON.stringify(auctionData, null, 2));
    console.log("");

    const auction = await Auction.create(auctionData);
    
    console.log("✅ Auction created successfully!");
    console.log("📊 Auction ID:", auction._id);
    console.log("📝 Title:", auction.title);
    console.log("💰 Starting Bid:", auction.startingBid);
    console.log("👤 Seller:", auction.seller);
    console.log("📅 Status:", auction.status);
    console.log("");

    // Verify it was saved
    const foundAuction = await Auction.findById(auction._id).populate('seller', 'name email');
    
    if (foundAuction) {
      console.log("✅ VERIFIED: Auction exists in database");
      console.log("📊 Found auction:", foundAuction.title);
      console.log("👤 Seller:", foundAuction.seller.name);
    } else {
      console.log("❌ ERROR: Auction NOT found in database after creation!");
    }
    console.log("");

    // Count total auctions
    const totalAuctions = await Auction.countDocuments();
    console.log("📊 Total auctions in database:", totalAuctions);
    console.log("");

    console.log("✅ TEST PASSED - Auction creation works!");
    console.log("");
    console.log("🔍 To view this auction in MongoDB Compass:");
    console.log("   Database: online_auction_platform");
    console.log("   Collection: auctions");
    console.log("   Filter: { _id: ObjectId('" + auction._id + "') }");

  } catch (error) {
    console.error("❌ ERROR:", error.message);
    console.error("Stack:", error.stack);
  } finally {
    await mongoose.connection.close();
    console.log("\n🔌 Connection closed");
    process.exit(0);
  }
}

testCreateAuction();
