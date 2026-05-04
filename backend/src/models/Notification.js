const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    // Title of the notification
    title: {
      type: String,
      required: true,
    },

    // Message content
    message: {
      type: String,
      required: true,
    },

    // Type of notification
    type: {
      type: String,
      enum: [
        "admin",           // Created by admin/super admin
        "auction_created", // Auto: when auction is created
        "auction_ended",   // Auto: when auction ends
        "auction_won",     // Auto: when user wins auction
        "bid_placed",      // Auto: when bid is placed
        "outbid",          // Auto: when user is outbid
        "payment",         // Auto: payment related
        "system",          // General system notifications
      ],
      required: true,
    },

    // Target user (optional - if null, it's a broadcast to all users)
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    // Related auction (optional)
    auctionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Auction",
      default: null,
    },

    // Read status
    isRead: {
      type: Boolean,
      default: false,
    },

    // Created by (for admin notifications)
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    // Priority level
    priority: {
      type: String,
      enum: ["low", "normal", "high", "urgent"],
      default: "normal",
    },

    // Additional data (flexible object for extra info)
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
  },
  { timestamps: true }
);

// Indexes for better query performance
notificationSchema.index({ userId: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, isRead: 1 });
notificationSchema.index({ type: 1, createdAt: -1 });
notificationSchema.index({ auctionId: 1 });

module.exports = mongoose.model("Notification", notificationSchema);