const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
require("dotenv").config();

const seedAdmins = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB Connected for seeding...");

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
      console.log("✓ Super Admin created successfully");
    } else {
      console.log("✓ Super Admin already exists");
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
      console.log("✓ Admin created successfully");
    } else {
      console.log("✓ Admin already exists");
    }

    console.log("\n=== Admin Accounts ===");
    console.log("Super Admin:");
    console.log("  Email: superadmine@gmail.com");
    console.log("  Password: superadmine123");
    console.log("\nAdmin:");
    console.log("  Email: admin@gmail.com");
    console.log("  Password: admin123");
    console.log("=====================\n");

    process.exit(0);
  } catch (error) {
    console.error("Error seeding admins:", error);
    process.exit(1);
  }
};

seedAdmins();
