const mongoose = require("mongoose");

const disputeSchema = new mongoose.Schema(
  {
    auction: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Auction",
      required: true,
    },
    buyer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    creator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    reason: {
      type: String,
      required: true,
      enum: ["Item not received", "Item not as described", "Payment issue", "Other"],
    },
    description: {
      type: String,
      required: true,
    },
    evidence: [
      {
        url: String,
        type: { type: String }, // 'image', 'file', etc.
        name: String,
      },
    ],
    status: {
      type: String,
      enum: ["OPEN", "UNDER_REVIEW", "RESOLVED", "REJECTED"],
      default: "OPEN",
    },
    resolutionAction: {
      type: String,
      enum: ["refund", "release", "reject", "none"],
      default: "none",
    },
    resolutionDetails: String,
    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    resolvedAt: Date,
  },
  { timestamps: true }
);

module.exports = mongoose.model("Dispute", disputeSchema);