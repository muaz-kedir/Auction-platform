const Auction = require("../models/Auction");
const Wallet = require("../models/Wallet");
const Notification = require("../models/Notification");


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