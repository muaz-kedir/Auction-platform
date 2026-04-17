const express = require("express");
const router = express.Router();
const profileController = require("../controllers/profileController");
const { protect } = require("../middleware/authMiddleware");
const upload = require("../middleware/upload");

// Get current user profile
router.get("/", protect, profileController.getProfile);

// Update profile
router.put("/", protect, upload.single("profileImage"), profileController.updateProfile);

// Upload profile image
router.post("/upload-image", protect, upload.single("profileImage"), profileController.uploadProfileImage);

module.exports = router;
