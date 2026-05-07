const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema(
  {
    // User who initiated/owns this transaction
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // Related auction (if applicable)
    auctionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Auction",
      default: null,
      index: true,
    },

    // Transaction amount
    amount: {
      type: Number,
      required: true,
      min: 0,
    },

    // Transaction type
    type: {
      type: String,
      enum: [
        "escrow_hold",        // Funds locked in escrow when auction ends
        "escrow_release",     // Funds released to seller
        "escrow_refund",      // Funds refunded to buyer
        "wallet_deposit",     // Wallet funding
        "wallet_withdraw",    // Wallet withdrawal
        "wallet_transfer",    // Transfer between wallets
        "bid_placement",      // Bid placed (reserved)
        "bid_return",         // Bid returned (outbid)
        "payment",            // Payment for won auction
        "refund",             // General refund
      ],
      required: true,
      index: true,
    },

    // Wallet type for multi-wallet support (primary/secondary)
    walletType: {
      type: String,
      enum: ["primary", "secondary", null],
      default: null,
    },

    // For wallet transfers: source wallet type
    fromWalletType: {
      type: String,
      enum: ["primary", "secondary", null],
      default: null,
    },

    // For wallet transfers: destination wallet type
    toWalletType: {
      type: String,
      enum: ["primary", "secondary", null],
      default: null,
    },

    // Payment method for deposits
    paymentMethod: {
      type: String,
      enum: ["card", "mobile_money", "bank_transfer", "crypto", null],
      default: null,
    },

    // Transaction status
    status: {
      type: String,
      enum: ["pending", "completed", "failed", "cancelled"],
      default: "pending",
      index: true,
    },

    // From/To information for clarity
    from: {
      type: String,
      default: null, // e.g., "wallet", "escrow", user ID
    },

    to: {
      type: String,
      default: null, // e.g., "wallet", "escrow", user ID
    },

    // Description/Memo
    description: {
      type: String,
      default: "",
    },

    // Related parties (for escrow transactions)
    buyerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    sellerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    // Admin who processed the transaction (for admin-controlled operations)
    processedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    // Metadata for additional information
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },

    // Transaction reference number (unique)
    reference: {
      type: String,
      unique: true,
      sparse: true,
    },
  },
  { timestamps: true }
);

// Indexes for common queries
transactionSchema.index({ userId: 1, createdAt: -1 });
transactionSchema.index({ auctionId: 1, type: 1 });
transactionSchema.index({ type: 1, status: 1 });
transactionSchema.index({ createdAt: -1 });

// Generate reference number before saving
transactionSchema.pre("save", function (next) {
  if (!this.reference) {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 10000);
    this.reference = `TXN-${timestamp}-${random}`;
  }
  next();
});

module.exports = mongoose.model("Transaction", transactionSchema);
