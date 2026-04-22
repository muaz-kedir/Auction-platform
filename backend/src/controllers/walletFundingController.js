const Wallet = require("../models/Wallet");
const User = require("../models/User");

const APPROVER_ROLES = ["super_admin", "admin", "seller"];

// Get all wallet funding requests (for admins)
exports.getAllFundingRequests = async (req, res) => {
  try {
    if (!APPROVER_ROLES.includes(req.user.role)) {
      return res.status(403).json({ message: "Not authorized to view funding requests" });
    }

    const { status } = req.query;
    const query = {};
    
    if (status) {
      query.fundingStatus = status;
    }

    const wallets = await Wallet.find(query)
      .populate("user", "name email role")
      .populate("approvals.decidedBy", "name email role")
      .sort({ updatedAt: -1 });

    // Filter to only include wallets with funding requests
    const fundingRequests = wallets.filter(w => w.fundingRequest);

    return res.json({ fundingRequests });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

// Get single funding request details
exports.getFundingRequest = async (req, res) => {
  try {
    if (!APPROVER_ROLES.includes(req.user.role)) {
      return res.status(403).json({ message: "Not authorized" });
    }

    const { userId } = req.params;
    
    const wallet = await Wallet.findOne({ user: userId })
      .populate("user", "name email role")
      .populate("approvals.decidedBy", "name email role");

    if (!wallet || !wallet.fundingRequest) {
      return res.status(404).json({ message: "Funding request not found" });
    }

    return res.json({ wallet });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

// Approve or reject funding request
exports.decideFundingRequest = async (req, res) => {
  try {
    const approverRole = req.user.role;
    if (!APPROVER_ROLES.includes(approverRole)) {
      return res.status(403).json({ message: "Not authorized to review funding requests" });
    }

    const { userId } = req.params;
    const { decision } = req.body;

    if (!["approved", "rejected"].includes(decision)) {
      return res.status(400).json({ message: "Decision must be approved or rejected" });
    }

    const wallet = await Wallet.findOne({ user: userId })
      .populate("user", "name email role");

    if (!wallet || !wallet.fundingRequest) {
      return res.status(404).json({ message: "Funding request not found" });
    }

    if (wallet.fundingStatus === "approved" || wallet.fundingStatus === "rejected") {
      return res.status(400).json({ message: "Funding request already finalized" });
    }

    // Check if this role has already decided
    const existingRoleDecisionIndex = wallet.approvals.findIndex(
      (approval) => approval.role === approverRole
    );

    const roleDecision = {
      role: approverRole,
      decision,
      decidedBy: req.user._id,
      decidedAt: new Date(),
    };

    if (existingRoleDecisionIndex >= 0) {
      wallet.approvals[existingRoleDecisionIndex] = roleDecision;
    } else {
      wallet.approvals.push(roleDecision);
    }

    // Count approvals and rejections
    const approvedCount = wallet.approvals.filter((a) => a.decision === "approved").length;
    const rejectedCount = wallet.approvals.filter((a) => a.decision === "rejected").length;
    const totalDecisions = wallet.approvals.length;
    const remainingDecisions = APPROVER_ROLES.length - totalDecisions;

    // Determine final status: need at least 2 approvals to approve, or if rejections make it impossible to get 2 approvals, reject
    let finalStatus;
    if (approvedCount >= 2) {
      finalStatus = "approved";
    } else if (rejectedCount >= 2 || (APPROVER_ROLES.length - approvedCount - remainingDecisions >= 2)) {
      finalStatus = "rejected";
    } else {
      finalStatus = "pending";
    }

    wallet.fundingStatus = finalStatus;

    if (finalStatus === "approved") {
      // Set the wallet amounts
      wallet.maxBiddingAmount = wallet.fundingRequest.walletAmount;
      wallet.remainingBalance = wallet.fundingRequest.walletAmount;
      wallet.totalUsedAmount = 0;
      wallet.walletVerified = true;
    }

    if (finalStatus === "rejected") {
      // Reset funding status to allow resubmission
      wallet.fundingStatus = "rejected";
      wallet.fundingRequest = null;
    }

    await wallet.save();

    const populated = await Wallet.findById(wallet._id)
      .populate("user", "name email role")
      .populate("approvals.decidedBy", "name email role");

    return res.json({
      message: "Decision submitted successfully",
      wallet: populated,
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

// Reset funding request (allow user to resubmit after rejection)
exports.resetFundingRequest = async (req, res) => {
  try {
    const { userId } = req.params;

    const wallet = await Wallet.findOne({ user: userId });

    if (!wallet) {
      return res.status(404).json({ message: "Wallet not found" });
    }

    if (wallet.fundingStatus !== "rejected") {
      return res.status(400).json({ message: "Can only reset rejected funding requests" });
    }

    wallet.fundingStatus = "not_created";
    wallet.fundingRequest = null;
    wallet.approvals = [];
    wallet.maxBiddingAmount = null;
    wallet.remainingBalance = 0;
    wallet.totalUsedAmount = 0;

    await wallet.save();

    return res.json({
      message: "Funding request reset successfully. User can now resubmit.",
      wallet
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};