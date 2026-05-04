const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const dashboardController = require("../controllers/dashboardController");

// Get user dashboard stats
router.get("/stats", protect, dashboardController.getUserDashboardStats);

// Get user active bids
router.get("/active-bids", protect, dashboardController.getUserActiveBids);

// Get user won auctions
router.get("/won-auctions", protect, dashboardController.getUserWonAuctions);

// Get user lost auctions
router.get("/lost-auctions", protect, dashboardController.getUserLostAuctions);

// Get user recent activity
router.get("/recent-activity", protect, dashboardController.getRecentActivity);

module.exports = router;
