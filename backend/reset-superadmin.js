require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("./src/models/User");

const resetSuperAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ MongoDB Connected");

    // Delete existing super admin
    await User.deleteOne({ email: "superadmine@gmail.com" });
    console.log("🗑️  Deleted existing super admin (if any)");

    // Create fresh super admin with correct password
    const hashedPassword = await bcrypt.hash("superadmine123", 10);
    const superAdmin = await User.create({
      name: "Super Admin",
      email: "superadmine@gmail.com",
      password: hashedPassword,
      role: "super_admin",
      verified: true,
      isBanned: false
    });

    console.log("✅ Super Admin recreated:");
    console.log("   Email: superadmine@gmail.com");
    console.log("   Password: superadmine123");
    console.log("   ID:", superAdmin._id);

    // Verify password
    const testMatch = await bcrypt.compare("superadmine123", superAdmin.password);
    console.log("✅ Password verification test:", testMatch);

    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
};

resetSuperAdmin();
