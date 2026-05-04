const Notification = require("../models/Notification");
const Auction = require("../models/Auction");
const User = require("../models/User");

/**
 * Get notifications for the current user
 * Returns both user-specific and broadcast notifications
 */
exports.getMyNotifications = async (req, res) => {
  try {
    const userId = req.user._id;

    // Get notifications targeted to this user OR broadcast (userId: null)
    const notifications = await Notification.find({
      $or: [
        { userId: userId },
        { userId: null }, // Broadcast notifications
      ],
    })
      .sort({ createdAt: -1 })
      .populate("auctionId", "title images currentBid")
      .populate("createdBy", "name role")
      .limit(50);

    // Get unread count
    const unreadCount = await Notification.countDocuments({
      $or: [{ userId: userId }, { userId: null }],
      isRead: false,
    });

    res.json({
      notifications,
      unreadCount,
      totalCount: notifications.length,
    });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Get notification statistics for the current user
 */
exports.getNotificationStats = async (req, res) => {
  try {
    const userId = req.user._id;

    const total = await Notification.countDocuments({
      $or: [{ userId: userId }, { userId: null }],
    });

    const unread = await Notification.countDocuments({
      $or: [{ userId: userId }, { userId: null }],
      isRead: false,
    });

    const urgent = await Notification.countDocuments({
      $or: [{ userId: userId }, { userId: null }],
      priority: "urgent",
      isRead: false,
    });

    res.json({
      total,
      unread,
      urgent,
    });
  } catch (error) {
    console.error("Error fetching notification stats:", error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Create a notification (used by admin or system)
 */
exports.createNotification = async (req, res) => {
  try {
    const { title, message, type, userId, auctionId, priority, metadata } = req.body;

    // Validate required fields
    if (!title || !message || !type) {
      return res.status(400).json({
        error: "Title, message, and type are required",
      });
    }

    // Only admin/super_admin can create admin notifications
    if (type === "admin" && req.user.role !== "admin" && req.user.role !== "super_admin") {
      return res.status(403).json({
        error: "Only admins can create admin notifications",
      });
    }

    const notification = new Notification({
      title,
      message,
      type,
      userId: userId || null,
      auctionId: auctionId || null,
      createdBy: req.user._id,
      priority: priority || "normal",
      metadata: metadata || null,
      isRead: false,
    });

    await notification.save();

    // Populate and return
    const populatedNotification = await Notification.findById(notification._id)
      .populate("auctionId", "title images")
      .populate("createdBy", "name role");

    res.status(201).json(populatedNotification);
  } catch (error) {
    console.error("Error creating notification:", error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Mark a single notification as read
 */
exports.markAsRead = async (req, res) => {
  try {
    const notificationId = req.params.id;
    const userId = req.user._id;

    const notification = await Notification.findOne({
      _id: notificationId,
      $or: [{ userId: userId }, { userId: null }],
    });

    if (!notification) {
      return res.status(404).json({ error: "Notification not found" });
    }

    notification.isRead = true;
    await notification.save();

    res.json(notification);
  } catch (error) {
    console.error("Error marking notification as read:", error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Mark all notifications as read for the current user
 */
exports.markAllAsRead = async (req, res) => {
  try {
    const userId = req.user._id;

    await Notification.updateMany(
      {
        $or: [{ userId: userId }, { userId: null }],
        isRead: false,
      },
      { isRead: true }
    );

    res.json({ message: "All notifications marked as read" });
  } catch (error) {
    console.error("Error marking all notifications as read:", error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Delete a notification
 */
exports.deleteNotification = async (req, res) => {
  try {
    const notificationId = req.params.id;
    const userId = req.user._id;

    const notification = await Notification.findOne({
      _id: notificationId,
      $or: [{ userId: userId }, { userId: null }],
    });

    if (!notification) {
      return res.status(404).json({ error: "Notification not found" });
    }

    await Notification.findByIdAndDelete(notificationId);

    res.json({ message: "Notification deleted" });
  } catch (error) {
    console.error("Error deleting notification:", error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Get all notifications (admin only)
 */
exports.getAllNotifications = async (req, res) => {
  try {
    const { page = 1, limit = 20, type, userId } = req.query;

    const query = {};
    if (type) query.type = type;
    if (userId) query.userId = userId;

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .populate("userId", "name email")
      .populate("auctionId", "title")
      .populate("createdBy", "name role")
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Notification.countDocuments(query);

    res.json({
      notifications,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching all notifications:", error);
    res.status(500).json({ error: error.message });
  }
};

// ==================== UTILITY FUNCTIONS FOR AUTOMATIC NOTIFICATIONS ====================

/**
 * Create auction created notification
 * Called when a new auction is created
 */
exports.createAuctionCreatedNotification = async (auction, sellerId) => {
  try {
    const notification = new Notification({
      title: "New Auction Created",
      message: `A new auction "${auction.title}" has been created and is now live for bidding!`,
      type: "auction_created",
      userId: null, // Broadcast to all users
      auctionId: auction._id,
      priority: "normal",
      metadata: {
        startingBid: auction.startingBid,
        category: auction.category?.name || "Uncategorized",
      },
    });

    await notification.save();
    console.log(`✓ Auction created notification created for: ${auction.title}`);

    return notification;
  } catch (error) {
    console.error("Error creating auction created notification:", error);
  }
};

/**
 * Create auction ended notification
 * Called when an auction ends
 */
exports.createAuctionEndedNotification = async (auction) => {
  try {
    // Get all bidders on this auction
    const uniqueBidders = [...new Set(auction.bids.map((bid) => bid.bidder.toString()))];

    // Create notifications for all bidders
    for (const bidderId of uniqueBidders) {
      const isWinner = auction.winner?.toString() === bidderId;

      const notification = new Notification({
        title: isWinner ? "🎉 You Won the Auction!" : "Auction Ended",
        message: isWinner
          ? `Congratulations! You won the auction "${auction.title}" for $${auction.currentBid}. Please complete your payment.`
          : `The auction "${auction.title}" has ended. The winning bid was $${auction.currentBid}.`,
        type: isWinner ? "auction_won" : "auction_ended",
        userId: bidderId,
        auctionId: auction._id,
        priority: isWinner ? "high" : "normal",
        metadata: {
          finalPrice: auction.currentBid,
          isWinner: isWinner,
          totalBids: auction.bids.length,
        },
      });

      await notification.save();
    }

    // Also notify the seller
    const sellerNotification = new Notification({
      title: "Your Auction Ended",
      message: auction.winner
        ? `Your auction "${auction.title}" has ended with a winning bid of $${auction.currentBid}.`
        : `Your auction "${auction.title}" has ended without any winning bids.`,
      type: "auction_ended",
      userId: auction.seller,
      auctionId: auction._id,
      priority: "normal",
      metadata: {
        finalPrice: auction.currentBid,
        hasWinner: !!auction.winner,
        totalBids: auction.bids.length,
      },
    });

    await sellerNotification.save();

    console.log(`✓ Auction ended notifications created for: ${auction.title}`);
  } catch (error) {
    console.error("Error creating auction ended notification:", error);
  }
};

/**
 * Create bid placed notification
 * Called when a new bid is placed
 */
exports.createBidPlacedNotification = async (auction, bid, previousBidderId) => {
  try {
    // Notify the bidder
    const bidderNotification = new Notification({
      title: "Bid Placed Successfully",
      message: `You placed a bid of $${bid.amount} on "${auction.title}".`,
      type: "bid_placed",
      userId: bid.bidder,
      auctionId: auction._id,
      priority: "normal",
      metadata: {
        bidAmount: bid.amount,
        auctionTitle: auction.title,
      },
    });

    await bidderNotification.save();

    // Notify previous bidder they were outbid (if exists)
    if (previousBidderId && previousBidderId.toString() !== bid.bidder.toString()) {
      const outbidNotification = new Notification({
        title: "You've Been Outbid!",
        message: `Someone outbid you on "${auction.title}". Current bid is now $${bid.amount}. Place a higher bid to win!`,
        type: "outbid",
        userId: previousBidderId,
        auctionId: auction._id,
        priority: "high",
        metadata: {
          newBidAmount: bid.amount,
          auctionTitle: auction.title,
        },
      });

      await outbidNotification.save();
    }

    console.log(`✓ Bid notifications created for auction: ${auction.title}`);
  } catch (error) {
    console.error("Error creating bid notification:", error);
  }
};

/**
 * Create admin broadcast notification
 * Called when admin wants to notify all users
 */
exports.createAdminBroadcast = async (title, message, adminId, priority = "normal") => {
  try {
    const notification = new Notification({
      title,
      message,
      type: "admin",
      userId: null, // Broadcast
      createdBy: adminId,
      priority,
      metadata: {
        isBroadcast: true,
      },
    });

    await notification.save();
    console.log(`✓ Admin broadcast notification created: ${title}`);

    return notification;
  } catch (error) {
    console.error("Error creating admin broadcast:", error);
  }
};