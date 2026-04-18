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

rejectionReason: String
},
{ timestamps: true }
);

module.exports = mongoose.model("Auction", auctionSchema);