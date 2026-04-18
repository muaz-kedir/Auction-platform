const Auction = require("../models/Auction");

const Auction = require("../models/Auction");
const { isCloudinaryConfigured } = require("../middleware/cloudinaryUpload");

exports.createAuction = async (req, res) => {
  try {
    console.log("=== CREATE AUCTION REQUEST ===");
    console.log("Body:", req.body);
    console.log("Files:", req.files?.length || 0);
    console.log("User:", req.user?._id);
    console.log("Using Cloudinary:", isCloudinaryConfigured());

    // Get image URLs - works for both Cloudinary and local storage
    const images = req.files
      ? req.files.map(file => {
          if (file.path) {
            // Cloudinary returns full URL in file.path
            console.log("Cloudinary image uploaded:", file.path);
            return file.path;
          } else if (file.filename) {
            // Local storage returns filename
            console.log("Local image uploaded:", file.filename);
            return `/uploads/${file.filename}`;
          }
          return null;
        }).filter(Boolean)
      : [];

    // Get startingBid from either field
    const startingBid = req.body.startingBid || req.body.startingPrice;

    if (!startingBid) {
      console.error("Missing starting bid");
      return res.status(400).json({ error: "Starting bid is required" });
    }

    if (!req.body.title) {
      console.error("Missing title");
      return res.status(400).json({ error: "Title is required" });
    }

    if (!req.body.endTime) {
      console.error("Missing end time");
      return res.status(400).json({ error: "End time is required" });
    }

    if (!req.user || !req.user._id) {
      console.error("Missing user authentication");
      return res.status(401).json({ error: "User not authenticated" });
    }

    // Build auction data
    const auctionData = {
      title: req.body.title,
      description: req.body.description || "",
      startingBid: Number(startingBid),
      currentBid: Number(startingBid),
      endTime: req.body.endTime,
      seller: req.user._id,
      images,
      status: "PENDING",
      approvalStatus: "PENDING"
    };

    // Only add category if it's a valid 24-character hex ObjectId
    if (req.body.category && /^[0-9a-fA-F]{24}$/.test(req.body.category)) {
      auctionData.category = req.body.category;
      console.log("Category added:", req.body.category);
    } else if (req.body.category) {
      console.log("Invalid category format:", req.body.category);
    }

    console.log("Creating auction with data:", JSON.stringify(auctionData, null, 2));

    const auction = await Auction.create(auctionData);

    console.log("✓ Auction created successfully:", auction._id);

    res.status(201).json(auction);

  } catch (error) {
    console.error("=== ERROR CREATING AUCTION ===");
    console.error("Error name:", error.name);
    console.error("Error message:", error.message);
    console.error("Error stack:", error.stack);
    
    // Send more detailed error in development
    if (process.env.NODE_ENV === 'development') {
      res.status(500).json({ 
        error: error.message,
        details: error.stack,
        name: error.name
      });
    } else {
      res.status(500).json({ error: error.message });
    }
  }
};

exports.getAuctions = async (req, res) => {
try {

const { search, category, min, max } = req.query;

let filter = {};

if (search) {
filter.title = {
$regex: search,
$options: "i"
};
}

if (category) {
filter.category = category;
}

if (min || max) {
filter.currentBid = {};

if (min) filter.currentBid.$gte = min;
if (max) filter.currentBid.$lte = max;
}

const auctions = await Auction.find(filter)
.populate("seller")
.populate("category")
.sort({ createdAt: -1 });

res.json(auctions);

} catch (error) {
res.status(500).json({ error: error.message });
}
};

exports.getAuctionById = async (req, res) => {
try {

const auction = await Auction.findById(req.params.id)
.populate("seller")
.populate("category");

res.json(auction);

} catch (error) {
res.status(500).json({ error: error.message });
}
};