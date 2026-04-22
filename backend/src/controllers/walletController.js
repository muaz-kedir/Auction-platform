const Wallet = require("../models/Wallet");
const WalletVerification = require("../models/WalletVerification");
const User = require("../models/User");

// Get my wallet
exports.getMyWallet = async (req, res) => {
  try {
    let wallet = await Wallet.findOne({ user: req.user._id });

    if (!wallet) {
      if (req.user.role === "buyer") {
        const verification = await WalletVerification.findOne({ user: req.user._id });
        return res.status(403).json({
          message: "Please verify your wallet first",
          verificationStatus: verification?.status || "not_submitted"
        });
      }

      wallet = await Wallet.create({
        user: req.user._id
      });
    }

    res.json(wallet);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Deposit money
exports.deposit = async (req, res) => {
  try {
    const { amount } = req.body;

    let wallet = await Wallet.findOne({ user: req.user._id });

    if (!wallet) {
      if (req.user.role === "buyer") {
        return res.status(403).json({
          message: "Please verify your wallet first"
        });
      }

      wallet = await Wallet.create({
        user: req.user._id
      });
    }

    wallet.balance += amount;

    await wallet.save();

    res.json({
      message: "Deposit successful",
      wallet
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Submit wallet funding request
exports.submitFundingRequest = async (req, res) => {
  try {
    const { fullName, phone, email, location, walletAmount } = req.body;

    // Validate required fields
    if (!fullName || !phone || !email || !location || !walletAmount) {
      return res.status(400).json({
        message: "All fields are required"
      });
    }

    if (walletAmount <= 0) {
      return res.status(400).json({
        message: "Wallet amount must be greater than 0"
      });
    }

    let wallet = await Wallet.findOne({ user: req.user._id });

    if (!wallet) {
      wallet = await Wallet.create({
        user: req.user._id
      });
    }

    // Check if there's already a pending or approved funding request
    if (wallet.fundingStatus === "pending" || wallet.fundingStatus === "approved") {
      return res.status(400).json({
        message: "You already have a funding request. Please wait for approval or contact support."
      });
    }

    // Update wallet with funding request
    wallet.fundingStatus = "pending";
    wallet.fundingRequest = {
      fullName,
      phone,
      email,
      location,
      walletAmount,
      escrowAmount: walletAmount // escrowAmount equals walletAmount
    };
    wallet.approvals = []; // Clear previous approvals

    await wallet.save();

    res.json({
      message: "Funding request submitted successfully. Pending admin approval.",
      wallet
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get wallet funding status
exports.getFundingStatus = async (req, res) => {
  try {
    let wallet = await Wallet.findOne({ user: req.user._id });

    if (!wallet) {
      return res.json({
        fundingStatus: "not_created",
        canBid: false
      });
    }

    const canBid = wallet.fundingStatus === "approved" && wallet.remainingBalance > 0;

    res.json({
      fundingStatus: wallet.fundingStatus,
      fundingRequest: wallet.fundingRequest,
      maxBiddingAmount: wallet.maxBiddingAmount,
      remainingBalance: wallet.remainingBalance,
      totalUsedAmount: wallet.totalUsedAmount,
      canBid
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Check if user can bid (for auction detail page)
exports.canBid = async (req, res) => {
  try {
    // Only buyers need wallet verification and funding
    if (req.user.role !== "buyer") {
      return res.json({ canBid: true });
    }

    // Check wallet verification status
    const verification = await WalletVerification.findOne({ user: req.user._id });
    if (!verification || verification.status !== "approved") {
      return res.json({
        canBid: false,
        reason: "wallet_not_verified",
        message: "Please verify your wallet first"
      });
    }

    // Check wallet funding status
    const wallet = await Wallet.findOne({ user: req.user._id });
    if (!wallet || wallet.fundingStatus !== "approved") {
      return res.json({
        canBid: false,
        reason: "wallet_not_funded",
        message: "Please fund your wallet first"
      });
    }

    if (wallet.remainingBalance <= 0) {
      return res.json({
        canBid: false,
        reason: "insufficient_balance",
        message: "Insufficient wallet balance"
      });
    }

    return res.json({
      canBid: true,
      maxBiddingAmount: wallet.maxBiddingAmount,
      remainingBalance: wallet.remainingBalance,
      totalUsedAmount: wallet.totalUsedAmount
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Place a bid (deduct from wallet)
exports.placeBidWithWallet = async (req, res) => {
  try {
    const { auctionId, bidAmount } = req.body;

    if (!auctionId || !bidAmount || bidAmount <= 0) {
      return res.status(400).json({
        message: "Invalid bid amount"
      });
    }

    const wallet = await Wallet.findOne({ user: req.user._id });

    if (!wallet || wallet.fundingStatus !== "approved") {
      return res.status(403).json({
        message: "Wallet not approved for bidding"
      });
    }

    if (wallet.remainingBalance < bidAmount) {
      return res.status(400).json({
        message: "Insufficient wallet balance"
      });
    }

    // Deduct the bid amount from remaining balance
    wallet.remainingBalance -= bidAmount;
    wallet.totalUsedAmount += bidAmount;

    await wallet.save();

    res.json({
      message: "Bid placed successfully",
      remainingBalance: wallet.remainingBalance,
      totalUsedAmount: wallet.totalUsedAmount
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Refund bid amount back to wallet (if outbid or auction ends without winning)
exports.refundBid = async (req, res) => {
  try {
    const { amount } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({
        message: "Invalid refund amount"
      });
    }

    const wallet = await Wallet.findOne({ user: req.user._id });

    if (!wallet || wallet.fundingStatus !== "approved") {
      return res.status(403).json({
        message: "Wallet not approved"
      });
    }

    // Refund the amount back to remaining balance
    wallet.remainingBalance += amount;
    wallet.totalUsedAmount -= amount;

    if (wallet.totalUsedAmount < 0) {
      wallet.totalUsedAmount = 0;
    }

    await wallet.save();

    res.json({
      message: "Refund successful",
      remainingBalance: wallet.remainingBalance,
      totalUsedAmount: wallet.totalUsedAmount
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};