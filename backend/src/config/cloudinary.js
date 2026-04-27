const cloudinary = require("cloudinary").v2;

// Check if Cloudinary credentials are valid (not empty and no spaces)
const isValidCloudinaryConfig = () => {
  const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } = process.env;
  
  // Debug: Show what we received
  console.log("🔍 Checking Cloudinary credentials:");
  console.log("   CLOUDINARY_CLOUD_NAME exists:", !!CLOUDINARY_CLOUD_NAME);
  console.log("   CLOUDINARY_API_KEY exists:", !!CLOUDINARY_API_KEY);
  console.log("   CLOUDINARY_API_SECRET exists:", !!CLOUDINARY_API_SECRET);
  
  if (CLOUDINARY_API_SECRET) {
    console.log("   API_SECRET length (raw):", CLOUDINARY_API_SECRET.length);
    console.log("   API_SECRET length (trimmed):", CLOUDINARY_API_SECRET.trim().length);
    console.log("   API_SECRET preview:", CLOUDINARY_API_SECRET.substring(0, 5) + "...");
  }
  
  // Check all required fields exist and are not empty after trimming
  const isValid = CLOUDINARY_CLOUD_NAME?.trim() && 
         CLOUDINARY_API_KEY?.trim() && 
         CLOUDINARY_API_SECRET?.trim() &&
         CLOUDINARY_CLOUD_NAME.trim().length > 3 &&
         CLOUDINARY_API_SECRET.trim().length > 15; // API secrets should be at least 15 chars
  
  console.log("   Validation result:", isValid ? "✓ VALID" : "✗ INVALID");
  
  return isValid;
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
