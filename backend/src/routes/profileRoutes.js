const express = require("express");
const router = express.Router();
const profileController = require("../controllers/profileController");
const { protect } = require("../middleware/authMiddleware");
const { profileUpload } = require("../middleware/cloudinaryUpload");

// Get current user profile
router.get("/", protect, profileController.getProfile);

// Update profile
router.put("/", protect, profileUpload.single("profileImage"), profileController.updateProfile);

// Upload profile image
router.post("/upload-image", protect, profileUpload.single("profileImage"), profileController.uploadProfileImage);

module.exports = router;
