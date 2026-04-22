const mongoose = require("mongoose");

const walletFundingSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
    },
    phone: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    location: {
      type: String,
      required: true,
    },
    walletAmount: {
      type: Number,
      required: true,
    },
    escrowAmount: {
      type: Number,
      required: true,
    },
  },
  { _id: false }
);

const approvalSchema = new mongoose.Schema(
  {
    role: {
      type: String,
      enum: ["super_admin", "admin", "seller"],
      required: true,
    },
    decision: {
      type: String,
      enum: ["approved", "rejected"],
      required: true,
    },
    decidedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    decidedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const walletSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      unique: true,
    },

    balance: {
      type: Number,
      default: 0,
    },

    heldBalance: {
      type: Number,
      default: 0,
    },

    totalEarnings: {
      type: Number,
      default: 0,
    },

    walletVerified: {
      type: Boolean,
      default: false,
    },

    maxBiddingAmount: {
      type: Number,
      default: null,
    },

    // Wallet Funding System Fields
    fundingStatus: {
      type: String,
      enum: ["not_created", "pending", "approved", "rejected"],
      default: "not_created",
    },

    fundingRequest: {
      type: walletFundingSchema,
      default: null,
    },

    approvals: {
      type: [approvalSchema],
      default: [],
    },

    remainingBalance: {
      type: Number,
      default: 0,
    },

    totalUsedAmount: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Wallet", walletSchema);
