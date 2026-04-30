const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
require("dotenv").config();

const User = require("./src/models/User");

console.log("=== CREATE SELLER ACCOUNT ===\n");

async function createSeller() {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 30000,
    });
    
    console.log("✅ Connected to MongoDB\n");

    // Check if seller already exists
    const existingSeller = await User.findOne({ email: "seller@gmail.com" });
    
    if (existingSeller) {
      console.log("✅ Seller account already exists:");
      console.log("   Email:", existingSeller.email);
      console.log("   Name:", existingSeller.name);
      console.log("   Role:", existingSeller.role);
      console.log("   Password: seller123");
      console.log("\n✅ You can login with these credentials!");
    } else {
      console.log("Creating new seller account...\n");
      
      const hashedPassword = await bcrypt.hash("seller123", 10);
      
      const seller = await User.create({
        name: "Test Seller",
        email: "seller@gmail.com",
        password: hashedPassword,
        role: "seller",
        verified: true,
        isBanned: false
      });
      
      console.log("✅ Seller account created successfully!");
      console.log("   Email: seller@gmail.com");
      console.log("   Password: seller123");
      console.log("   Name:", seller.name);
      console.log("   Role:", seller.role);
      console.log("\n✅ You can now login and create auctions!");
    }
    
    console.log("\n📊 All users in database:");
    const allUsers = await User.find().select('name email role');
    allUsers.forEach(user => {
      console.log(`   - ${user.name} (${user.email}) - ${user.role}`);
    });

  } catch (error) {
    console.error("❌ ERROR:", error.message);
  } finally {
    await mongoose.connection.close();
    console.log("\n🔌 Connection closed");
    process.exit(0);
  }
}

createSeller();
