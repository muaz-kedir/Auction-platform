require("dotenv").config();
const mongoose = require("mongoose");

const testConnection = async () => {
  try {
    console.log("Testing MongoDB connection...");
    console.log("MONGO_URI exists:", !!process.env.MONGO_URI);
    
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
    });
    
    console.log("✅ MongoDB Connected Successfully!");
    console.log("Database:", mongoose.connection.name);
    console.log("Host:", mongoose.connection.host);
    
    await mongoose.disconnect();
    console.log("Disconnected successfully");
    process.exit(0);
  } catch (error) {
    console.error("❌ Connection failed:");
    console.error("Error:", error.message);
    console.error("Code:", error.code);
    process.exit(1);
  }
};

testConnection();
