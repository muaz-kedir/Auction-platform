const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const dashboardController = require("../controllers/dashboardController");

// Get user dashboard stats
router.get("/stats", protect, dashboardController.getUserDashboardStats);

// Get user active bids
router.get("/active-bids", protect, dashboardController.getUserActiveBids);

module.exports = router;
