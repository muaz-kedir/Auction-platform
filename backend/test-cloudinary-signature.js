require('dotenv').config();
const crypto = require('crypto');

// Test Cloudinary signature generation
const testCloudinarySignature = () => {
  console.log('\n=== CLOUDINARY CONFIGURATION TEST ===\n');
  
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  
  console.log('Cloud Name:', cloudName);
  console.log('API Key:', apiKey);
  console.log('API Secret:', apiSecret ? `${apiSecret.substring(0, 5)}...${apiSecret.substring(apiSecret.length - 5)}` : 'MISSING');
  console.log('API Secret Length:', apiSecret?.length || 0);
  
  if (!cloudName || !apiKey || !apiSecret) {
    console.error('\n❌ ERROR: Missing Cloudinary credentials!');
    console.log('\nRequired environment variables:');
    console.log('- CLOUDINARY_CLOUD_NAME');
    console.log('- CLOUDINARY_API_KEY');
    console.log('- CLOUDINARY_API_SECRET');
    return;
  }
  
  // Test signature generation (same as Cloudinary does internally)
  const timestamp = Math.round(Date.now() / 1000);
  const paramsToSign = {
    timestamp: timestamp,
    folder: 'auction-platform/auctions',
    allowed_formats: 'jpg,jpeg,png,gif,webp',
    transformation: 'c_limit,h_1000,w_1000'
  };
  
  // Sort params alphabetically and create string to sign
  const sortedParams = Object.keys(paramsToSign)
    .sort()
    .map(key => `${key}=${paramsToSign[key]}`)
    .join('&');
  
  const stringToSign = sortedParams + apiSecret;
  
  console.log('\n=== SIGNATURE TEST ===');
  console.log('Timestamp:', timestamp);
  console.log('String to sign:', stringToSign);
  
  // Generate signature
  const signature = crypto
    .createHash('sha1')
    .update(stringToSign)
    .digest('hex');
  
  console.log('Generated signature:', signature);
  console.log('\n✅ Signature generation successful!');
  console.log('\nIf you still get "Invalid Signature" errors, the issue is:');
  console.log('1. API Secret on Render is different from local .env');
  console.log('2. API Secret has extra spaces or newlines');
  console.log('3. Cloudinary credentials are incorrect');
};

testCloudinarySignature();
