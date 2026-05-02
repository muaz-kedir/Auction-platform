const express = require("express");
const router = express.Router();
const statsController = require("../controllers/statsController");
const { protect } = require("../middleware/authMiddleware");
const { adminOnly } = require("../middleware/roleMiddleware");

// Public endpoint for homepage stats
router.get("/public", statsController.getPublicStats);

// Protected endpoint for admin dashboard (requires authentication)
router.get("/overview", protect, statsController.getOverviewStats);

// Admin-only endpoint for detailed stats
router.get("/admin", protect, adminOnly, statsController.getOverviewStats);

module.exports = router;
