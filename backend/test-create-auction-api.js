const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

const API_URL = 'http://localhost:5000/api';

console.log("=== TEST AUCTION CREATION VIA API ===\n");

async function testCreateAuctionAPI() {
  try {
    // Step 1: Login to get token
    console.log("Step 1: Logging in as super admin...");
    const loginResponse = await axios.post(`${API_URL}/auth/login`, {
      email: 'superadmine@gmail.com',
      password: 'superadmine123'
    });

    const token = loginResponse.data.token;
    console.log("✅ Login successful");
    console.log("Token (first 20 chars):", token.substring(0, 20) + "...");
    console.log("");

    // Step 2: Create auction
    console.log("Step 2: Creating auction...");
    
    const formData = new FormData();
    formData.append('title', 'Test Auction via API - ' + new Date().toISOString());
    formData.append('description', 'This is a test auction created via direct API call');
    formData.append('startingBid', '150');
    
    // Calculate end time (7 days from now)
    const endTime = new Date();
    endTime.setDate(endTime.getDate() + 7);
    formData.append('endTime', endTime.toISOString());

    // Try to add a test image if it exists
    const testImagePath = path.join(__dirname, 'uploads', '1776716176743-63949117.jpg');
    if (fs.existsSync(testImagePath)) {
      console.log("Adding test image from uploads folder...");
      formData.append('images', fs.createReadStream(testImagePath));
    } else {
      console.log("No test image found, creating auction without images...");
    }

    console.log("\nSending request to:", `${API_URL}/auctions`);
    console.log("Authorization: Bearer", token.substring(0, 20) + "...");
    console.log("");

    const createResponse = await axios.post(`${API_URL}/auctions`, formData, {
      headers: {
        ...formData.getHeaders(),
        'Authorization': `Bearer ${token}`
      }
    });

    console.log("✅ Auction created successfully!");
    console.log("\nResponse:");
    console.log(JSON.stringify(createResponse.data, null, 2));
    console.log("");
    console.log("📊 Auction ID:", createResponse.data._id);
    console.log("📝 Title:", createResponse.data.title);
    console.log("💰 Starting Bid:", createResponse.data.startingBid);
    console.log("📅 Status:", createResponse.data.status);
    console.log("");
    console.log("✅ TEST PASSED - Auction creation via API works!");

  } catch (error) {
    console.error("❌ TEST FAILED");
    console.error("");
    
    if (error.response) {
      console.error("Response Status:", error.response.status);
      console.error("Response Data:", JSON.stringify(error.response.data, null, 2));
      console.error("");
      
      if (error.response.status === 401) {
        console.error("🔐 Authentication Error:");
        console.error("   - Token might be invalid or expired");
        console.error("   - Check if authMiddleware is working");
        console.error("   - Try logging in again");
      } else if (error.response.status === 400) {
        console.error("📝 Validation Error:");
        console.error("   - Check if all required fields are provided");
        console.error("   - Check field formats (dates, numbers, etc.)");
      } else if (error.response.status === 500) {
        console.error("🔥 Server Error:");
        console.error("   - Check backend terminal for error logs");
        console.error("   - Check MongoDB connection");
        console.error("   - Check Cloudinary configuration");
      }
    } else if (error.request) {
      console.error("📡 Network Error:");
      console.error("   - Backend server might not be running");
      console.error("   - Check if server is running on http://localhost:5000");
      console.error("   - Run: cd backend && npm start");
    } else {
      console.error("Error:", error.message);
    }
    
    console.error("");
    console.error("Full error:", error);
  }
}

testCreateAuctionAPI();
