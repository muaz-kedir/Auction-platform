const mongoose = require("mongoose");

const auctionSchema = new mongoose.Schema(
{
title: {
type: String,
required: true
},

description: String,

images: [String],

category: {
type: mongoose.Schema.Types.ObjectId,
ref: "Category",
required: false
},

startingBid: {
type: Number,
required: true
},

currentBid: {
type: Number,
default: 0
},

seller: {
type: mongoose.Schema.Types.ObjectId,
ref: "User"
},

winner: {
type: mongoose.Schema.Types.ObjectId,
ref: "User"
},

endTime: Date,

status: {
type: String,
enum: ["PENDING", "SUBMITTED", "ACTIVE", "ENDED", "REJECTED"],
default: "PENDING"
},

approvalStatus: {
type: String,
enum: ["PENDING", "SUBMITTED", "APPROVED", "REJECTED"],
default: "PENDING"
},

reviewedBy: {
type: mongoose.Schema.Types.ObjectId,
ref: "User"
},

rejectionReason: String,

// Escrow-related fields
winningBid: {
  type: Number,
  default: 0,
},

escrowStatus: {
  type: String,
  enum: ["none", "awaiting_payment", "payment_secured", "delivered", "released", "refunded", "payment_failed"],
  default: "none",
},

deliveryStatus: {
  type: String,
  enum: ["pending", "shipped", "delivered", "confirmed"],
  default: "pending",
},

paymentStatus: {
  type: String,
  enum: ["pending", "held", "released", "refunded", "failed"],
  default: "pending",
},

  dispute: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Dispute",
    default: null,
  },

// Timestamps for escrow flow
escrowHoldAt: {
  type: Date,
  default: null,
},

deliveredAt: {
  type: Date,
  default: null,
},

releasedAt: {
  type: Date,
  default: null,
},

refundedAt: {
  type: Date,
  default: null,
},

// Transaction references
escrowTransactionId: {
  type: mongoose.Schema.Types.ObjectId,
  ref: "Transaction",
  default: null,
},

releaseTransactionId: {
  type: mongoose.Schema.Types.ObjectId,
  ref: "Transaction",
  default: null,
}
},
{ timestamps: true }
);

module.exports = mongoose.model("Auction", auctionSchema);