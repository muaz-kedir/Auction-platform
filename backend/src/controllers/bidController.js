const Bid = require("../models/Bid");
const Auction = require("../models/Auction");
const Notification = require("../models/Notification");
const Wallet = require("../models/Wallet");
const WalletVerification = require("../models/WalletVerification");

const { getSocket } = require("../utils/socket");

exports.placeBid = async (req, res) => {
try {

const { amount } = req.body;
const auctionId = req.params.id;

const auction = await Auction.findById(auctionId);

if (!auction) {
return res.status(404).json({
message: "Auction not found"
});
}

// seller cannot bid
if (auction.seller.toString() === req.user._id.toString()) {
return res.status(400).json({
message: "Seller cannot bid"
});
}

// check wallet
const wallet = await Wallet.findOne({ user: req.user._id });

if (!wallet) {
return res.status(403).json({
message: "Please verify your wallet first"
});
}

if (req.user.role === "buyer" && !wallet.walletVerified) {
const verification = await WalletVerification.findOne({ user: req.user._id });
return res.status(403).json({
message: "Please verify your wallet first",
verificationStatus: verification?.status || "not_submitted"
});
}

if (req.user.role === "buyer" && typeof wallet.maxBiddingAmount === "number" && amount > wallet.maxBiddingAmount) {
return res.status(400).json({
message: `Bid exceeds your verified maximum bidding limit of $${wallet.maxBiddingAmount.toLocaleString()}`
});
}

if (wallet.balance < amount) {
return res.status(400).json({
message: "Insufficient balance"
});
}

// bid must be higher
if (amount <= auction.currentBid) {
return res.status(400).json({
message: "Bid must be higher"
});
}


// find last bid
const lastBid = await Bid.findOne({
auction: auctionId
}).sort({ createdAt: -1 });


// deduct money from bidder
wallet.balance -= amount;
wallet.heldBalance += amount;
await wallet.save();


// refund last bidder
if (lastBid) {

const lastWallet = await Wallet.findOne({
user: lastBid.bidder
});

lastWallet.balance += lastBid.amount;
lastWallet.heldBalance -= lastBid.amount;

await lastWallet.save();

await Notification.create({
user: lastBid.bidder,
message: "You have been outbid and refunded",
type: "OUTBID"
});
}


// create bid
const bid = await Bid.create({
auction: auctionId,
bidder: req.user._id,
amount
});

auction.currentBid = amount;
await auction.save();


// notify seller
await Notification.create({
user: auction.seller,
message: "New bid placed on your auction",
type: "BID"
});


// realtime
const io = getSocket();
if (io) {
  io.to(auctionId).emit("bidUpdate", {
    auctionId,
    amount
  });
}

res.status(201).json({
message: "Bid placed successfully",
bid
});

} catch (error) {
res.status(500).json({
error: error.message
});
}
};