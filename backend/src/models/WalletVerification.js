const mongoose = require("mongoose");

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
    maxBiddingAmount: {
      type: Number,
      default: null,
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

const walletVerificationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    fileUrl: {
      type: String,
      required: true,
    },
    fileName: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "ai_checking", "approved", "rejected"],
      default: "pending",
    },
    fraudStatus: {
      type: String,
      enum: ["unchecked", "clean", "suspicious", "unknown"],
      default: "unchecked",
    },
    fraudReason: {
      type: String,
      default: "",
    },
    fraudScore: {
      type: Number,
      min: 0,
      max: 1,
      default: null,
    },
    approvals: {
      type: [approvalSchema],
      default: [],
    },
    extractedBalance: {
      type: Number,
      default: null,
    },
    suggestedMaxBiddingAmount: {
      type: Number,
      default: null,
    },
    maxBiddingAmount: {
      type: Number,
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("WalletVerification", walletVerificationSchema);
