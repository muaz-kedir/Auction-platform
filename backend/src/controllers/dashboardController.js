const Wallet = require("../models/Wallet");
const Bid = require("../models/Bid");
const Auction = require("../models/Auction");

// Get User Dashboard Stats
exports.getUserDashboardStats = async (req, res) => {
  try {
    const userId = req.user._id;

    // 1. Get Wallet Balance
    let wallet = await Wallet.findOne({ user: userId });
    const walletBalance = wallet ? (wallet.balance || wallet.remainingBalance || 0) : 0;

    // 2. Get Active Bids (bids on auctions that are still ACTIVE)
    const activeBids = await Bid.find({ bidder: userId })
      .populate({
        path: 'auction',
        match: { status: 'ACTIVE' }
      });
    
    // Filter out null auctions (those that don't match the status)
    const activeAuctions = activeBids.filter(bid => bid.auction !== null);
    const activeBidsCount = activeAuctions.length;

    // 3. Get Items Won (auctions where user is the winner and status is ENDED)
    const itemsWon = await Auction.countDocuments({
      winner: userId,
      status: 'ENDED'
    });

    // 4. Calculate Success Rate
    // Total participated auctions = all auctions where user has placed at least one bid
    const allUserBids = await Bid.find({ bidder: userId }).distinct('auction');
    const totalParticipatedAuctions = allUserBids.length;
    
    // Success rate = (items won / total participated) * 100
    const successRate = totalParticipatedAuctions > 0 
      ? ((itemsWon / totalParticipatedAuctions) * 100).toFixed(1)
      : 0;

    // 5. Get additional stats for charts
    // Get bids grouped by day for the last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentBids = await Bid.find({
      bidder: userId,
      createdAt: { $gte: sevenDaysAgo }
    }).sort({ createdAt: 1 });

    // Group bids by day
    const biddingActivity = [];
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);
      
      const count = recentBids.filter(bid => {
        const bidDate = new Date(bid.createdAt);
        return bidDate >= date && bidDate < nextDate;
      }).length;
      
      biddingActivity.push({
        name: days[date.getDay()],
        value: count
      });
    }

    res.json({
      walletBalance,
      activeBidsCount,
      itemsWon,
      successRate: parseFloat(successRate),
      totalParticipatedAuctions,
      biddingActivity
    });

  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    res.status(500).json({ error: error.message });
  }
};

// Get User Active Bids (for dashboard display)
exports.getUserActiveBids = async (req, res) => {
  try {
    const userId = req.user._id;
    const limit = parseInt(req.query.limit) || 5;

    const bids = await Bid.find({ bidder: userId })
      .populate({
        path: 'auction',
        match: { status: 'ACTIVE' },
        populate: { path: 'seller', select: 'name email' }
      })
      .sort({ createdAt: -1 })
      .limit(limit);

    // Filter out bids where auction is null (not active)
    const activeBids = bids.filter(bid => bid.auction !== null);

    // For each bid, check if user is currently winning
    const bidsWithStatus = await Promise.all(
      activeBids.map(async (bid) => {
        // Get the highest bid for this auction
        const highestBid = await Bid.findOne({ auction: bid.auction._id })
          .sort({ amount: -1 })
          .limit(1);

        const isWinning = highestBid && highestBid.bidder.toString() === userId.toString();
        
        // Calculate time left
        const endTime = new Date(bid.auction.endTime);
        const now = new Date();
        const timeLeft = endTime - now;
        
        let timeLeftString = 'Ended';
        if (timeLeft > 0) {
          const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
          const hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
          const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
          
          if (days > 0) {
            timeLeftString = `${days}d ${hours}h`;
          } else if (hours > 0) {
            timeLeftString = `${hours}h ${minutes}m`;
          } else {
            timeLeftString = `${minutes}m`;
          }
        }

        return {
          _id: bid._id,
          auction: {
            _id: bid.auction._id,
            title: bid.auction.title,
            images: bid.auction.images,
            currentBid: bid.auction.currentBid,
            endTime: bid.auction.endTime
          },
          yourBid: bid.amount,
          currentBid: bid.auction.currentBid,
          timeLeft: timeLeftString,
          status: isWinning ? 'winning' : 'outbid',
          createdAt: bid.createdAt
        };
      })
    );

    res.json(bidsWithStatus);

  } catch (error) {
    console.error("Error fetching active bids:", error);
    res.status(500).json({ error: error.message });
  }
};
