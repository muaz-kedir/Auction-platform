const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const streamifier = require("streamifier");

// Configure Cloudinary (only needs cloud_name for unsigned uploads)
const CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME || "dclwjaycx";

cloudinary.config({
  cloud_name: CLOUD_NAME,
  secure: true
});

console.log("✓ Cloudinary unsigned upload configured with cloud:", CLOUD_NAME);

// Use memory storage for multer (we'll upload to Cloudinary manually)
const storage = multer.memoryStorage();

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: function (req, file, cb) {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(file.originalname.toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error("Only image files are allowed!"));
    }
  },
});

// Middleware to handle unsigned upload to Cloudinary
const uploadToCloudinary = async (req, res, next) => {
  try {
    if (!req.files || req.files.length === 0) {
      return next();
    }

    console.log(`Uploading ${req.files.length} files to Cloudinary (unsigned)...`);

    // Upload each file to Cloudinary using unsigned upload
    const uploadPromises = req.files.map((file) => {
      return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.unsigned_upload_stream(
          "auction_uploads", // Upload preset name (you need to create this in Cloudinary)
          {
            folder: "auction-platform/auctions",
            resource_type: "auto",
          },
          (error, result) => {
            if (error) {
              console.error("Cloudinary upload error:", error);
              reject(error);
            } else {
              console.log("✓ Uploaded to Cloudinary:", result.secure_url);
              resolve({
                ...file,
                path: result.secure_url,
                cloudinary_id: result.public_id,
              });
            }
          }
        );

        streamifier.createReadStream(file.buffer).pipe(uploadStream);
      });
    });

    req.files = await Promise.all(uploadPromises);
    next();
  } catch (error) {
    console.error("Error uploading to Cloudinary:", error);
    res.status(500).json({ 
      error: "Failed to upload images",
      details: error.message 
    });
  }
};

module.exports = {
  auctionUpload: upload,
  uploadToCloudinary,
};
