const MultiWallet = require("../models/MultiWallet");
const WalletVerification = require("../models/WalletVerification");
const Auction = require("../models/Auction");
const Bid = require("../models/Bid");
const Notification = require("../models/Notification");
const Transaction = require("../models/Transaction");
const { getSocket } = require("../utils/socket");
const { createBidPlacedNotification } = require("./notificationController");

// Get my multi-wallet details
exports.getMyWallet = async (req, res) => {
  try {
    let wallet = await MultiWallet.findOne({ user: req.user._id });

    if (!wallet) {
      if (req.user.role === "buyer") {
        const verification = await WalletVerification.findOne({ user: req.user._id });
        return res.status(403).json({
          message: "Please verify your wallet first",
          verificationStatus: verification?.status || "not_submitted"
        });
      }

      wallet = await MultiWallet.create({
        user: req.user._id,
        primaryWallet: { balance: 0, heldBalance: 0 },
        secondaryWallet: { balance: 0, heldBalance: 0 }
      });
    }

    res.json({
      primaryWallet: wallet.primaryWallet,
      secondaryWallet: wallet.secondaryWallet,
      totalBalance: wallet.totalBalance,
      totalHeldBalance: wallet.totalHeldBalance,
      totalAvailableBalance: wallet.totalAvailableBalance,
      walletVerified: wallet.walletVerified,
      maxBiddingAmount: wallet.maxBiddingAmount,
      fundingStatus: wallet.fundingStatus,
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Deposit money to a specific wallet
exports.deposit = async (req, res) => {
  try {
    const { amount, walletType = "primary", paymentMethod = "card" } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ message: "Invalid deposit amount" });
    }

    if (!["primary", "secondary"].includes(walletType)) {
      return res.status(400).json({ message: "Invalid wallet type. Must be 'primary' or 'secondary'" });
    }

    let wallet = await MultiWallet.findOne({ user: req.user._id });

    if (!wallet) {
      if (req.user.role === "buyer") {
        return res.status(403).json({ message: "Please verify your wallet first" });
      }

      wallet = await MultiWallet.create({
        user: req.user._id,
        primaryWallet: { balance: 0, heldBalance: 0 },
        secondaryWallet: { balance: 0, heldBalance: 0 }
      });
    }

    // Add funds to the specified wallet
    await wallet.addFunds(walletType, amount);

    // Create transaction record
    const transaction = await Transaction.create({
      userId: req.user._id,
      amount: amount,
      type: "wallet_deposit",
      walletType: walletType,
      paymentMethod: paymentMethod,
      status: "completed",
      description: `Deposit to ${walletType} wallet`,
    });

    res.json({
      message: `Funds added successfully to ${walletType === "primary" ? "Primary" : "Secondary"} Wallet`,
      wallet: {
        primaryWallet: wallet.primaryWallet,
        secondaryWallet: wallet.secondaryWallet,
        totalBalance: wallet.totalBalance,
        totalAvailableBalance: wallet.totalAvailableBalance,
      },
      transaction: transaction,
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Transfer funds between wallets
exports.transfer = async (req, res) => {
  try {
    const { amount, fromWallet, toWallet } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ message: "Invalid transfer amount" });
    }

    if (!["primary", "secondary"].includes(fromWallet) || !["primary", "secondary"].includes(toWallet)) {
      return res.status(400).json({ message: "Invalid wallet type. Must be 'primary' or 'secondary'" });
    }

    if (fromWallet === toWallet) {
      return res.status(400).json({ message: "Source and destination wallets must be different" });
    }

    const wallet = await MultiWallet.findOne({ user: req.user._id });

    if (!wallet) {
      return res.status(404).json({ message: "Wallet not found" });
    }

    // Check if sufficient available balance in source wallet
    const availableBalance = wallet.getAvailableBalance(fromWallet);
    if (availableBalance < amount) {
      return res.status(400).json({
        message: `Insufficient available balance in ${fromWallet} wallet`,
        availableBalance,
        requiredAmount: amount,
      });
    }

    // Perform the transfer
    await wallet.transfer(fromWallet, toWallet, amount);

    // Create transaction record
    const transaction = await Transaction.create({
      userId: req.user._id,
      amount: amount,
      type: "wallet_transfer",
      fromWalletType: fromWallet,
      toWalletType: toWallet,
      status: "completed",
      description: `Transfer from ${fromWallet} to ${toWallet} wallet`,
    });

    res.json({
      message: "Transfer completed successfully",
      wallet: {
        primaryWallet: wallet.primaryWallet,
        secondaryWallet: wallet.secondaryWallet,
        totalBalance: wallet.totalBalance,
        totalAvailableBalance: wallet.totalAvailableBalance,
      },
      transaction: transaction,
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get transaction history
exports.getTransactionHistory = async (req, res) => {
  try {
    const { page = 1, limit = 20, type, walletType } = req.query;
    const query = { userId: req.user._id };

    if (type) query.type = type;
    if (walletType) query.walletType = walletType;

    const transactions = await Transaction.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .populate("auctionId", "title images");

    const total = await Transaction.countDocuments(query);

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
    res.status(500).json({ error: error.message });
  }
};

// Submit wallet funding request (legacy support)
exports.submitFundingRequest = async (req, res) => {
  try {
    const { fullName, phone, email, location, walletAmount, targetWallet = "primary" } = req.body;

    if (!fullName || !phone || !email || !location || !walletAmount) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (walletAmount <= 0) {
      return res.status(400).json({ message: "Wallet amount must be greater than 0" });
    }

    let wallet = await MultiWallet.findOne({ user: req.user._id });

    if (!wallet) {
      wallet = await MultiWallet.create({
        user: req.user._id,
        primaryWallet: { balance: 0, heldBalance: 0 },
        secondaryWallet: { balance: 0, heldBalance: 0 }
      });
    }

    if (wallet.fundingStatus === "pending" || wallet.fundingStatus === "approved") {
      return res.status(400).json({
        message: "You already have a funding request. Please wait for approval or contact support."
      });
    }

    wallet.fundingStatus = "pending";
    wallet.fundingRequest = {
      fullName,
      phone,
      email,
      location,
      walletAmount,
      escrowAmount: walletAmount
    };
    wallet.approvals = [];

    await wallet.save();

    res.json({
      message: "Funding request submitted successfully. Pending admin approval.",
      targetWallet,
      wallet
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get wallet funding status
exports.getFundingStatus = async (req, res) => {
  try {
    let wallet = await MultiWallet.findOne({ user: req.user._id });

    if (!wallet) {
      return res.json({
        fundingStatus: "not_created",
        canBid: false
      });
    }

    const canBid = wallet.fundingStatus === "approved" &&
                   (wallet.getAvailableBalance("primary") > 0 || wallet.getAvailableBalance("secondary") > 0);

    res.json({
      fundingStatus: wallet.fundingStatus,
      fundingRequest: wallet.fundingRequest,
      maxBiddingAmount: wallet.maxBiddingAmount,
      remainingBalance: wallet.totalAvailableBalance,
      totalUsedAmount: wallet.totalHeldBalance,
      primaryBalance: wallet.primaryWallet?.balance || 0,
      secondaryBalance: wallet.secondaryWallet?.balance || 0,
      primaryHeld: wallet.primaryWallet?.heldBalance || 0,
      secondaryHeld: wallet.secondaryWallet?.heldBalance || 0,
      totalAvailableBalance: wallet.totalAvailableBalance,
      canBid
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Check if user can bid
exports.canBid = async (req, res) => {
  try {
    if (req.user.role !== "buyer") {
      return res.json({ canBid: true });
    }

    const verification = await WalletVerification.findOne({ user: req.user._id });
    if (!verification || verification.status !== "approved") {
      return res.json({
        canBid: false,
        reason: "wallet_not_verified",
        message: "Please verify your wallet first"
      });
    }

    const wallet = await MultiWallet.findOne({ user: req.user._id });
    if (!wallet || wallet.fundingStatus !== "approved") {
      return res.json({
        canBid: false,
        reason: "wallet_not_funded",
        message: "Please fund your wallet first"
      });
    }

    const primaryAvailable = wallet.getAvailableBalance("primary");
    const secondaryAvailable = wallet.getAvailableBalance("secondary");

    if (primaryAvailable <= 0 && secondaryAvailable <= 0) {
      return res.json({
        canBid: false,
        reason: "insufficient_balance",
        message: "Insufficient wallet balance in both wallets",
        primaryBalance: primaryAvailable,
        secondaryBalance: secondaryAvailable,
      });
    }

    return res.json({
      canBid: true,
      maxBiddingAmount: wallet.maxBiddingAmount,
      primaryBalance: primaryAvailable,
      secondaryBalance: secondaryAvailable,
      totalAvailableBalance: wallet.totalAvailableBalance,
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Place a bid with wallet selection
exports.placeBidWithWallet = async (req, res) => {
  try {
    const { auctionId, bidAmount, walletType = "primary" } = req.body;

    console.log('[PLACE BID] User placing bid:', {
      userId: req.user._id,
      userName: req.user.name,
      auctionId,
      bidAmount,
      walletType
    });

    if (!auctionId || !bidAmount || bidAmount <= 0) {
      return res.status(400).json({ message: "Invalid bid amount" });
    }

    if (!["primary", "secondary"].includes(walletType)) {
      return res.status(400).json({ message: "Invalid wallet type. Must be 'primary' or 'secondary'" });
    }

    const wallet = await MultiWallet.findOne({ user: req.user._id });

    if (!wallet || wallet.fundingStatus !== "approved") {
      return res.status(403).json({ message: "Wallet not approved for bidding" });
    }

    // Check if sufficient balance in selected wallet
    const availableBalance = wallet.getAvailableBalance(walletType);
    if (availableBalance < bidAmount) {
      return res.status(400).json({
        message: `Insufficient balance in ${walletType} wallet`,
        walletType,
        availableBalance,
        requiredAmount: bidAmount,
        shortfall: bidAmount - availableBalance,
      });
    }

    const auction = await Auction.findById(auctionId).populate('seller', 'name email');

    if (!auction) {
      return res.status(404).json({ message: "Auction not found" });
    }

    if (bidAmount <= auction.currentBid) {
      return res.status(400).json({ message: "Bid must be higher than current bid" });
    }

    // Find last bid for refund
    const lastBid = await Bid.findOne({ auction: auctionId })
      .sort({ createdAt: -1 })
      .populate('bidder', 'name');

    // Refund last bidder if exists
    if (lastBid) {
      const lastWallet = await MultiWallet.findOne({ user: lastBid.bidder });

      if (lastWallet) {
        // Find which wallet was used for the last bid (check transaction history)
        const lastBidTransaction = await Transaction.findOne({
          userId: lastBid.bidder,
          auctionId: auctionId,
          type: "bid_placement",
        }).sort({ createdAt: -1 });

        const sourceWalletType = lastBidTransaction?.walletType || "primary";

        // Release held funds
        try {
          await lastWallet.releaseHeldFunds(sourceWalletType, lastBid.amount);

          // Create refund transaction
          await Transaction.create({
            userId: lastBid.bidder,
            auctionId: auctionId,
            amount: lastBid.amount,
            type: "bid_return",
            walletType: sourceWalletType,
            status: "completed",
            description: `Refund for being outbid on "${auction.title}"`,
          });

          // Notify last bidder
          await Notification.create({
            userId: lastBid.bidder,
            title: "You've Been Outbid",
            message: `You've been outbid on "${auction.title}". $${lastBid.amount.toLocaleString()} has been returned to your ${sourceWalletType} wallet.`,
            type: "outbid"
          });
        } catch (error) {
          console.error('[BID REFUND ERROR]:', error);
        }
      }
    }

    // Hold funds in selected wallet
    await wallet.holdFunds(walletType, bidAmount);

    // Create bid record
    const bid = await Bid.create({
      auction: auctionId,
      bidder: req.user._id,
      amount: bidAmount,
      walletType: walletType,
    });

    // Create transaction record
    await Transaction.create({
      userId: req.user._id,
      auctionId: auctionId,
      amount: bidAmount,
      type: "bid_placement",
      walletType: walletType,
      status: "completed",
      description: `Bid placed on "${auction.title}"`,
    });

    // Update auction current bid
    auction.currentBid = bidAmount;
    await auction.save();

    // Create bid notifications
    try {
      await createBidPlacedNotification(auction, bid, lastBid?.bidder?._id);
    } catch (notifError) {
      console.error("[WALLET BID] Error creating bid notification:", notifError.message);
    }

    // Emit socket event for real-time updates
    const io = getSocket();
    if (io) {
      const bidUpdate = {
        auctionId: auctionId,
        currentBid: bidAmount,
        bidder: { _id: req.user._id, name: req.user.name },
        previousBid: lastBid ? lastBid.amount : auction.startingBid,
        previousBidder: lastBid ? lastBid.bidder.name : null,
        walletType: walletType,
        timestamp: new Date().toISOString(),
        activity: {
          type: 'bid',
          message: `${req.user.name} placed a bid`,
          amount: bidAmount,
          time: new Date().toISOString(),
          bidderName: req.user.name
        }
      };

      io.to(auctionId).emit("bidUpdate", bidUpdate);
      io.emit("notificationUpdate", {
        type: "bid_placed",
        auctionId: auction._id,
        message: `New bid placed on "${auction.title}"`,
        timestamp: new Date().toISOString()
      });
    }

    res.json({
      message: "Bid placed successfully",
      walletType,
      primaryBalance: wallet.getAvailableBalance("primary"),
      secondaryBalance: wallet.getAvailableBalance("secondary"),
      currentBid: bidAmount,
    });

  } catch (error) {
    console.error('[WALLET BID ERROR]:', error);
    res.status(500).json({ error: error.message });
  }
};

// Get wallet summary (for dashboard)
exports.getWalletSummary = async (req, res) => {
  try {
    const wallet = await MultiWallet.findOne({ user: req.user._id });

    if (!wallet) {
      return res.json({
        hasWallet: false,
        primaryWallet: { balance: 0, heldBalance: 0, available: 0 },
        secondaryWallet: { balance: 0, heldBalance: 0, available: 0 },
        totalBalance: 0,
        totalHeld: 0,
        totalAvailable: 0,
      });
    }

    // Get recent transactions
    const recentTransactions = await Transaction.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate("auctionId", "title");

    res.json({
      hasWallet: true,
      primaryWallet: {
        balance: wallet.primaryWallet?.balance || 0,
        heldBalance: wallet.primaryWallet?.heldBalance || 0,
        available: wallet.getAvailableBalance("primary"),
      },
      secondaryWallet: {
        balance: wallet.secondaryWallet?.balance || 0,
        heldBalance: wallet.secondaryWallet?.heldBalance || 0,
        available: wallet.getAvailableBalance("secondary"),
      },
      totalBalance: wallet.totalBalance,
      totalHeld: wallet.totalHeldBalance,
      totalAvailable: wallet.totalAvailableBalance,
      walletVerified: wallet.walletVerified,
      fundingStatus: wallet.fundingStatus,
      recentTransactions,
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Process auction win (deduct held funds from winner)
exports.processAuctionWin = async (req, res) => {
  try {
    const { auctionId } = req.body;

    const auction = await Auction.findById(auctionId);
    if (!auction) {
      return res.status(404).json({ message: "Auction not found" });
    }

    // Get winning bid
    const winningBid = await Bid.findOne({ auction: auctionId })
      .sort({ amount: -1 })
      .populate('bidder', 'name email');

    if (!winningBid) {
      return res.status(404).json({ message: "No bids found for this auction" });
    }

    const winnerWallet = await MultiWallet.findOne({ user: winningBid.bidder._id });
    if (!winnerWallet) {
      return res.status(404).json({ message: "Winner wallet not found" });
    }

    // Find the wallet type used for the winning bid
    const bidTransaction = await Transaction.findOne({
      userId: winningBid.bidder._id,
      auctionId: auctionId,
      type: "bid_placement",
    }).sort({ createdAt: -1 });

    const walletType = bidTransaction?.walletType || "primary";

    // Deduct held funds
    try {
      await winnerWallet.deductHeldFunds(walletType, winningBid.amount);

      // Create payment transaction
      await Transaction.create({
        userId: winningBid.bidder._id,
        auctionId: auctionId,
        amount: winningBid.amount,
        type: "payment",
        walletType: walletType,
        status: "completed",
        description: `Payment for winning "${auction.title}"`,
      });

      // Notify winner
      await Notification.create({
        userId: winningBid.bidder._id,
        title: "Congratulations! You Won!",
        message: `You won "${auction.title}" with a bid of $${winningBid.amount.toLocaleString()}. Payment has been processed from your ${walletType} wallet.`,
        type: "auction_won"
      });

      res.json({
        message: "Auction win processed successfully",
        winner: winningBid.bidder.name,
        amount: winningBid.amount,
        walletType,
      });

    } catch (error) {
      console.error('[PROCESS WIN ERROR]:', error);
      res.status(400).json({ message: error.message });
    }

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Refund all held funds for a lost auction
exports.refundLostAuction = async (req, res) => {
  try {
    const { auctionId } = req.body;

    const auction = await Auction.findById(auctionId);
    if (!auction) {
      return res.status(404).json({ message: "Auction not found" });
    }

    // Get user's bid for this auction
    const userBid = await Bid.findOne({
      auction: auctionId,
      bidder: req.user._id
    });

    if (!userBid) {
      return res.status(404).json({ message: "No bid found for this auction" });
    }

    const wallet = await MultiWallet.findOne({ user: req.user._id });
    if (!wallet) {
      return res.status(404).json({ message: "Wallet not found" });
    }

    // Find the wallet type used for the bid
    const bidTransaction = await Transaction.findOne({
      userId: req.user._id,
      auctionId: auctionId,
      type: "bid_placement",
    }).sort({ createdAt: -1 });

    const walletType = bidTransaction?.walletType || "primary";

    // Release held funds
    try {
      await wallet.releaseHeldFunds(walletType, userBid.amount);

      // Create refund transaction
      await Transaction.create({
        userId: req.user._id,
        auctionId: auctionId,
        amount: userBid.amount,
        type: "refund",
        walletType: walletType,
        status: "completed",
        description: `Refund for not winning "${auction.title}"`,
      });

      res.json({
        message: "Refund processed successfully",
        refundedAmount: userBid.amount,
        walletType,
      });

    } catch (error) {
      console.error('[REFUND ERROR]:', error);
      res.status(400).json({ message: error.message });
    }

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
