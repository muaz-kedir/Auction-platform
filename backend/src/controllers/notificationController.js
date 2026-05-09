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

    // Emit real-time notification
    const { getSocket } = require("../utils/socket");
    const io = getSocket();
    if (io) {
      io.emit("notificationUpdate", {
        type: "auction_created",
        auctionId: auction._id,
        message: `New auction "${auction.title}" is now live!`,
        timestamp: new Date().toISOString()
      });
    }

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

/**
 * Create auction winner announcement notification
 * Broadcast to all users when an auction ends with a winner
 */
exports.createWinnerAnnouncementNotification = async (auction, winner) => {
  try {
    const notification = new Notification({
      title: "🏆 Auction Winner Announced",
      message: `${winner.name} won the auction "${auction.title}" with $${auction.currentBid.toLocaleString()}!`,
      type: "auction_winner",
      userId: null, // Broadcast to all users
      auctionId: auction._id,
      priority: "high",
      metadata: {
        winnerId: winner._id,
        winnerName: winner.name,
        winningBid: auction.currentBid,
        auctionTitle: auction.title,
        isPublicAnnouncement: true,
      },
    });

    await notification.save();
    console.log(`✓ Winner announcement notification created for: ${auction.title}`);

    return notification;
  } catch (error) {
    console.error("Error creating winner announcement notification:", error);
  }
};

/**
 * Create personal winner notification
 * Private notification for the winner only
 */
exports.createPersonalWinnerNotification = async (auction, winner) => {
  try {
    const notification = new Notification({
      title: "🎉 Congratulations! You Won!",
      message: `You won the auction "${auction.title}" with a bid of $${auction.currentBid.toLocaleString()}! Please complete your payment within 24 hours.`,
      type: "winner_personal",
      userId: winner._id,
      auctionId: auction._id,
      priority: "high",
      metadata: {
        winnerId: winner._id,
        winningBid: auction.currentBid,
        auctionTitle: auction.title,
        isPersonalWinner: true,
        paymentDeadline: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      },
    });

    await notification.save();
    console.log(`✓ Personal winner notification created for: ${winner.name}`);

    return notification;
  } catch (error) {
    console.error("Error creating personal winner notification:", error);
  }
};

// ==================== ESCROW NOTIFICATIONS ====================

/**
 * Create escrow held notification
 * Notifies winner and seller when funds are secured in escrow
 */
exports.createEscrowHeldNotification = async (auction, winner, amount) => {
  try {
    // Notify winner (buyer) - payment secured
    const winnerNotification = new Notification({
      title: "🔒 Payment Secured in Escrow",
      message: `Your payment of $${amount.toLocaleString()} for "${auction.title}" has been secured in escrow. The seller will now deliver your item.`,
      type: "payment",
      userId: winner._id,
      auctionId: auction._id,
      priority: "high",
      metadata: {
        escrowStatus: "payment_secured",
        amount: amount,
        auctionTitle: auction.title,
      },
    });

    await winnerNotification.save();

    // Notify seller - funds secured, deliver item
    const sellerNotification = new Notification({
      title: "💰 Funds Secured - Deliver Item",
      message: `Payment of $${amount.toLocaleString()} for your auction "${auction.title}" is now secured in escrow. Please deliver the item to the buyer.`,
      type: "payment",
      userId: auction.seller,
      auctionId: auction._id,
      priority: "high",
      metadata: {
        escrowStatus: "payment_secured",
        amount: amount,
        auctionTitle: auction.title,
      },
    });

    await sellerNotification.save();

    // Emit real-time notification
    const { getSocket } = require("../utils/socket");
    const io = getSocket();
    if (io) {
      io.to(winner._id.toString()).emit("notificationUpdate", {
        type: "escrow_held",
        auctionId: auction._id,
        message: "Your payment has been secured in escrow",
        amount: amount,
      });

      io.to(auction.seller.toString()).emit("notificationUpdate", {
        type: "escrow_held",
        auctionId: auction._id,
        message: "Funds secured in escrow - deliver item",
        amount: amount,
      });
    }

    console.log(`✓ Escrow held notifications sent for auction: ${auction.title}`);
    return { winnerNotification, sellerNotification };
  } catch (error) {
    console.error("Error creating escrow held notification:", error);
  }
};

/**
 * Create escrow released notification
 * Notifies winner and seller when funds are released to seller
 */
exports.createEscrowReleasedNotification = async (auction, winner, seller, amount) => {
  try {
    // Notify winner (buyer) - transaction complete
    const winnerNotification = new Notification({
      title: "✅ Transaction Complete",
      message: `The escrow for "${auction.title}" has been released. Thank you for your purchase!`,
      type: "payment",
      userId: winner._id,
      auctionId: auction._id,
      priority: "normal",
      metadata: {
        escrowStatus: "released",
        amount: amount,
        auctionTitle: auction.title,
      },
    });

    await winnerNotification.save();

    // Notify seller - payment received
    const sellerNotification = new Notification({
      title: "🎉 Payment Released!",
      message: `You have received $${amount.toLocaleString()} for your auction "${auction.title}". The funds have been added to your wallet.`,
      type: "payment",
      userId: seller._id || auction.seller,
      auctionId: auction._id,
      priority: "high",
      metadata: {
        escrowStatus: "released",
        amount: amount,
        auctionTitle: auction.title,
      },
    });

    await sellerNotification.save();

    // Emit real-time notification
    const { getSocket } = require("../utils/socket");
    const io = getSocket();
    if (io) {
      io.to(winner._id.toString()).emit("notificationUpdate", {
        type: "escrow_released",
        auctionId: auction._id,
        message: "Escrow released - transaction complete",
        amount: amount,
      });

      io.to((seller._id || auction.seller).toString()).emit("notificationUpdate", {
        type: "escrow_released",
        auctionId: auction._id,
        message: `Payment of $${amount.toLocaleString()} received!`,
        amount: amount,
      });
    }

    console.log(`✓ Escrow released notifications sent for auction: ${auction.title}`);
    return { winnerNotification, sellerNotification };
  } catch (error) {
    console.error("Error creating escrow released notification:", error);
  }
};

/**
 * Create escrow refunded notification
 * Notifies winner and seller when funds are refunded
 */
exports.createEscrowRefundedNotification = async (auction, winner, seller, amount, reason) => {
  try {
    // Notify winner (buyer) - refund processed
    const winnerNotification = new Notification({
      title: "💸 Refund Processed",
      message: `You have been refunded $${amount.toLocaleString()} for "${auction.title}"${reason ? `. Reason: ${reason}` : ""}. The funds have been returned to your wallet.`,
      type: "payment",
      userId: winner._id,
      auctionId: auction._id,
      priority: "high",
      metadata: {
        escrowStatus: "refunded",
        amount: amount,
        auctionTitle: auction.title,
        refundReason: reason,
      },
    });

    await winnerNotification.save();

    // Notify seller - refund issued
    const sellerNotification = new Notification({
      title: "⚠️ Payment Refunded",
      message: `The payment for your auction "${auction.title}" has been refunded to the buyer${reason ? `: ${reason}` : ""}.`,
      type: "payment",
      userId: seller._id || auction.seller,
      auctionId: auction._id,
      priority: "urgent",
      metadata: {
        escrowStatus: "refunded",
        amount: amount,
        auctionTitle: auction.title,
        refundReason: reason,
      },
    });

    await sellerNotification.save();

    // Emit real-time notification
    const { getSocket } = require("../utils/socket");
    const io = getSocket();
    if (io) {
      io.to(winner._id.toString()).emit("notificationUpdate", {
        type: "escrow_refunded",
        auctionId: auction._id,
        message: `Refund of $${amount.toLocaleString()} processed`,
        amount: amount,
        reason: reason,
      });

      io.to((seller._id || auction.seller).toString()).emit("notificationUpdate", {
        type: "escrow_refunded",
        auctionId: auction._id,
        message: "Payment refunded to buyer",
        amount: amount,
        reason: reason,
      });
    }

    console.log(`✓ Escrow refund notifications sent for auction: ${auction.title}`);
    return { winnerNotification, sellerNotification };
  } catch (error) {
    console.error("Error creating escrow refund notification:", error);
  }
};

/**
 * Create delivery notification
 * Notifies winner when seller marks item as delivered
 */
exports.createDeliveryNotification = async (auction, winner, seller) => {
  try {
    // Notify winner (buyer) - item delivered
    const winnerNotification = new Notification({
      title: "📦 Item Delivered",
      message: `The seller has marked your item from "${auction.title}" as delivered. Please confirm receipt.`,
      type: "system",
      userId: winner._id,
      auctionId: auction._id,
      priority: "high",
      metadata: {
        escrowStatus: "delivered",
        auctionTitle: auction.title,
        sellerName: seller?.name || "Seller",
      },
    });

    await winnerNotification.save();

    // Emit real-time notification
    const { getSocket } = require("../utils/socket");
    const io = getSocket();
    if (io) {
      io.to(winner._id.toString()).emit("notificationUpdate", {
        type: "item_delivered",
        auctionId: auction._id,
        message: "Item marked as delivered - please confirm",
      });
    }

    console.log(`✓ Delivery notification sent to winner for auction: ${auction.title}`);
    return winnerNotification;
  } catch (error) {
    console.error("Error creating delivery notification:", error);
  }
};

/**
 * Create dispute opened notification
 * Notifies both parties when a dispute is opened
 */
exports.createDisputeOpenedNotification = async (auction, winner, seller, reason, isBuyer) => {
  try {
    const openerRole = isBuyer ? "buyer" : "seller";
    const otherParty = isBuyer ? seller : winner;
    
    // Notify the other party
    const otherPartyNotification = new Notification({
      title: "⚠️ Dispute Opened",
      message: `A dispute has been opened by the ${openerRole} for "${auction.title}"${reason ? `: ${reason}` : ""}. An admin will review the case.`,
      type: "system",
      userId: otherParty._id,
      auctionId: auction._id,
      priority: "urgent",
      metadata: {
        escrowStatus: "disputed",
        auctionTitle: auction.title,
        disputeReason: reason,
        openedBy: openerRole,
      },
    });

    await otherPartyNotification.save();

    // Notify all admins
    const User = require("../models/User");
    const admins = await User.find({ role: { $in: ["admin", "super_admin"] } });
    
    for (const admin of admins) {
      const adminNotification = new Notification({
        title: "🚨 New Dispute Requires Attention",
        message: `A dispute has been opened for auction "${auction.title}". Reason: ${reason || "No reason provided"}`,
        type: "admin",
        userId: admin._id,
        auctionId: auction._id,
        priority: "urgent",
        metadata: {
          escrowStatus: "disputed",
          auctionTitle: auction.title,
          disputeReason: reason,
          openedBy: openerRole,
          winnerId: winner._id,
          sellerId: seller._id || auction.seller,
        },
      });

      await adminNotification.save();
    }

    console.log(`✓ Dispute notifications sent for auction: ${auction.title}`);
    return { otherPartyNotification, adminNotifications: admins.length };
  } catch (error) {
    console.error("Error creating dispute notification:", error);
  }
};

/**
 * Create payment failed notification
 * Notifies admins and user when escrow hold fails
 */
exports.createPaymentFailedNotification = async (auction, winner, error) => {
  try {
    // Notify winner
    const winnerNotification = new Notification({
      title: "❌ Payment Failed",
      message: `We couldn't secure payment for "${auction.title}". Please ensure you have sufficient funds in your wallet.`,
      type: "payment",
      userId: winner._id,
      auctionId: auction._id,
      priority: "urgent",
      metadata: {
        escrowStatus: "payment_failed",
        auctionTitle: auction.title,
        errorMessage: error,
      },
    });

    await winnerNotification.save();

    // Notify admins
    const User = require("../models/User");
    const admins = await User.find({ role: { $in: ["admin", "super_admin"] } });
    
    for (const admin of admins) {
      const adminNotification = new Notification({
        title: "⚠️ Escrow Payment Failed",
        message: `Payment failed for auction "${auction.title}". Winner: ${winner.name}. Error: ${error}`,
        type: "admin",
        userId: admin._id,
        auctionId: auction._id,
        priority: "urgent",
        metadata: {
          escrowStatus: "payment_failed",
          auctionTitle: auction.title,
          winnerId: winner._id,
          errorMessage: error,
        },
      });

      await adminNotification.save();
    }

    console.log(`✓ Payment failed notifications sent for auction: ${auction.title}`);
    return { winnerNotification, adminNotifications: admins.length };
  } catch (error) {
    console.error("Error creating payment failed notification:", error);
  }
};

/**
 * Create dispute resolved notification
 * Notifies both parties when a dispute is resolved by an admin
 */
exports.createDisputeResolvedNotification = async (auction, winner, seller, action, details) => {
  try {
    const message = action === "reject" 
      ? `The dispute for "${auction.title}" has been rejected. ${details || ""}`
      : `The dispute for "${auction.title}" has been resolved with action: ${action}. ${details || ""}`;

    // Notify winner
    const winnerNotification = new Notification({
      title: "⚖️ Dispute Resolved",
      message: message,
      type: "system",
      userId: winner._id,
      auctionId: auction._id,
      priority: "high",
      metadata: {
        escrowStatus: "resolved",
        auctionTitle: auction.title,
        resolutionAction: action,
      },
    });
    await winnerNotification.save();

    // Notify seller
    const sellerNotification = new Notification({
      title: "⚖️ Dispute Resolved",
      message: message,
      type: "system",
      userId: seller._id || auction.seller,
      auctionId: auction._id,
      priority: "high",
      metadata: {
        escrowStatus: "resolved",
        auctionTitle: auction.title,
        resolutionAction: action,
      },
    });
    await sellerNotification.save();

    console.log(`✓ Dispute resolution notifications sent for auction: ${auction.title}`);
  } catch (error) {
    console.error("Error creating dispute resolution notification:", error);
  }
};