const Wallet = require("../models/Wallet");
const WalletVerification = require("../models/WalletVerification");
const Auction = require("../models/Auction");
const Bid = require("../models/Bid");
const Notification = require("../models/Notification");
const { getSocket } = require("../utils/socket");
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

    // Get auction details
    const auction = await Auction.findById(auctionId).populate('seller', 'name email');
    
    if (!auction) {
      return res.status(404).json({
        message: "Auction not found"
      });
    }

    // Check if bid is higher than current bid
    if (bidAmount <= auction.currentBid) {
      return res.status(400).json({
        message: "Bid must be higher than current bid"
      });
    }

    // Find last bid for refund
    const lastBid = await Bid.findOne({
      auction: auctionId
    }).sort({ createdAt: -1 }).populate('bidder', 'name');

    // Refund last bidder if exists
    if (lastBid) {
      const lastWallet = await Wallet.findOne({
        user: lastBid.bidder
      });

      if (lastWallet) {
        lastWallet.remainingBalance += lastBid.amount;
        lastWallet.totalUsedAmount -= lastBid.amount;
        await lastWallet.save();

        // Notify last bidder
        await Notification.create({
          user: lastBid.bidder,
          message: "You have been outbid and refunded",
          type: "OUTBID"
        });
      }
    }

    // Deduct the bid amount from remaining balance
    wallet.remainingBalance -= bidAmount;
    wallet.totalUsedAmount += bidAmount;
    await wallet.save();

    // Create bid record
    const bid = await Bid.create({
      auction: auctionId,
      bidder: req.user._id,
      amount: bidAmount
    });

    // Update auction current bid
    auction.currentBid = bidAmount;
    await auction.save();

    // Notify seller
    await Notification.create({
      user: auction.seller._id,
      message: "New bid placed on your auction",
      type: "BID"
    });

    // 🔥 EMIT SOCKET EVENT FOR REAL-TIME UPDATES
    const io = getSocket();
    if (io) {
      const bidUpdate = {
        auctionId: auctionId,
        currentBid: bidAmount,
        bidder: {
          _id: req.user._id,
          name: req.user.name
        },
        previousBid: lastBid ? lastBid.amount : auction.startingBid,
        previousBidder: lastBid ? lastBid.bidder.name : null,
        timestamp: new Date().toISOString(),
        activity: {
          type: 'bid',
          message: `${req.user.name} placed a bid`,
          amount: bidAmount,
          time: new Date().toISOString(),
          bidderName: req.user.name
        }
      };
      
      console.log('🔥 [WALLET BID] Emitting bidUpdate to room:', auctionId);
      console.log('🔥 [WALLET BID] Bid update data:', JSON.stringify(bidUpdate, null, 2));
      console.log('🔥 [WALLET BID] Number of clients in room:', io.sockets.adapter.rooms.get(auctionId)?.size || 0);
      
      io.to(auctionId).emit("bidUpdate", bidUpdate);
      
      console.log('✅ [WALLET BID] bidUpdate emitted successfully');
    }

    res.json({
      message: "Bid placed successfully",
      remainingBalance: wallet.remainingBalance,
      totalUsedAmount: wallet.totalUsedAmount,
      currentBid: bidAmount
    });

  } catch (error) {
    console.error('[WALLET BID ERROR]:', error);
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