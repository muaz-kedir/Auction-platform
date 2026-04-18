const jwt = require("jsonwebtoken");
const User = require("../models/User");

const protect = async (req, res, next) => {
  try {
    let token = req.headers.authorization;

    console.log("Auth middleware - Authorization header:", token ? "Present" : "Missing");

    if (!token) {
      console.log("Auth middleware - No token provided");
      return res.status(401).json({ message: "Not authorized" });
    }

    // Remove Bearer prefix if present
    token = token.startsWith("Bearer ") ? token.slice(7).trim() : token.trim();
    
    console.log("Auth middleware - Token (first 20 chars):", token.substring(0, 20) + "...");

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("Auth middleware - Token decoded, user ID:", decoded.id);

    req.user = await User.findById(decoded.id).select("-password");

    if (!req.user) {
      console.log("Auth middleware - User not found for ID:", decoded.id);
      return res.status(401).json({ message: "User not found" });
    }

    console.log("Auth middleware - User authenticated:", req.user.email);
    next();
  } catch (error) {
    console.error("Auth middleware - Error:", error.message);
    res.status(401).json({ message: "Invalid token" });
  }
};

module.exports = { protect };