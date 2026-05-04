const Auction = require("../models/Auction");
const Bid = require("../models/Bid");
const mongoose = require("mongoose");
const { createAuctionEndedNotification } = require("../controllers/notificationController");

const autoEndAuctions = async () => {
try {
const now = new Date();

const auctions = await Auction.find({
endTime: { $lte: now },
status: { $ne: "ENDED" }
});

for (let auction of auctions) {
try {
// Skip invalid auctions
if (!auction.startingBid || auction.startingBid === undefined) {
console.log("Skipping invalid auction (missing startingBid):", auction._id);
continue;
}

const highestBid = await Bid
.findOne({ auction: auction._id })
.sort({ amount: -1 });

if (highestBid) {
auction.winner = highestBid.bidder;
auction.currentBid = highestBid.amount;
}

auction.status = "ENDED";
await auction.save();

console.log("Auction ended:", auction._id);

// Create notifications for auction ending
// Fetch the auction with populated bids for notification
const endedAuction = await Auction.findById(auction._id).populate("bids.bidder", "_id");
try {
await createAuctionEndedNotification(endedAuction);
} catch (notifError) {
console.error("Error creating auction ended notification:", notifError.message);
// Don't fail the auction ending if notification fails
}

} catch (auctionError) {
// Skip this auction if there's an error and continue with others
console.log("Error ending auction", auction._id, "- skipping:", auctionError.message);
continue;
}
}

} catch (error) {
console.log("Error in autoEndAuctions:", error.message);
}
};

module.exports = autoEndAuctions;