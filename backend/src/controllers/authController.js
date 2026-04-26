const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");

// Register
exports.register = async (req, res) => {
try {

const { name, email, password, role } = req.body;

const userExists = await User.findOne({ email });

if (userExists) {
return res.status(400).json({ message: "User already exists" });
}

const hashedPassword = await bcrypt.hash(password, 10);

const user = await User.create({
name,
email,
password: hashedPassword,
role
});

const userResponse = {
  _id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  createdAt: user.createdAt
};

res.status(201).json({
message: "User registered",
user: userResponse
});

} catch (error) {
res.status(500).json({ error: error.message });
}
};


// Login
exports.login = async (req, res) => {
try {

const { email, password } = req.body;
console.log(" Login attempt for:", email);

// Check if MongoDB is connected
if (mongoose.connection.readyState !== 1) {
  console.error(" MongoDB not connected. ReadyState:", mongoose.connection.readyState);
  return res.status(500).json({ error: "Database connection error. Please try again later." });
}

const user = await User.findOne({ email });
console.log(" User found:", user ? "Yes - " + user.email : "No");
if (!user) {
console.log(" User not found in database:", email);
return res.status(400).json({ message: "Invalid credentials" });
}

console.log(" Stored password hash exists:", user.password ? "Yes" : "No");
const isMatch = await bcrypt.compare(password, user.password);
console.log(" Password match result:", isMatch);

if (!isMatch) {
console.log(" Password mismatch for user:", email);
return res.status(400).json({ message: "Invalid credentials" });
}

const token = jwt.sign(
{ id: user._id, role: user.role },
process.env.JWT_SECRET,
{ expiresIn: "7d" }
);

const userResponse = {
  _id: user._id,
  name: user.name,
  email: user.email,
  role: user.role
};

res.json({
token,
user: userResponse
});

} catch (error) {
res.status(500).json({ error: error.message });
}
};