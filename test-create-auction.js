// Test script to verify auction creation
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

async function testCreateAuction() {
  try {
    // First login to get token
    const loginResponse = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'ayub@gmail.com',
        password: 'ayub123'
      })
    });

    const loginData = await loginResponse.json();
    console.log('Login response:', loginData);

    if (!loginData.token) {
      console.error('Failed to login');
      return;
    }

    const token = loginData.token;

    // Create auction
    const formData = new FormData();
    formData.append('title', 'Test Auction');
    formData.append('description', 'This is a test auction');
    formData.append('startingBid', '100');
    
    // Calculate end time (7 days from now)
    const endTime = new Date();
    endTime.setDate(endTime.getDate() + 7);
    formData.append('endTime', endTime.toISOString());

    // Add a test image if available
    const testImagePath = path.join(__dirname, 'backend/uploads/1776426754949-photo_5807733633710754750_w.jpg');
    if (fs.existsSync(testImagePath)) {
      formData.append('images', fs.createReadStream(testImagePath));
    }

    console.log('\nCreating auction...');
    const auctionResponse = await fetch('http://localhost:5000/api/auctions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        ...formData.getHeaders()
      },
      body: formData
    });

    const auctionData = await auctionResponse.json();
    console.log('Auction response status:', auctionResponse.status);
    console.log('Auction response:', auctionData);

    if (auctionResponse.ok) {
      console.log('\n✓ Auction created successfully!');
    } else {
      console.error('\n✗ Failed to create auction');
    }

  } catch (error) {
    console.error('Error:', error.message);
  }
}

testCreateAuction();
