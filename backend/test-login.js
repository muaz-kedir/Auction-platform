const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");
require("dotenv").config();

const User = require("./src/models/User");

async function testLogin() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB Connected");

    const email = "superadmine@gmail.com";
    const password = "superadmine123";

    console.log("\n=== Testing Login ===");
    console.log("Email:", email);
    console.log("Password:", password);

    const user = await User.findOne({ email });
    
    if (!user) {
      console.log("❌ User not found!");
      process.exit(1);
    }

    console.log("\n✓ User found:");
    console.log("  Name:", user.name);
    console.log("  Email:", user.email);
    console.log("  Role:", user.role);
    console.log("  Hashed Password:", user.password.substring(0, 20) + "...");

    const isMatch = await bcrypt.compare(password, user.password);
    
    console.log("\n=== Password Check ===");
    console.log("Password matches:", isMatch ? "✓ YES" : "❌ NO");

    if (isMatch) {
      console.log("\n✅ Login would succeed!");
    } else {
      console.log("\n❌ Login would fail - password mismatch");
      console.log("\nTrying to create new password hash...");
      const newHash = await bcrypt.hash(password, 10);
      console.log("New hash:", newHash);
      
      await User.updateOne({ email }, { password: newHash });
      console.log("✓ Password updated! Try logging in again.");
    }

    process.exit(0);
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

testLogin();
