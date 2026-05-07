const express = require("express");
const router = express.Router();

const { placeBid, getAuctionBids } = require("../controllers/bidController");

const { protect } = require("../middleware/authMiddleware");

// Get bids for an auction (public - no auth required to view activity)
router.get("/auction/:auctionId", getAuctionBids);

router.post("/:id", protect, placeBid);

module.exports = router;