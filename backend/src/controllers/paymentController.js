const Auction = require("../models/Auction");
const MultiWallet = require("../models/MultiWallet");
const Notification = require("../models/Notification");
const Payment = require("../models/Payment");
const Transaction = require("../models/Transaction");
const User = require("../models/User");
const mongoose = require("mongoose");

// Chapa API Configuration
const CHAPA_API_URL = process.env.CHAPA_API_URL || "https://api.chapa.co/v1";
const CHAPA_SECRET_KEY = process.env.CHAPA_SECRET_KEY;

/**
 * Initialize Chapa Payment (Deposit to Wallet)
 * POST /api/payments/initialize
 */
exports.initializePayment = async (req, res) => {
  const session = await mongoose.startSession();
  
  try {
    const { amount, phone, returnUrl } = req.body;
    const userId = req.user._id;
    
    // Validate input
    if (!amount || amount < 10) {
      return res.status(400).json({ 
        message: "Amount must be at least 10 ETB" 
      });
    }
    
    if (!CHAPA_SECRET_KEY) {
      console.error("❌ CHAPA_SECRET_KEY not configured");
      return res.status(500).json({ 
        message: "Payment gateway not configured" 
      });
    }
    
    // Get user details
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    await session.withTransaction(async () => {
      // Generate unique transaction reference
      const tx_ref = Payment.generateTxRef(userId);
      
      // Construct callback and return URLs
      const baseUrl = process.env.BACKEND_URL || `${req.protocol}://${req.get("host")}`;
      const frontendUrl = process.env.FRONTEND_URL || returnUrl || `${baseUrl}/payment/success`;
      
      const callback_url = `${baseUrl}/api/payments/webhook`;
      const return_url = `${frontendUrl}?tx_ref=${tx_ref}`;
      
      // Create payment record
      const payment = new Payment({
        userId,
        tx_ref,
        amount: Number(amount),
        currency: "ETB",
        status: "pending",
        method: "chapa",
        customerEmail: user.email,
        customerName: user.name,
        customerPhone: phone || null,
        callbackUrl: callback_url,
        returnUrl: return_url,
        ipAddress: req.ip,
        userAgent: req.headers["user-agent"],
      });
      
      await payment.save({ session });
      
      // Call Chapa API to initialize transaction
      const chapaPayload = {
        amount: amount.toString(),
        currency: "ETB",
        email: user.email,
        first_name: user.name.split(" ")[0] || user.name,
        last_name: user.name.split(" ").slice(1).join(" ") || "",
        tx_ref,
        callback_url,
        return_url,
        ...(phone && { phone_number: phone }),
        customization: {
          title: "Auction Platform Wallet Deposit",
          description: `Deposit ${amount} ETB to your wallet`,
          logo: process.env.LOGO_URL || "",
        },
      };
      
      console.log("🔄 Initializing Chapa payment:", { tx_ref, amount, email: user.email });
      
      const chapaResponse = await fetch(`${CHAPA_API_URL}/transaction/initialize`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${CHAPA_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(chapaPayload),
      });
      
      const chapaData = await chapaResponse.json();
      
      if (!chapaResponse.ok) {
        console.error("❌ Chapa initialization failed:", chapaData);
        await payment.markFailed(chapaData.message || "Chapa initialization failed", session);
        throw new Error(chapaData.message || "Failed to initialize payment");
      }
      
      // Update payment with Chapa reference
      payment.chapaReference = chapaData.data?.reference || null;
      payment.chapaResponse = chapaData;
      await payment.save({ session });
      
      console.log("✅ Chapa payment initialized:", { tx_ref, checkout_url: chapaData.data?.checkout_url });
      
      res.status(201).json({
        message: "Payment initialized successfully",
        tx_ref,
        checkout_url: chapaData.data?.checkout_url,
        amount,
        currency: "ETB",
      });
    });
    
  } catch (error) {
    console.error("❌ Initialize payment error:", error);
    res.status(500).json({ 
      message: error.message || "Failed to initialize payment" 
    });
  } finally {
    session.endSession();
  }
};

/**
 * Chapa Webhook Handler
 * POST /api/payments/webhook
 */
exports.handleWebhook = async (req, res) => {
  try {
    console.log("🔔 Chapa webhook received:", req.body);
    
    const { tx_ref, status, reference, amount } = req.body;
    
    if (!tx_ref) {
      console.error("❌ Webhook: Missing tx_ref");
      return res.status(400).json({ message: "Missing transaction reference" });
    }
    
    // Find the payment
    const payment = await Payment.findOne({ tx_ref });
    
    if (!payment) {
      console.error("❌ Webhook: Payment not found:", tx_ref);
      return res.status(404).json({ message: "Payment not found" });
    }
    
    // Check if already processed
    if (payment.status !== "pending") {
      console.log("⚠️ Webhook: Payment already processed:", { tx_ref, status: payment.status });
      return res.status(200).json({ message: "Payment already processed" });
    }
    
    // Verify the payment with Chapa (double verification for security)
    const verification = await verifyChapaPayment(tx_ref);
    
    if (verification.success && verification.data?.status === "success") {
      await processSuccessfulPayment(payment, verification.data);
      console.log("✅ Webhook: Payment processed successfully:", tx_ref);
    } else {
      await payment.markFailed(verification.message || "Payment verification failed");
      console.log("❌ Webhook: Payment verification failed:", tx_ref);
    }
    
    // Always return 200 to Chapa to acknowledge receipt
    res.status(200).json({ message: "Webhook processed" });
    
  } catch (error) {
    console.error("❌ Webhook error:", error);
    // Always return 200 to prevent Chapa retries
    res.status(200).json({ message: "Webhook received" });
  }
};

/**
 * Manual Payment Verification
 * GET /api/payments/verify/:tx_ref
 */
exports.verifyPayment = async (req, res) => {
  try {
    const { tx_ref } = req.params;
    const userId = req.user._id;
    
    // Find payment
    const payment = await Payment.findOne({ tx_ref, userId });
    
    if (!payment) {
      return res.status(404).json({ message: "Payment not found" });
    }
    
    // If already processed, return status
    if (payment.status === "success") {
      return res.json({
        message: "Payment already verified",
        status: payment.status,
        amount: payment.amount,
        verifiedAt: payment.verifiedAt,
      });
    }
    
    if (payment.status === "failed") {
      return res.json({
        message: "Payment failed",
        status: payment.status,
        failureReason: payment.failureReason,
      });
    }
    
    // Verify with Chapa
    const verification = await verifyChapaPayment(tx_ref);
    
    if (verification.success && verification.data?.status === "success") {
      await processSuccessfulPayment(payment, verification.data);
      
      // Get updated wallet balance
      const wallet = await MultiWallet.findOne({ user: userId });
      
      return res.json({
        message: "Payment verified successfully",
        status: "success",
        amount: payment.amount,
        walletBalance: wallet?.primaryWallet?.balance || 0,
        primaryBalance: wallet?.primaryWallet?.balance || 0,
        secondaryBalance: wallet?.secondaryWallet?.balance || 0,
      });
    } else {
      // Check if it's actually pending on Chapa side
      if (verification.data?.status === "pending") {
        return res.json({
          message: "Payment still pending",
          status: "pending",
          tx_ref,
        });
      }
      
      await payment.markFailed(verification.message || "Payment verification failed");
      
      return res.json({
        message: "Payment verification failed",
        status: "failed",
        reason: verification.message,
      });
    }
    
  } catch (error) {
    console.error("❌ Verify payment error:", error);
    res.status(500).json({ 
      message: error.message || "Failed to verify payment" 
    });
  }
};

/**
 * Get User's Payment History
 * GET /api/payments/history
 */
exports.getPaymentHistory = async (req, res) => {
  try {
    const userId = req.user._id;
    const { status, page = 1, limit = 20 } = req.query;
    
    const query = { userId };
    if (status) query.status = status;
    
    const skip = (Number(page) - 1) * Number(limit);
    
    const [payments, total] = await Promise.all([
      Payment.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .select("-chapaResponse -verificationResponse -ipAddress -userAgent"),
      Payment.countDocuments(query),
    ]);
    
    res.json({
      payments,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    });
    
  } catch (error) {
    console.error("❌ Get payment history error:", error);
    res.status(500).json({ 
      message: error.message || "Failed to get payment history" 
    });
  }
};

/**
 * Get Single Payment Details
 * GET /api/payments/:id
 */
exports.getPaymentById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    
    const payment = await Payment.findOne({ 
      $or: [{ _id: id }, { tx_ref: id }],
      userId 
    }).select("-chapaResponse -verificationResponse -ipAddress -userAgent");
    
    if (!payment) {
      return res.status(404).json({ message: "Payment not found" });
    }
    
    res.json({ payment });
    
  } catch (error) {
    console.error("❌ Get payment error:", error);
    res.status(500).json({ 
      message: error.message || "Failed to get payment" 
    });
  }
};

// ==================== HELPER FUNCTIONS ====================

/**
 * Verify payment with Chapa API
 */
async function verifyChapaPayment(tx_ref) {
  try {
    console.log("🔍 Verifying Chapa payment:", tx_ref);
    
    const response = await fetch(`${CHAPA_API_URL}/transaction/verify/${tx_ref}`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${CHAPA_SECRET_KEY}`,
      },
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      console.error("❌ Chapa verification failed:", data);
      return { 
        success: false, 
        message: data.message || "Verification failed",
        data: null 
      };
    }
    
    console.log("✅ Chapa verification response:", { 
      tx_ref, 
      status: data.data?.status,
      amount: data.data?.amount 
    });
    
    return { 
      success: true, 
      data: data.data 
    };
    
  } catch (error) {
    console.error("❌ Chapa verification error:", error);
    return { 
      success: false, 
      message: error.message,
      data: null 
    };
  }
}

/**
 * Process successful payment - Update wallet and create transaction
 */
async function processSuccessfulPayment(payment, verificationData) {
  const session = await mongoose.startSession();
  
  try {
    await session.withTransaction(async () => {
      // 1. Mark payment as success
      await payment.markSuccess(verificationData, session);
      
      // 2. Get or create multi-wallet
      let wallet = await MultiWallet.findOne({ user: payment.userId }).session(session);
      
      if (!wallet) {
        wallet = new MultiWallet({
          user: payment.userId,
          primaryWallet: { balance: 0, heldBalance: 0 },
          secondaryWallet: { balance: 0, heldBalance: 0 },
        });
      }
      
      // 3. Add funds to primary wallet
      const previousBalance = wallet.primaryWallet?.balance || 0;
      wallet.primaryWallet.balance = previousBalance + payment.amount;
      await wallet.save({ session });
      
      // 4. Create transaction record
      const transaction = new Transaction({
        userId: payment.userId,
        amount: payment.amount,
        type: "wallet_deposit",
        status: "completed",
        from: "chapa",
        to: "wallet",
        description: `Wallet deposit via Chapa - ${payment.tx_ref}`,
        reference: payment.tx_ref,
        metadata: {
          paymentId: payment._id,
          chapaReference: payment.chapaReference,
          previousBalance,
          newBalance: wallet.primaryWallet.balance,
          walletType: "primary",
        },
      });
      
      await transaction.save({ session });
      
      // 5. Send notification
      try {
        await Notification.create({
          user: payment.userId,
          title: "💰 Wallet Deposit Successful",
          message: `Your wallet has been credited with ${payment.amount} ETB. Reference: ${payment.tx_ref}`,
          type: "payment",
          priority: "high",
          metadata: {
            amount: payment.amount,
            tx_ref: payment.tx_ref,
            newBalance: wallet.primaryWallet.balance,
          },
        });
      } catch (notifError) {
        console.error("❌ Failed to create notification:", notifError);
        // Don't fail the transaction if notification fails
      }
      
      console.log("✅ Payment processed successfully:", {
        tx_ref: payment.tx_ref,
        amount: payment.amount,
        walletBalance: wallet.primaryWallet.balance,
        transactionId: transaction._id,
      });
    });
    
  } catch (error) {
    console.error("❌ Process payment error:", error);
    throw error;
  } finally {
    session.endSession();
  }
}

// ==================== LEGACY FUNCTIONS (kept for compatibility) ====================

// release winner payment
exports.releasePayment = async (req, res) => {
  try {

    const auctionId = req.params.id;

    const auction = await Auction.findById(auctionId);

    if (!auction) {
      return res.status(404).json({ message: "Auction not found" });
    }

    if (!auction.winner) {
      return res.status(400).json({
        message: "Auction has no winner"
      });
    }

    const winnerWallet = await Wallet.findOne({
      user: auction.winner
    });

    const sellerWallet = await Wallet.findOne({
      user: auction.seller
    });

    const amount = auction.currentBid;

    // admin fee 5%
    const adminFee = amount * 0.05;
    const sellerAmount = amount - adminFee;


    // deduct from held
    winnerWallet.heldBalance -= amount;
    await winnerWallet.save();


    // pay seller
    sellerWallet.balance += sellerAmount;
    sellerWallet.totalEarnings += sellerAmount;
    await sellerWallet.save();


    // notify
    await Notification.create({
      user: auction.seller,
      message: "Payment received from auction winner",
      type: "PAYMENT"
    });

    res.json({
      message: "Payment released",
      sellerAmount,
      adminFee
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};