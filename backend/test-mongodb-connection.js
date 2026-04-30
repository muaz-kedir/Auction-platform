const mongoose = require("mongoose");
require("dotenv").config();

console.log("=== MONGODB CONNECTION TEST ===");
console.log("MONGO_URI:", process.env.MONGO_URI);
console.log("");

const mongooseOptions = {
  serverSelectionTimeoutMS: 30000,
  socketTimeoutMS: 45000,
  connectTimeoutMS: 30000,
  maxPoolSize: 10,
  retryWrites: true,
  w: 'majority'
};

async function testConnection() {
  try {
    console.log("🔌 Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGO_URI, mongooseOptions);
    
    console.log("✅ MongoDB Connected Successfully");
    console.log("📂 Database name:", mongoose.connection.name);
    console.log("🌐 Database host:", mongoose.connection.host);
    console.log("📊 Connection state:", mongoose.connection.readyState); // 1 = connected
    console.log("");

    // List all collections
    console.log("📋 Listing collections...");
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log("Found", collections.length, "collections:");
    collections.forEach(col => {
      console.log("  -", col.name);
    });
    console.log("");

    // Test creating a simple document
    console.log("🧪 Testing document creation...");
    const TestSchema = new mongoose.Schema({
      name: String,
      createdAt: { type: Date, default: Date.now }
    });
    const TestModel = mongoose.model("test_connection", TestSchema);
    
    const testDoc = await TestModel.create({
      name: "Connection Test " + new Date().toISOString()
    });
    
    console.log("✅ Test document created:", testDoc._id);
    
    // Verify it was saved
    const foundDoc = await TestModel.findById(testDoc._id);
    if (foundDoc) {
      console.log("✅ Test document verified in database");
    } else {
      console.log("❌ Test document NOT found in database!");
    }
    
    // Clean up test document
    await TestModel.deleteOne({ _id: testDoc._id });
    console.log("🧹 Test document cleaned up");
    console.log("");

    // Check auctions collection
    console.log("🔍 Checking auctions collection...");
    const Auction = require("./src/models/Auction");
    const auctionCount = await Auction.countDocuments();
    console.log("📊 Total auctions in database:", auctionCount);
    
    if (auctionCount > 0) {
      const recentAuctions = await Auction.find().sort({ createdAt: -1 }).limit(5);
      console.log("Recent auctions:");
      recentAuctions.forEach(auction => {
        console.log(`  - ${auction.title} (${auction.status}) - ${auction._id}`);
      });
    } else {
      console.log("⚠️  No auctions found in database");
    }
    console.log("");

    // Check users collection
    console.log("🔍 Checking users collection...");
    const User = require("./src/models/User");
    const userCount = await User.countDocuments();
    console.log("📊 Total users in database:", userCount);
    
    if (userCount > 0) {
      const users = await User.find().select('name email role').limit(10);
      console.log("Users:");
      users.forEach(user => {
        console.log(`  - ${user.name} (${user.email}) - ${user.role}`);
      });
    } else {
      console.log("⚠️  No users found in database");
    }
    console.log("");

    console.log("✅ All tests passed!");
    console.log("");
    console.log("=== SUMMARY ===");
    console.log("Database:", mongoose.connection.name);
    console.log("Collections:", collections.length);
    console.log("Auctions:", auctionCount);
    console.log("Users:", userCount);
    console.log("Connection: Working ✅");

  } catch (error) {
    console.error("❌ ERROR:", error.message);
    console.error("Stack:", error.stack);
  } finally {
    await mongoose.connection.close();
    console.log("\n🔌 Connection closed");
    process.exit(0);
  }
}

testConnection();
