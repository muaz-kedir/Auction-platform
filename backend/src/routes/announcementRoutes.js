const express = require("express");
const router = express.Router();
const announcementController = require("../controllers/announcementController");
const { protect } = require("../middleware/authMiddleware");
const { adminOnly } = require("../middleware/roleMiddleware");

// Public route - get active announcements
router.get("/public", announcementController.getAllAnnouncements);

// Admin routes
router.get("/", protect, adminOnly, announcementController.getAllAnnouncements);
router.get("/:id", protect, adminOnly, announcementController.getAnnouncement);
router.post("/", protect, adminOnly, announcementController.createAnnouncement);
router.put("/:id", protect, adminOnly, announcementController.updateAnnouncement);
router.delete("/:id", protect, adminOnly, announcementController.deleteAnnouncement);

module.exports = router;
