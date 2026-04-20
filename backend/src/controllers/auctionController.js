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
    let images = [];
    
    if (req.files && req.files.length > 0) {
      images = req.files.map(file => {
        if (file.path && file.path.startsWith('http')) {
          // Cloudinary returns full URL in file.path
          console.log("Cloudinary image uploaded:", file.path);
          return file.path;
        } else if (file.filename) {
          // Local storage returns filename
          console.log("Local image uploaded:", file.filename);
          return `/uploads/${file.filename}`;
        }
        return null;
      }).filter(Boolean);
    }
    
    console.log("Final images array:", images);

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
    const { search, category, min, max, status, seller, includeAll } = req.query;

    let filter = {};

    // By default, only show ACTIVE auctions to public
    // If user is authenticated and requests their own auctions, show all
    // If user is super_admin and includeAll is true, show all
    const isAuthenticated = !!req.user;
    const isSuperAdmin = isAuthenticated && req.user.role === "super_admin";
    const isSeller = isAuthenticated && req.user.role === "seller";
    const isOwnAuctions = isAuthenticated && seller && seller === req.user._id.toString();

    // Allow sellers to see their own auctions, super_admin to see all
    if (!isSuperAdmin && !isOwnAuctions && !isSeller && !includeAll) {
      // Public users only see ACTIVE auctions
      filter.status = "ACTIVE";
    }

    // If specific status requested
    if (status) {
      filter.status = status;
    }

    // If seller is viewing their own dashboard, show all their auctions
    if (isSeller && !seller) {
      // Seller viewing their own dashboard - show all their auctions
      filter.seller = req.user._id;
    } else if (seller && isOwnAuctions) {
      // Explicit request for specific seller's auctions
      filter.seller = seller;
    }

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
      if (min) filter.currentBid.$gte = Number(min);
      if (max) filter.currentBid.$lte = Number(max);
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

// Approve auction (Super Admin and Admin only)
exports.approveAuction = async (req, res) => {
  try {
    const { id } = req.params;

    console.log("=== APPROVE AUCTION ===");
    console.log("User:", req.user);
    console.log("User ID:", req.user?._id);
    console.log("User Role:", req.user?.role);
    console.log("Auction ID:", id);

    // Only super_admin or admin can approve
    if (req.user.role !== "super_admin" && req.user.role !== "admin") {
      console.log("ACCESS DENIED - User role is:", req.user.role);
      return res.status(403).json({ message: "Only Super Admin or Admin can approve auctions" });
    }
    
    console.log("ACCESS GRANTED - Approving auction...");

    const auction = await Auction.findById(id);
    if (!auction) {
      return res.status(404).json({ message: "Auction not found" });
    }

    // Update auction status
    auction.approvalStatus = "APPROVED";
    auction.status = "ACTIVE";
    auction.reviewedBy = req.user._id;
    auction.rejectionReason = undefined; // Clear any previous rejection reason

    await auction.save();

    res.json({
      message: "Auction approved successfully",
      auction
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Reject auction (Super Admin and Admin only)
exports.rejectAuction = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    // Only super_admin or admin can reject
    if (req.user.role !== "super_admin" && req.user.role !== "admin") {
      return res.status(403).json({ message: "Only Super Admin or Admin can reject auctions" });
    }

    const auction = await Auction.findById(id);
    if (!auction) {
      return res.status(404).json({ message: "Auction not found" });
    }

    // Update auction status
    auction.approvalStatus = "REJECTED";
    auction.status = "REJECTED";
    auction.reviewedBy = req.user._id;
    auction.rejectionReason = reason || "No reason provided";

    await auction.save();

    res.json({
      message: "Auction rejected",
      auction
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get pending auctions for approval (Super Admin and Admin only)
exports.getPendingAuctions = async (req, res) => {
  try {
    // Only super_admin or admin can view pending auctions
    if (req.user.role !== "super_admin" && req.user.role !== "admin") {
      return res.status(403).json({ message: "Only Super Admin or Admin can view pending auctions" });
    }

    const auctions = await Auction.find({
      $or: [
        { status: "PENDING" },
        { approvalStatus: "PENDING" }
      ]
    })
    .populate("seller")
    .populate("category")
    .sort({ createdAt: -1 });

    res.json(auctions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};