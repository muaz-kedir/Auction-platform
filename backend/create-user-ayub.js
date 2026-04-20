const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("./src/models/User");
require("dotenv").config();

async function createUsers() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB Connected");

    const users = [
      { name: "Ayub", email: "ayub@gmail.com", password: "password123", role: "buyer" },
      { name: "Super Admin", email: "kedirmuaz954@gmail.com", password: "mk12@mk12", role: "super_admin" }
    ];

    for (const userData of users) {
      const existingUser = await User.findOne({ email: userData.email });
      if (existingUser) {
        console.log("User already exists:", userData.email);
        const hashedPassword = await bcrypt.hash(userData.password, 10);
        existingUser.password = hashedPassword;
        await existingUser.save();
        console.log("Password updated for:", userData.email);
      } else {
        const hashedPassword = await bcrypt.hash(userData.password, 10);
        const user = await User.create({
          name: userData.name,
          email: userData.email,
          password: hashedPassword,
          role: userData.role
        });
        console.log("User created:", user.email, "Role:", user.role);
      }
    }

    console.log("\n--- Login Credentials ---");
    users.forEach(u => {
      console.log(`${u.role.toUpperCase()}: ${u.email} / ${u.password}`);
    });

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error("Error:", error.message);
    process.exit(1);
  }
}

createUsers();
