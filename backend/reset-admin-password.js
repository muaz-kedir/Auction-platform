const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");
require("dotenv").config();

async function resetPassword() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB");

    const User = mongoose.model("User", new mongoose.Schema({
      name: String,
      email: String,
      password: String,
      role: String,
      verified: Boolean,
      isBanned: Boolean
    }, { timestamps: true }));

    // Hash the password
    const password = "superadmine123";
    const hashedPassword = await bcrypt.hash(password, 10);
    
    console.log("Updating super admin password...");
    
    // Update super admin
    const result1 = await User.updateOne(
      { email: "superadmine@gmail.com" },
      { password: hashedPassword }
    );
    console.log("Super Admin updated:", result1.modifiedCount > 0 ? "✓" : "Already up to date");

    // Update admin
    const result2 = await User.updateOne(
      { email: "admin@gmail.com" },
      { password: await bcrypt.hash("admin123", 10) }
    );
    console.log("Admin updated:", result2.modifiedCount > 0 ? "✓" : "Already up to date");

    console.log("\n=== Passwords Reset ===");
    console.log("Super Admin: superadmine@gmail.com / superadmine123");
    console.log("Admin: admin@gmail.com / admin123");
    console.log("\nYou can now login!");

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error("Error:", error.message);
    process.exit(1);
  }
}

resetPassword();
