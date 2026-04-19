const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("./src/models/User");

const MONGODB_URI = "mongodb://127.0.0.1:27017/auction_db";

async function createUser() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("✓ Connected to MongoDB");

    const email = "kedirmuaz954@gmail.com";
    
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.log(`User ${email} already exists`);
      
      // Update password
      const hashedPassword = await bcrypt.hash("kedir123", 10);
      existingUser.password = hashedPassword;
      await existingUser.save();
      console.log(`✓ Password updated for ${email}`);
      console.log(`  Email: ${email}`);
      console.log(`  Password: kedir123`);
      console.log(`  Role: ${existingUser.role}`);
    } else {
      // Create new user
      const hashedPassword = await bcrypt.hash("kedir123", 10);
      
      const user = await User.create({
        name: "Kedir Muaz",
        email: email,
        password: hashedPassword,
        role: "buyer", // Can be: buyer, seller, admin, super_admin
        verified: true,
        isBanned: false
      });

      console.log(`✓ User created successfully`);
      console.log(`  Name: ${user.name}`);
      console.log(`  Email: ${user.email}`);
      console.log(`  Password: kedir123`);
      console.log(`  Role: ${user.role}`);
    }

    await mongoose.disconnect();
    console.log("\n✓ Done!");
    
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

createUser();
