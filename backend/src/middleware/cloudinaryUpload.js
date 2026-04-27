const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../config/cloudinary");
const path = require("path");
const fs = require("fs");

// Check if Cloudinary is configured properly
const isCloudinaryConfigured = () => {
  const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } = process.env;
  
  // Check if all credentials exist and are valid
  const hasCredentials = CLOUDINARY_CLOUD_NAME?.trim() &&
         CLOUDINARY_API_KEY?.trim() &&
         CLOUDINARY_API_SECRET?.trim() &&
         CLOUDINARY_CLOUD_NAME.trim().length > 3;
  
  if (hasCredentials) {
    console.log("✓ Cloudinary credentials found");
    console.log("  Cloud Name:", CLOUDINARY_CLOUD_NAME.trim());
    console.log("  API Key:", CLOUDINARY_API_KEY.trim());
    console.log("  API Secret Length:", CLOUDINARY_API_SECRET.trim().length, "characters");
  }
  
  return hasCredentials;
};

// Cloudinary storage for auction images
let auctionStorage;
let profileStorage;

if (isCloudinaryConfigured()) {
  console.log("✓ Initializing Cloudinary storage...");
  
  try {
    auctionStorage = new CloudinaryStorage({
      cloudinary: cloudinary,
      params: {
        folder: "auction-platform/auctions",
        allowed_formats: ["jpg", "jpeg", "png", "gif", "webp"],
        transformation: [{ width: 1000, height: 1000, crop: "limit" }],
      },
    });

    profileStorage = new CloudinaryStorage({
      cloudinary: cloudinary,
      params: {
        folder: "auction-platform/profiles",
        allowed_formats: ["jpg", "jpeg", "png", "gif"],
        transformation: [{ width: 500, height: 500, crop: "limit" }],
      },
    });
    
    console.log("✓ Cloudinary storage initialized successfully");
  } catch (error) {
    console.error("✗ Cloudinary initialization failed:", error.message);
    console.log("⚠ Falling back to local storage");
    auctionStorage = null;
    profileStorage = null;
  }
}

// Fallback to local storage if Cloudinary not configured or failed
if (!auctionStorage || !profileStorage) {
  console.log("⚠ Using local storage for images");
  
  // Fallback to local storage
  const uploadsDir = path.join(__dirname, "../../uploads");
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
    console.log("✓ Created uploads directory:", uploadsDir);
  }

  const localStorage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, uploadsDir);
    },
    filename: function (req, file, cb) {
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      cb(null, uniqueSuffix + path.extname(file.originalname));
    },
  });

  auctionStorage = localStorage;
  profileStorage = localStorage;
}

const auctionUpload = multer({
  storage: auctionStorage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: function (req, file, cb) {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error("Only image files are allowed!"));
    }
  },
});

const profileUpload = multer({
  storage: profileStorage,
  limits: {
    fileSize: 2 * 1024 * 1024, // 2MB limit
  },
  fileFilter: function (req, file, cb) {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error("Only image files are allowed!"));
    }
  },
});

module.exports = {
  auctionUpload,
  profileUpload,
  isCloudinaryConfigured,
};
