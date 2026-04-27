const cloudinary = require("cloudinary").v2;

// Check if Cloudinary credentials are valid (not empty and no spaces)
const isValidCloudinaryConfig = () => {
  const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } = process.env;
  
  // Check all required fields exist
  return CLOUDINARY_CLOUD_NAME?.trim() && 
         CLOUDINARY_API_KEY?.trim() && 
         CLOUDINARY_API_SECRET?.trim() &&
         !CLOUDINARY_CLOUD_NAME.trim().includes(' ') &&  // Invalid if has spaces
         CLOUDINARY_CLOUD_NAME.trim().length > 3;  // Must be at least 3 chars
};

if (isValidCloudinaryConfig()) {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME.trim();
  const apiKey = process.env.CLOUDINARY_API_KEY.trim();
  const apiSecret = process.env.CLOUDINARY_API_SECRET.trim();
  
  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
  });
  
  console.log("✓ Cloudinary configured successfully");
  console.log("  Cloud Name:", cloudName);
  console.log("  API Key:", apiKey);
  console.log("  API Secret Length:", apiSecret.length, "characters");
  console.log("  API Secret Preview:", apiSecret.substring(0, 5) + "..." + apiSecret.substring(apiSecret.length - 3));
} else {
  console.log("⚠ Cloudinary not properly configured. Using local storage.");
  console.log("   Missing or invalid credentials:");
  console.log("   - CLOUDINARY_CLOUD_NAME:", process.env.CLOUDINARY_CLOUD_NAME ? "✓" : "✗");
  console.log("   - CLOUDINARY_API_KEY:", process.env.CLOUDINARY_API_KEY ? "✓" : "✗");
  console.log("   - CLOUDINARY_API_SECRET:", process.env.CLOUDINARY_API_SECRET ? "✓" : "✗");
}

module.exports = cloudinary;
