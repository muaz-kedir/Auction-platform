const express = require("express");
const router = express.Router();

const {
  createDispute,
  getAllDisputes,
  getDisputeById,
  updateStatus,
  resolveDispute
} = require("../controllers/disputeController");

const { protect: auth, adminOnly } = require("../middleware/authMiddleware");

// Public/Shared routes (authenticated)
router.post("/", auth, createDispute);
router.get("/:id", auth, getDisputeById);

// Admin only routes
router.get("/", auth, adminOnly, getAllDisputes);
router.patch("/:id/status", auth, adminOnly, updateStatus);
router.post("/:id/resolve", auth, adminOnly, resolveDispute);

module.exports = router;