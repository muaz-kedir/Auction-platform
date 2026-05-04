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

// Get User Won Auctions (where user is the winner)
exports.getUserWonAuctions = async (req, res) => {
  try {
    const userId = req.user._id;

    const wonAuctions = await Auction.find({
      winner: userId,
      status: 'ENDED'
    })
    .populate('seller', 'name email')
    .sort({ endTime: -1 });

    const auctionsWithBidInfo = await Promise.all(
      wonAuctions.map(async (auction) => {
        // Get user's bid for this auction
        const userBid = await Bid.findOne({
          auction: auction._id,
          bidder: userId
        }).sort({ amount: -1 });

        // Check payment status from wallet transactions
        const wallet = await Wallet.findOne({ user: userId });
        const isPaid = wallet?.transactions?.some(t => 
          t.type === 'ESCROW' && 
          t.description?.includes(auction._id.toString())
        ) || false;

        return {
          _id: auction._id,
          title: auction.title,
          images: auction.images,
          winningBid: auction.currentBid,
          yourBid: userBid?.amount || auction.currentBid,
          endDate: auction.endTime,
          status: isPaid ? 'paid' : 'pending',
          seller: auction.seller
        };
      })
    );

    res.json(auctionsWithBidInfo);

  } catch (error) {
    console.error("Error fetching won auctions:", error);
    res.status(500).json({ error: error.message });
  }
};

// Get User Lost Auctions (auctions ended where user bid but didn't win)
exports.getUserLostAuctions = async (req, res) => {
  try {
    const userId = req.user._id;

    // Find all auctions where user placed a bid but is not the winner
    const userBids = await Bid.find({ bidder: userId }).distinct('auction');
    
    const lostAuctions = await Auction.find({
      _id: { $in: userBids },
      status: 'ENDED',
      winner: { $ne: userId }
    })
    .populate('seller', 'name email')
    .populate('winner', 'name email')
    .sort({ endTime: -1 });

    const auctionsWithBidInfo = await Promise.all(
      lostAuctions.map(async (auction) => {
        // Get user's highest bid for this auction
        const userBid = await Bid.findOne({
          auction: auction._id,
          bidder: userId
        }).sort({ amount: -1 });

        return {
          _id: auction._id,
          title: auction.title,
          images: auction.images,
          yourBid: userBid?.amount || 0,
          winningBid: auction.currentBid,
          endDate: auction.endTime,
          seller: auction.seller,
          winner: auction.winner
        };
      })
    );

    res.json(auctionsWithBidInfo);

  } catch (error) {
    console.error("Error fetching lost auctions:", error);
    res.status(500).json({ error: error.message });
  }
};

// Get Recent Activity for user (bids, outbids, wins, payments)
exports.getRecentActivity = async (req, res) => {
  try {
    const userId = req.user._id;

    // Get user's recent bids (last 20)
    const recentBids = await Bid.find({ bidder: userId })
      .populate('auction', 'title images')
      .populate('bidder', 'name')
      .sort({ createdAt: -1 })
      .limit(20);

    // Get auctions where user was outbid (user bid but is not the current highest bidder)
    const outbidAuctions = await Bid.find({ bidder: userId })
      .populate({
        path: 'auction',
        match: { status: 'ACTIVE' },
        select: 'title currentBid images'
      })
      .sort({ createdAt: -1 });

    // Filter to find where user was outbid
    const outbidActivities = outbidAuctions
      .filter(bid => bid.auction && bid.auction.currentBid > bid.amount)
      .map(bid => ({
        _id: `outbid-${bid._id}`,
        type: 'outbid',
        title: `You were outbid on ${bid.auction.title}`,
        amount: bid.auction.currentBid,
        time: bid.createdAt,
        auctionId: bid.auction._id,
        auctionTitle: bid.auction.title,
        auctionImage: bid.auction.images?.[0]
      }));

    // Get won auctions
    const wonAuctions = await Auction.find({
      winner: userId,
      status: 'ENDED'
    })
      .select('title currentBid images endTime')
      .sort({ endTime: -1 })
      .limit(10);

    const winActivities = wonAuctions.map(auction => ({
      _id: `win-${auction._id}`,
      type: 'win',
      title: `You won the auction for ${auction.title}`,
      amount: auction.currentBid,
      time: auction.endTime,
      auctionId: auction._id,
      auctionTitle: auction.title,
      auctionImage: auction.images?.[0]
    }));

    // Get recent bids activity
    const bidActivities = recentBids.map(bid => ({
      _id: `bid-${bid._id}`,
      type: 'bid',
      title: `You placed a bid on ${bid.auction?.title || 'Unknown Item'}`,
      amount: bid.amount,
      time: bid.createdAt,
      auctionId: bid.auction?._id,
      auctionTitle: bid.auction?.title,
      auctionImage: bid.auction?.images?.[0]
    }));

    // Get payment activities from wallet transactions
    const wallet = await Wallet.findOne({ user: userId });
    const paymentActivities = wallet?.transactions
      ?.filter(t => t.type === 'DEPOSIT' || t.type === 'WITHDRAWAL')
      ?.slice(0, 10)
      ?.map(t => ({
        _id: `payment-${t._id}`,
        type: 'payment',
        title: t.type === 'DEPOSIT' 
          ? `Payment received via ${t.method || 'transfer'}`
          : `Withdrawal to ${t.method || 'account'}`,
        amount: t.amount,
        time: t.createdAt || t.date,
        method: t.method
      })) || [];

    // Combine all activities
    const allActivities = [
      ...bidActivities,
      ...outbidActivities,
      ...winActivities,
      ...paymentActivities
    ];

    // Sort by time (newest first) and limit to 20
    allActivities.sort((a, b) => new Date(b.time) - new Date(a.time));
    const recentActivity = allActivities.slice(0, 20);

    res.json(recentActivity);

  } catch (error) {
    console.error("Error fetching recent activity:", error);
    res.status(500).json({ error: error.message });
  }
};
