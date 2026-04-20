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
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME.trim(),
    api_key: process.env.CLOUDINARY_API_KEY.trim(),
    api_secret: process.env.CLOUDINARY_API_SECRET.trim(),
  });
  console.log("✓ Cloudinary configured with cloud_name:", process.env.CLOUDINARY_CLOUD_NAME);
} else {
  console.log("⚠ Cloudinary not properly configured. Using local storage.");
  console.log("   To use Cloudinary, set valid CLOUDINARY_CLOUD_NAME, API_KEY, and API_SECRET");
}

module.exports = cloudinary;
