const express = require("express");
const router = express.Router();

const {
createCategory,
getCategories
} = require("../controllers/categoryController");
const { protect } = require("../middleware/authMiddleware");
const { superAdminOnly } = require("../middleware/roleMiddleware");

// Only super admin can create categories
router.post("/", protect, superAdminOnly, createCategory);
// Anyone can view categories
router.get("/", getCategories);

module.exports = router;