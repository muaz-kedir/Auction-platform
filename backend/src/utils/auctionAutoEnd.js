const Auction = require("../models/Auction");
const Bid = require("../models/Bid");
const User = require("../models/User");
const mongoose = require("mongoose");
const { 
  createAuctionEndedNotification,
  createWinnerAnnouncementNotification,
  createPersonalWinnerNotification
} = require("../controllers/notificationController");
const { getSocket } = require("../utils/socket");

const autoEndAuctions = async () => {
  try {
    const now = new Date();

    const auctions = await Auction.find({
      endTime: { $lte: now },
      status: { $ne: "ENDED" }
    });

    console.log(`⏰ Found ${auctions.length} auctions to end`);

    for (let auction of auctions) {
      try {
        // Skip invalid auctions
        if (!auction.startingBid || auction.startingBid === undefined) {
          console.log("Skipping invalid auction (missing startingBid):", auction._id);
          continue;
        }

        // Get highest bid with bidder details
        const highestBid = await Bid
          .findOne({ auction: auction._id })
          .sort({ amount: -1 })
          .populate("bidder", "_id name email");

        let winner = null;
        if (highestBid) {
          auction.winner = highestBid.bidder._id;
          auction.currentBid = highestBid.amount;
          auction.winningBid = highestBid.amount;
          winner = highestBid.bidder;
          console.log(`🏆 Winner selected for auction "${auction.title}": ${winner.name} with $${highestBid.amount.toLocaleString()}`);
        } else {
          console.log(`📭 No bids on auction "${auction.title}" - ending without winner`);
        }

        auction.status = "ENDED";
        await auction.save();

        console.log("✅ Auction ended:", auction._id);

        // Get fully populated auction for notifications
        const endedAuction = await Auction.findById(auction._id)
          .populate("bids.bidder", "_id")
          .populate("winner", "_id name email");

        try {
          // 1. Create standard ended notifications for all bidders
          await createAuctionEndedNotification(endedAuction);

          // 2. If there's a winner, create winner-specific notifications
          if (winner && endedAuction.winner) {
            // Public winner announcement (to all users)
            await createWinnerAnnouncementNotification(endedAuction, endedAuction.winner);
            
            // Private winner notification (only to winner)
            await createPersonalWinnerNotification(endedAuction, endedAuction.winner);

            // Emit real-time winner announcement
            const io = getSocket();
            if (io) {
              io.emit("winnerAnnounced", {
                type: "winner_announcement",
                auctionId: auction._id,
                auctionTitle: auction.title,
                winnerId: winner._id,
                winnerName: winner.name,
                winningBid: highestBid.amount,
                message: `${winner.name} won the auction "${auction.title}" with $${highestBid.amount.toLocaleString()}!`,
                timestamp: new Date().toISOString()
              });

              // Also emit personal winner event to the winner only
              io.to(`user_${winner._id}`).emit("youAreWinner", {
                type: "personal_winner",
                auctionId: auction._id,
                auctionTitle: auction.title,
                winningBid: highestBid.amount,
                message: `🎉 Congratulations! You won the auction "${auction.title}" with $${highestBid.amount.toLocaleString()}!`,
                timestamp: new Date().toISOString()
              });
            }
          }

          // General auction ended notification
          const io = getSocket();
          if (io) {
            io.emit("notificationUpdate", {
              type: "auction_ended",
              auctionId: auction._id,
              hasWinner: !!winner,
              winnerId: winner?._id || null,
              winnerName: winner?.name || null,
              winningBid: highestBid?.amount || null,
              message: winner 
                ? `Auction "${auction.title}" has ended. Winner: ${winner.name} with $${highestBid.amount.toLocaleString()}`
                : `Auction "${auction.title}" has ended without any bids`,
              timestamp: new Date().toISOString()
            });
          }
        } catch (notifError) {
          console.error("❌ Error creating notifications:", notifError.message);
          // Don't fail the auction ending if notification fails
        }

      } catch (auctionError) {
        console.error("❌ Error ending auction", auction._id, "- skipping:", auctionError.message);
        continue;
      }
    }

  } catch (error) {
    console.error("❌ Error in autoEndAuctions:", error.message);
  }
};

module.exports = autoEndAuctions;