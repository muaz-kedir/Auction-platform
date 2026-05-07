const Auction = require("../models/Auction");
const Wallet = require("../models/Wallet");
const Transaction = require("../models/Transaction");
const EscrowService = require("../services/escrowService");
const {
  createEscrowHeldNotification,
  createEscrowReleasedNotification,
  createEscrowRefundedNotification,
  createDeliveryNotification,
  createDisputeOpenedNotification,
} = require("./notificationController");

/**
 * Get escrow status for an auction
 * GET /api/escrow/status/:id
 */
exports.getEscrowStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const auction = await Auction.findById(id)
      .populate("winner", "name email profileImage")
      .populate("seller", "name email profileImage");

    if (!auction) {
      return res.status(404).json({ message: "Auction not found" });
    }

    // Check if user is authorized to view this escrow
    const isWinner = auction.winner && auction.winner._id.toString() === userId.toString();
    const isSeller = auction.seller._id.toString() === userId.toString();
    const isAdmin = req.user.role === "admin" || req.user.role === "super_admin";

    if (!isWinner && !isSeller && !isAdmin) {
      return res.status(403).json({ message: "Not authorized to view escrow status" });
    }

    // Get transaction details
    let escrowTransaction = null;
    let releaseTransaction = null;

    if (auction.escrowTransactionId) {
      escrowTransaction = await Transaction.findById(auction.escrowTransactionId);
    }
    if (auction.releaseTransactionId) {
      releaseTransaction = await Transaction.findById(auction.releaseTransactionId);
    }

    // Get wallet info for winner
    let walletInfo = null;
    if (isWinner || isAdmin) {
      const wallet = await Wallet.findOne({ user: auction.winner?._id });
      if (wallet) {
        walletInfo = {
          balance: wallet.balance,
          heldBalance: wallet.heldBalance,
          availableBalance: wallet.balance - wallet.heldBalance,
        };
      }
    }

    res.json({
      auction: {
        _id: auction._id,
        title: auction.title,
        images: auction.images,
        winningBid: auction.winningBid || auction.currentBid,
      },
      winner: auction.winner,
      seller: auction.seller,
      escrowStatus: auction.escrowStatus,
      paymentStatus: auction.paymentStatus,
      deliveryStatus: auction.deliveryStatus,
      dispute: auction.dispute,
      escrowHoldAt: auction.escrowHoldAt,
      deliveredAt: auction.deliveredAt,
      releasedAt: auction.releasedAt,
      refundedAt: auction.refundedAt,
      escrowTransaction,
      releaseTransaction,
      walletInfo: isWinner ? walletInfo : null,
      isWinner,
      isSeller,
    });
  } catch (error) {
    console.error("Error getting escrow status:", error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Hold funds in escrow (manual trigger or auto when auction ends)
 * POST /api/escrow/hold/:id
 */
exports.holdFunds = async (req, res) => {
  try {
    const { id } = req.params;

    // Only admin can manually trigger hold
    if (req.user.role !== "admin" && req.user.role !== "super_admin") {
      return res.status(403).json({ message: "Admin access required" });
    }

    const result = await EscrowService.holdFunds(id);

    // Create notification for winner
    if (result.success && result.auction) {
      await createEscrowHeldNotification(result.auction, result.auction.winner, result.amount);
    }

    res.json({
      success: true,
      message: "Funds held in escrow successfully",
      data: result,
    });
  } catch (error) {
    console.error("Error holding funds:", error);
    res.status(500).json({ 
      error: error.message,
      message: "Failed to hold funds in escrow" 
    });
  }
};

/**
 * Release funds to seller (admin only)
 * POST /api/escrow/release/:id
 */
exports.releaseFunds = async (req, res) => {
  try {
    const { id } = req.params;
    const adminId = req.user._id;

    // Only admin can release
    if (req.user.role !== "admin" && req.user.role !== "super_admin") {
      return res.status(403).json({ message: "Only admin can release funds" });
    }

    const result = await EscrowService.releaseFunds(id, adminId);

    // Create notifications
    if (result.success) {
      await createEscrowReleasedNotification(result.auction, result.auction.winner, result.auction.seller, result.amount);
    }

    res.json({
      success: true,
      message: "Funds released to seller successfully",
      data: result,
    });
  } catch (error) {
    console.error("Error releasing funds:", error);
    res.status(500).json({ 
      error: error.message,
      message: "Failed to release funds" 
    });
  }
};

/**
 * Refund funds to buyer (admin only - for disputes)
 * POST /api/escrow/refund/:id
 */
exports.refundFunds = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const adminId = req.user._id;

    // Only admin can refund
    if (req.user.role !== "admin" && req.user.role !== "super_admin") {
      return res.status(403).json({ message: "Only admin can refund funds" });
    }

    const result = await EscrowService.refundFunds(id, adminId, reason);

    // Create notification
    if (result.success) {
      await createEscrowRefundedNotification(result.auction, result.auction.winner, result.auction.seller, result.amount, reason);
    }

    res.json({
      success: true,
      message: "Funds refunded to buyer successfully",
      data: result,
    });
  } catch (error) {
    console.error("Error refunding funds:", error);
    res.status(500).json({ 
      error: error.message,
      message: "Failed to refund funds" 
    });
  }
};

/**
 * Seller marks item as delivered
 * POST /api/escrow/deliver/:id
 */
exports.markDelivered = async (req, res) => {
  try {
    const { id } = req.params;
    const sellerId = req.user._id;

    const result = await EscrowService.markDelivered(id, sellerId);

    // Create notification
    if (result.success) {
      await createDeliveryNotification(result.auction, result.auction.winner, result.auction.seller);
    }

    res.json({
      success: true,
      message: "Item marked as delivered",
      data: result,
    });
  } catch (error) {
    console.error("Error marking delivered:", error);
    res.status(500).json({ 
      error: error.message,
      message: "Failed to mark as delivered" 
    });
  }
};

/**
 * Seller ships item
 * POST /api/escrow/ship/:id
 */
exports.shipItem = async (req, res) => {
  try {
    const { id } = req.params;
    const { trackingNumber, carrier } = req.body;

    const auction = await Auction.findById(id);

    if (!auction) {
      return res.status(404).json({ message: "Auction not found" });
    }

    if (auction.seller.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Only seller can ship" });
    }

    if (auction.escrowStatus !== "payment_secured") {
      return res.status(400).json({ message: "Payment not secured in escrow" });
    }

    auction.deliveryStatus = "shipped";
    auction.shippingInfo = {
      trackingNumber,
      carrier,
      shippedAt: new Date(),
    };

    await auction.save();

    res.json({
      success: true,
      message: "Item marked as shipped",
      auction,
    });
  } catch (error) {
    console.error("Error shipping item:", error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Buyer confirms delivery
 * POST /api/escrow/confirm/:id
 */
exports.confirmDelivery = async (req, res) => {
  try {
    const { id } = req.params;

    const auction = await Auction.findById(id);

    if (!auction) {
      return res.status(404).json({ message: "Auction not found" });
    }

    if (auction.winner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Only winner can confirm delivery" });
    }

    if (auction.deliveryStatus !== "shipped" && auction.deliveryStatus !== "delivered") {
      return res.status(400).json({ message: "Item not yet shipped" });
    }

    auction.deliveryStatus = "confirmed";
    await auction.save();

    res.json({
      success: true,
      message: "Delivery confirmed",
      auction,
    });
  } catch (error) {
    console.error("Error confirming delivery:", error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Open dispute
 * POST /api/escrow/dispute/:id
 */
exports.openDispute = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const userId = req.user._id;

    const result = await EscrowService.openDispute(id, userId, reason);

    // Create notification
    if (result.success) {
      await createDisputeOpenedNotification(result.auction, result.auction.winner, result.auction.seller, reason, result.isBuyer);
    }

    res.json({
      success: true,
      message: "Dispute opened successfully",
      data: result,
    });
  } catch (error) {
    console.error("Error opening dispute:", error);
    res.status(500).json({ 
      error: error.message,
      message: "Failed to open dispute" 
    });
  }
};

/**
 * Get all escrow transactions (admin only)
 * GET /api/escrow/transactions
 */
exports.getEscrowTransactions = async (req, res) => {
  try {
    // Only admin can view all transactions
    if (req.user.role !== "admin" && req.user.role !== "super_admin") {
      return res.status(403).json({ message: "Admin access required" });
    }

    const { status, auctionId, userId, page = 1, limit = 20 } = req.query;

    const filters = { status, auctionId, userId };
    const transactions = await EscrowService.getEscrowTransactions(filters);

    // Paginate
    const start = (page - 1) * limit;
    const end = start + parseInt(limit);
    const paginatedTransactions = transactions.slice(start, end);

    res.json({
      transactions: paginatedTransactions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: transactions.length,
        pages: Math.ceil(transactions.length / limit),
      },
    });
  } catch (error) {
    console.error("Error getting escrow transactions:", error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Get user's escrow-related transactions
 * GET /api/escrow/my-transactions
 */
exports.getMyTransactions = async (req, res) => {
  try {
    const userId = req.user._id;
    const { page = 1, limit = 20 } = req.query;

    const transactions = await Transaction.find({
      userId: userId,
      type: { $in: ["escrow_hold", "escrow_release", "escrow_refund"] },
    })
      .populate("auctionId", "title images")
      .populate("buyerId", "name email")
      .populate("sellerId", "name email")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Transaction.countDocuments({
      userId: userId,
      type: { $in: ["escrow_hold", "escrow_release", "escrow_refund"] },
    });

    res.json({
      transactions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error getting my transactions:", error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Get all auctions with escrow status (admin dashboard)
 * GET /api/escrow/auctions
 */
exports.getEscrowAuctions = async (req, res) => {
  try {
    // Only admin can view all escrow auctions
    if (req.user.role !== "admin" && req.user.role !== "super_admin") {
      return res.status(403).json({ message: "Admin access required" });
    }

    const { status, page = 1, limit = 20 } = req.query;

    let query = {
      winner: { $ne: null },
      status: "ENDED",
    };

    if (status) {
      query.escrowStatus = status;
    }

    const auctions = await Auction.find(query)
      .populate("winner", "name email profileImage")
      .populate("seller", "name email profileImage")
      .sort({ escrowHoldAt: -1, updatedAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Auction.countDocuments(query);

    // Get escrow stats
    const stats = await Auction.aggregate([
      {
        $match: {
          winner: { $ne: null },
          status: "ENDED",
        },
      },
      {
        $group: {
          _id: "$escrowStatus",
          count: { $sum: 1 },
          totalAmount: { $sum: { $ifNull: ["$winningBid", "$currentBid"] } },
        },
      },
    ]);

    res.json({
      auctions,
      stats,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error getting escrow auctions:", error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Process auction end and trigger escrow (called internally)
 * This is used by the socket/scheduler when auction ends
 */
exports.processAuctionEnd = async (auctionId) => {
  try {
    console.log(`🏁 Processing auction end for escrow: ${auctionId}`);
    
    const result = await EscrowService.processAuctionEnd(auctionId);
    
    if (result.success) {
      // Create notification for winner
      const auction = result.auction;
      if (auction && auction.winner) {
        await createEscrowHeldNotification(auction, auction.winner, result.amount);
      }
    } else if (result.paymentFailed) {
      // Notify admins about payment failure
      console.error(`⚠️ Payment failed for auction ${auctionId}: ${result.error}`);
      // TODO: Create admin notification for payment failure
    }
    
    return result;
  } catch (error) {
    console.error(`❌ Error processing auction end for escrow ${auctionId}:`, error);
    return { success: false, error: error.message };
  }
};

// Legacy refund endpoint (for backwards compatibility)
exports.refundBuyer = async (req, res) => {
  try {
    const { id } = req.params;
    const adminId = req.user._id;

    if (req.user.role !== "admin" && req.user.role !== "super_admin") {
      return res.status(403).json({ message: "Admin access required" });
    }

    const result = await EscrowService.refundFunds(id, adminId, "Manual refund by admin");

    if (result.success) {
      await createEscrowRefundedNotification(result.auction, result.auction.winner, result.auction.seller, result.amount, "Manual refund");
    }

    res.json({
      success: true,
      message: "Buyer refunded",
      data: result,
    });
  } catch (error) {
    console.error("Error refunding buyer:", error);
    res.status(500).json({ error: error.message });
  }
};