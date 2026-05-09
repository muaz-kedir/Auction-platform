const Dispute = require("../models/Dispute");
const Auction = require("../models/Auction");
const EscrowService = require("../services/escrowService");
const {
  createDisputeOpenedNotification,
  createDisputeResolvedNotification,
} = require("./notificationController");

/**
 * Create a new dispute
 * POST /api/disputes
 */
exports.createDispute = async (req, res) => {
  try {
    const { auctionId, reason, description, evidence } = req.body;
    const userId = req.user._id;

    if (!auctionId || !reason || !description) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const result = await EscrowService.openDispute(auctionId, userId, {
      reason,
      description,
      evidence
    });

    // Send notifications
    await createDisputeOpenedNotification(
      result.auction,
      result.auction.winner,
      result.auction.seller,
      reason,
      result.isBuyer
    );

    res.status(201).json({
      success: true,
      message: "Dispute opened successfully",
      dispute: result.dispute
    });

  } catch (error) {
    console.error("Error creating dispute:", error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Get all disputes (Admin only)
 * GET /api/disputes
 */
exports.getAllDisputes = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    
    const query = {};
    if (status) query.status = status;

    const disputes = await Dispute.find(query)
      .populate("auction", "title images")
      .populate("buyer", "name email")
      .populate("seller", "name email")
      .populate("creator", "name role")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Dispute.countDocuments(query);

    res.json({
      disputes,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error("Error getting all disputes:", error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Get dispute details
 * GET /api/disputes/:id
 */
exports.getDisputeById = async (req, res) => {
  try {
    const dispute = await Dispute.findById(req.params.id)
      .populate("auction")
      .populate("buyer", "name email profileImage")
      .populate("seller", "name email profileImage")
      .populate("creator", "name email role")
      .populate("resolvedBy", "name role");

    if (!dispute) {
      return res.status(404).json({ message: "Dispute not found" });
    }

    // Check authorization
    const isAdmin = req.user.role === "admin" || req.user.role === "super_admin";
    const isParticipant = 
      dispute.buyer._id.toString() === req.user._id.toString() || 
      dispute.seller._id.toString() === req.user._id.toString();

    if (!isAdmin && !isParticipant) {
      return res.status(403).json({ message: "Not authorized to view this dispute" });
    }

    res.json(dispute);
  } catch (error) {
    console.error("Error getting dispute details:", error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Update dispute status (Admin only)
 * PATCH /api/disputes/:id/status
 */
exports.updateStatus = async (req, res) => {
  try {
    const { status } = req.body;
    
    if (!["OPEN", "UNDER_REVIEW", "REJECTED"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const dispute = await Dispute.findById(req.params.id);
    if (!dispute) return res.status(404).json({ message: "Dispute not found" });

    dispute.status = status;
    await dispute.save();

    res.json({ success: true, dispute });
  } catch (error) {
    console.error("Error updating dispute status:", error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Resolve dispute (Admin only)
 * POST /api/disputes/:id/resolve
 */
exports.resolveDispute = async (req, res) => {
  try {
    const { action, details } = req.body;
    const adminId = req.user._id;

    if (!["refund", "release", "reject"].includes(action)) {
      return res.status(400).json({ message: "Invalid action" });
    }

    const dispute = await Dispute.findById(req.params.id);
    if (!dispute) return res.status(404).json({ message: "Dispute not found" });

    if (dispute.status === "RESOLVED") {
      return res.status(400).json({ message: "Dispute already resolved" });
    }

    let result;
    if (action === "refund") {
      result = await EscrowService.refundFunds(dispute.auction, adminId, details, dispute._id);
    } else if (action === "release") {
      result = await EscrowService.releaseFunds(dispute.auction, adminId, dispute._id);
    } else if (action === "reject") {
      dispute.status = "REJECTED";
      dispute.resolutionAction = "reject";
      dispute.resolutionDetails = details;
      dispute.resolvedBy = adminId;
      dispute.resolvedAt = new Date();
      await dispute.save();
      result = { success: true };
    }

    res.json({ success: true, message: `Dispute resolved with action: ${action}` });

    // Send notifications after response
    try {
      const updatedDispute = await Dispute.findById(dispute._id).populate("auction buyer seller");
      if (updatedDispute) {
        await createDisputeResolvedNotification(
          updatedDispute.auction,
          updatedDispute.buyer,
          updatedDispute.seller,
          action,
          details
        );
      }
    } catch (notifyError) {
      console.error("Error sending resolution notification:", notifyError);
    }

  } catch (error) {
    console.error("Error resolving dispute:", error);
    res.status(500).json({ error: error.message });
  }
};