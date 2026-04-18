const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("./src/models/User");
require("dotenv").config();

const createCustomAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB Connected");

    // Check if user already exists
    const existingUser = await User.findOne({ email: "ayub@gmail.com" });
    
    if (existingUser) {
      console.log("User ayub@gmail.com already exists!");
      console.log("Updating password...");
      
      const hashedPassword = await bcrypt.hash("ayub123", 10);
      existingUser.password = hashedPassword;
      existingUser.role = "super_admin";
      await existingUser.save();
      
      console.log("✅ User updated successfully!");
      console.log("Email: ayub@gmail.com");
      console.log("Password: ayub123");
      console.log("Role: super_admin");
    } else {
      console.log("Creating new admin user...");
      
      const hashedPassword = await bcrypt.hash("ayub123", 10);
      
      const newUser = await User.create({
        name: "Ayub",
        email: "ayub@gmail.com",
        password: hashedPassword,
        role: "super_admin",
        verified: true
      });
      
      console.log("✅ User created successfully!");
      console.log("Email: ayub@gmail.com");
      console.log("Password: ayub123");
      console.log("Role: super_admin");
    }

    process.exit(0);
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
};

createCustomAdmin();
