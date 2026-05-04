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

// User routes
router.get("/", auth, getMyNotifications);
router.get("/stats", auth, getNotificationStats);
router.put("/:id/read", auth, markAsRead);
router.put("/read-all", auth, markAllAsRead);
router.delete("/:id", auth, deleteNotification);

// Admin routes
router.post("/", auth, adminOnly, createNotification);
router.get("/admin/all", auth, adminOnly, getAllNotifications);

module.exports = router;