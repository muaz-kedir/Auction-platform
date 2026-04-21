const WalletVerification = require("../models/WalletVerification");
const Wallet = require("../models/Wallet");
const User = require("../models/User");

const APPROVER_ROLES = ["super_admin", "admin", "seller"];

const axios = require('axios');

const analyzeBankStatement = async (file) => {
  try {
    const clientId = process.env.VERYFI_CLIENT_ID;
    const apiKey = process.env.VERYFI_API_KEY;
    
    if (!clientId || !apiKey || clientId === "your_client_id_here" || apiKey === "your_api_key_here") {
      console.warn("Veryfi credentials not configured. Using fallback 'unknown' status.");
      return {
        fraudStatus: "unknown",
        extractedBalance: null,
        fraudScore: null,
        fraudReason: "Veryfi API credentials not configured"
      };
    }

    // Construct the file URL (local server URL)
    const baseUrl = process.env.BACKEND_URL || "http://localhost:5000";
    const fileUrl = `${baseUrl}/uploads/wallet-verifications/${file.filename}`;

    const data = JSON.stringify({
      "file_url": fileUrl
    });

    const config = {
      method: 'post',
      maxBodyLength: Infinity,
      url: 'https://api.veryfi.com/api/v8/partner/bank-statements',
      headers: { 
        'Content-Type': 'application/json', 
        'Accept': 'application/json', 
        'CLIENT-ID': clientId, 
        'AUTHORIZATION': `apikey ${apiKey}`
      },
      data: data
    };

    const response = await axios(config);
    const result = response.data;
    
    // Parse Veryfi response - adjust based on actual response structure
    // Veryfi returns accounts with balance information
    let extractedBalance = null;
    if (result.accounts && result.accounts.length > 0) {
      // Get the closing balance from the first account's summary
      const account = result.accounts[0];
      extractedBalance = account.summary?.closing_balance || 
                          account.current_balance || 
                          account.balance || 
                          null;
    }
    
    // Veryfi doesn't provide fraud score directly, we'll set based on data quality
    const hasValidData = extractedBalance !== null && result.accounts && result.accounts.length > 0;
    const fraudScore = hasValidData ? 0.1 : 0.8; // Low risk if data extracted, high if not
    const fraudStatus = hasValidData ? "clean" : "suspicious";

    return {
      fraudStatus,
      extractedBalance,
      fraudScore,
      fraudReason: hasValidData ? "" : "Could not extract balance from statement"
    };
  } catch (error) {
    console.error("Veryfi analysis failed:", error.message);
    return {
      fraudStatus: "unknown",
      extractedBalance: null,
      fraudScore: null,
      fraudReason: "AI analysis service unavailable"
    };
  }
};

const computeVerificationStatus = (approvals) => {
  const approvedCount = approvals.filter((a) => a.decision === "approved").length;
  const totalDecisions = approvals.length;
  const remainingDecisions = APPROVER_ROLES.length - totalDecisions;

  if (approvedCount >= 2) return "approved";
  if (approvedCount + remainingDecisions < 2) return "rejected";
  return "pending";
};

exports.submitWalletVerification = async (req, res) => {
  try {
    if (req.user.role !== "buyer") {
      return res.status(403).json({ message: "Only buyers can submit wallet verification" });
    }

    if (!req.file) {
      return res.status(400).json({ message: "Please upload a bank statement file" });
    }

    const fileUrl = `/uploads/wallet-verifications/${req.file.filename}`;

    const analysis = await analyzeBankStatement(req.file);
    const extractedBalance = analysis.extractedBalance;
    const fraudScore = analysis.fraudScore;
    const suggestedMaxBiddingAmount = extractedBalance ? Math.floor(extractedBalance * 0.7) : null;

    const verification = await WalletVerification.findOneAndUpdate(
      { user: req.user._id },
      {
        user: req.user._id,
        fileUrl,
        fileName: req.file.originalname,
        status: "pending",
        fraudStatus: analysis.fraudStatus,
        fraudReason: analysis.fraudReason,
        fraudScore: analysis.fraudScore,
        approvals: [],
        extractedBalance,
        suggestedMaxBiddingAmount,
        maxBiddingAmount: null,
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    await Wallet.deleteOne({ user: req.user._id });

    return res.status(201).json({
      message: "Wallet verification submitted successfully",
      verification,
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

exports.getMyWalletVerification = async (req, res) => {
  try {
    const verification = await WalletVerification.findOne({ user: req.user._id }).populate(
      "approvals.decidedBy",
      "name email role"
    );

    const wallet = await Wallet.findOne({ user: req.user._id });

    return res.json({
      verification,
      wallet,
      canBid: Boolean(wallet && wallet.walletVerified),
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

exports.getAllWalletVerifications = async (req, res) => {
  try {
    if (!APPROVER_ROLES.includes(req.user.role)) {
      return res.status(403).json({ message: "Not authorized to view wallet verifications" });
    }

    const { status } = req.query;
    const query = {};
    if (status) query.status = status;

    const verifications = await WalletVerification.find(query)
      .populate("user", "name email role")
      .populate("approvals.decidedBy", "name email role")
      .sort({ createdAt: -1 });

    return res.json({ verifications });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

exports.submitWalletVerificationDecision = async (req, res) => {
  try {
    const approverRole = req.user.role;
    if (!APPROVER_ROLES.includes(approverRole)) {
      return res.status(403).json({ message: "Not authorized to review wallet verifications" });
    }

    const { id } = req.params;
    const { decision, maxBiddingAmount } = req.body;

    if (!["approved", "rejected"].includes(decision)) {
      return res.status(400).json({ message: "Decision must be approved or rejected" });
    }

    const verification = await WalletVerification.findById(id);
    if (!verification) {
      return res.status(404).json({ message: "Wallet verification not found" });
    }

    if (verification.status === "approved" || verification.status === "rejected") {
      return res.status(400).json({ message: "Verification already finalized" });
    }

    const existingRoleDecisionIndex = verification.approvals.findIndex(
      (approval) => approval.role === approverRole
    );

    const normalizedMaxBid =
      typeof maxBiddingAmount === "number" && maxBiddingAmount > 0
        ? Math.floor(maxBiddingAmount)
        : null;

    const roleDecision = {
      role: approverRole,
      decision,
      maxBiddingAmount: normalizedMaxBid,
      decidedBy: req.user._id,
      decidedAt: new Date(),
    };

    if (existingRoleDecisionIndex >= 0) {
      verification.approvals[existingRoleDecisionIndex] = roleDecision;
    } else {
      verification.approvals.push(roleDecision);
    }

    const finalStatus = computeVerificationStatus(verification.approvals);
    verification.status = finalStatus;

    if (finalStatus === "approved") {
      const approvedLimits = verification.approvals
        .filter((a) => a.decision === "approved" && typeof a.maxBiddingAmount === "number")
        .map((a) => a.maxBiddingAmount);

      const fallbackLimit = verification.suggestedMaxBiddingAmount || 0;
      verification.maxBiddingAmount = approvedLimits.length > 0 ? Math.max(...approvedLimits) : fallbackLimit;

      await Wallet.findOneAndUpdate(
        { user: verification.user },
        {
          user: verification.user,
          walletVerified: true,
          balance: verification.extractedBalance || 0,
          maxBiddingAmount: verification.maxBiddingAmount,
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );

      await User.findByIdAndUpdate(verification.user, { verified: true });
    }

    if (finalStatus === "rejected") {
      await Wallet.deleteOne({ user: verification.user });
      await User.findByIdAndUpdate(verification.user, { verified: false });
      verification.maxBiddingAmount = null;
    }

    await verification.save();

    const populated = await WalletVerification.findById(verification._id)
      .populate("user", "name email role")
      .populate("approvals.decidedBy", "name email role");

    return res.json({
      message: "Decision submitted successfully",
      verification: populated,
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};
