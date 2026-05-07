const express = require("express");
const router = express.Router();

const {
  getMyNotifications,
  getNotificationStats,
  createNotification,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  getAllNotifications,
} = require("../controllers/notificationController");

const { protect: auth, adminOnly } = require("../middleware/authMiddleware");

// User routes - GET endpoints
router.get("/", auth, getMyNotifications);
router.get("/stats", auth, getNotificationStats);
router.get("/admin/all", auth, adminOnly, getAllNotifications);

// User routes - PUT endpoints
router.put("/:id/read", auth, markAsRead);
router.put("/read-all", auth, markAllAsRead);

// User routes - DELETE endpoints
router.delete("/:id", auth, deleteNotification);

// Admin routes - POST endpoints
router.post("/create", auth, adminOnly, createNotification);

module.exports = router;