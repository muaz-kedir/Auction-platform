const express = require("express");
const router = express.Router();

const {
  createAuction,
  getAuctions,
  getAuctionById,
  approveAuction,
  rejectAuction,
  getPendingAuctions
} = require("../controllers/auctionController");

const { protect: auth } = require("../middleware/authMiddleware");
const { auctionUpload } = require("../middleware/cloudinaryUpload");

// Public routes
router.get("/", getAuctions);
router.get("/:id", getAuctionById);

// Protected routes - Create auction
router.post(
  "/",
  auth,
  auctionUpload.array("images", 5),
  createAuction
);

// Super Admin only routes - Auction Approval
router.get("/admin/pending", auth, getPendingAuctions);
router.put("/:id/approve", auth, approveAuction);
router.put("/:id/reject", auth, rejectAuction);

module.exports = router;