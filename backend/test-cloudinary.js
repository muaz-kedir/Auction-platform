// Test Cloudinary connection
require('dotenv').config();
const cloudinary = require('./src/config/cloudinary');

async function testCloudinary() {
  console.log('Testing Cloudinary configuration...');
  console.log('Cloud Name:', process.env.CLOUDINARY_CLOUD_NAME);
  console.log('API Key:', process.env.CLOUDINARY_API_KEY);
  console.log('API Secret:', process.env.CLOUDINARY_API_SECRET ? '***' + process.env.CLOUDINARY_API_SECRET.slice(-4) : 'Missing');

  try {
    // Test by getting account details
    const result = await cloudinary.api.ping();
    console.log('\n✓ Cloudinary connection successful!');
    console.log('Response:', result);
  } catch (error) {
    console.error('\n✗ Cloudinary connection failed!');
    console.error('Error:', error.message);
    console.error('Details:', error);
  }
}

testCloudinary();
