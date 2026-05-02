const User = require("../models/User");
const Auction = require("../models/Auction");

// Get dashboard overview statistics
exports.getOverviewStats = async (req, res) => {
  try {
    console.log("📊 Fetching dashboard overview stats...");

    // Calculate date for "active users" (last 24 hours)
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    // Run all aggregations in parallel for performance
    const [
      activeUsersResult,
      totalUsersResult,
      auctionStatsResult
    ] = await Promise.all([
      // Active users: users updated in last 24 hours (using updatedAt as proxy for activity)
      User.countDocuments({
        updatedAt: { $gte: twentyFourHoursAgo },
        isBanned: false
      }),

      // Total users count
      User.countDocuments({ isBanned: false }),

      // Auction statistics
      Auction.aggregate([
        {
          $facet: {
            // Items sold: auctions that ended with a winner
            sold: [
              { $match: { status: "ENDED", winner: { $ne: null } } },
              { $count: "count" }
            ],
            // Total auctions
            total: [
              { $match: { status: { $ne: "REJECTED" } } },
              { $count: "count" }
            ],
            // Active auctions
            active: [
              { $match: { status: "ACTIVE" } },
              { $count: "count" }
            ],
            // Pending approval
            pending: [
              { $match: { status: "PENDING", approvalStatus: "PENDING" } },
              { $count: "count" }
            ]
          }
        }
      ])
    ]);

    // Extract values from aggregation results
    const activeUsers = activeUsersResult || 0;
    const totalUsers = totalUsersResult || 0;
    
    const soldAuctions = auctionStatsResult[0]?.sold[0]?.count || 0;
    const totalAuctions = auctionStatsResult[0]?.total[0]?.count || 0;
    const activeAuctions = auctionStatsResult[0]?.active[0]?.count || 0;
    const pendingAuctions = auctionStatsResult[0]?.pending[0]?.count || 0;

    // Calculate success rate
    const successRate = totalAuctions > 0 
      ? Math.round((soldAuctions / totalAuctions) * 100) 
      : 0;

    const stats = {
      activeUsers,
      totalUsers,
      itemsSold: soldAuctions,
      totalAuctions,
      activeAuctions,
      pendingAuctions,
      successRate
    };

    console.log("✅ Stats fetched:", stats);

    res.json({
      success: true,
      stats
    });

  } catch (error) {
    console.error("❌ Error fetching overview stats:", error);
    res.status(500).json({ 
      success: false,
      error: "Failed to fetch statistics",
      message: error.message 
    });
  }
};

// Get public stats (for homepage - limited data)
exports.getPublicStats = async (req, res) => {
  try {
    console.log("📊 Fetching public stats for homepage...");

    const [
      totalUsersResult,
      auctionStatsResult
    ] = await Promise.all([
      User.countDocuments({ isBanned: false }),
      
      Auction.aggregate([
        {
          $facet: {
            sold: [
              { $match: { status: "ENDED", winner: { $ne: null } } },
              { $count: "count" }
            ],
            total: [
              { $match: { status: { $ne: "REJECTED" } } },
              { $count: "count" }
            ]
          }
        }
      ])
    ]);

    const totalUsers = totalUsersResult || 0;
    const itemsSold = auctionStatsResult[0]?.sold[0]?.count || 0;
    const totalAuctions = auctionStatsResult[0]?.total[0]?.count || 0;
    
    // Calculate success rate
    const successRate = totalAuctions > 0 
      ? Math.round((itemsSold / totalAuctions) * 100) 
      : 0;

    // Format for homepage display
    const stats = {
      activeUsers: formatNumber(totalUsers),
      itemsSold: formatNumber(itemsSold),
      successRate: successRate,
      rawValues: {
        activeUsers: totalUsers,
        itemsSold: itemsSold,
        successRate: successRate
      }
    };

    console.log("✅ Public stats fetched:", stats);

    res.json({
      success: true,
      stats
    });

  } catch (error) {
    console.error("❌ Error fetching public stats:", error);
    res.status(500).json({ 
      success: false,
      error: "Failed to fetch statistics",
      message: error.message 
    });
  }
};

// Helper function to format numbers (e.g., 50000 -> "50K+")
function formatNumber(num) {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M+';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K+';
  }
  return num.toString();
}

// Update user's last activity (call this when user performs actions)
exports.updateUserActivity = async (userId) => {
  try {
    await User.findByIdAndUpdate(userId, {
      updatedAt: new Date()
    });
  } catch (error) {
    console.error("Error updating user activity:", error);
  }
};
