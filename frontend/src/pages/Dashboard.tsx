import { Card } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { StatCard } from "../components/auction/StatCard";
import { 
  Wallet, 
  TrendingUp, 
  Gavel, 
  Trophy,
  ArrowUpRight,
  Clock,
  AlertCircle,
  CheckCircle2,
  Loader2
} from "lucide-react";
import { Link } from "react-router";
import { AreaChart, Area, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from "recharts";
import { useAuth } from "../hooks/useAuth";
import { SellerDashboard } from "./SellerDashboard";
import { useState, useEffect, useCallback, useRef } from "react";
import { api } from "../services/api";
import { toast } from "sonner";
import { useNavigate } from "react-router";
import { getImageUrl } from "../utils/imageUtils";
import { useSocket } from "../hooks/useSocket";
import { useTranslation } from "react-i18next";

export function Dashboard() {
  const { t } = useTranslation();
  const { user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const isSeller = user?.role === "seller";
  const isBuyer = user?.role === "buyer";
  
  // Redirect buyers immediately - they don't have a dashboard
  useEffect(() => {
    if (!authLoading && isBuyer) {
      console.log('🔄 Redirecting buyer to auctions...');
      navigate("/dashboard/auctions", { replace: true });
    }
  }, [authLoading, isBuyer, navigate]);
  
  // Show loading while auth is loading or while buyer is being redirected
  if (authLoading || isBuyer) {
    console.log('⏳ Dashboard loading:', { authLoading, isBuyer });
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  // State for dashboard data
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    walletBalance: 0,
    activeBidsCount: 0,
    itemsWon: 0,
    successRate: 0,
    totalParticipatedAuctions: 0,
    biddingActivity: [],
    isWalletVerified: false
  });
  const [activeBids, setActiveBids] = useState<any[]>([]);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const socket = useSocket();

  // Define fetchDashboardData first (before any useEffect that references it)
  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      console.log('📊 Fetching dashboard data for user:', user?._id);

      let stats = {};
      let bids = {};
      let activities = {};

      try {
        // Try fetching stats first
        const statsData = await api.dashboard.getStats();
        console.log('📊 Stats API response:', statsData);
        // Backend returns data directly, not wrapped in 'data' property
        stats = statsData || {};
      } catch (statsError) {
        console.error('📊 Failed to fetch stats:', statsError);
      }

      try {
        // Then fetch active bids
        const bidsData = await api.dashboard.getActiveBids(3);
        console.log('📊 Bids API response:', bidsData);
        // Backend returns array directly or { bids: [...] }
        bids = bidsData || [];
      } catch (bidsError) {
        console.error('📊 Failed to fetch bids:', bidsError);
      }

      try {
        // Finally fetch recent activity
        const activityData = await api.dashboard.getRecentActivity();
        console.log('📊 Activity API response:', activityData);
        // Backend returns array directly or { activities: [...] }
        activities = activityData || [];
      } catch (activityError) {
        console.error('📊 Failed to fetch activity:', activityError);
      }

      console.log('📊 Final stats to display:', {
        walletBalance: stats.walletBalance ?? 0,
        activeBidsCount: stats.activeBidsCount ?? 0,
        itemsWon: stats.itemsWon ?? 0,
        successRate: stats.successRate ?? 0,
        isWalletVerified: stats.isWalletVerified,
        totalParticipatedAuctions: stats.totalParticipatedAuctions ?? 0,
        isWalletVerified: stats.isWalletVerified
      });

      setStats({
        walletBalance: stats.walletBalance ?? 0,
        activeBidsCount: stats.activeBidsCount ?? 0,
        itemsWon: stats.itemsWon ?? 0,
        successRate: stats.successRate ?? 0,
        totalParticipatedAuctions: stats.totalParticipatedAuctions ?? 0,
        biddingActivity: stats.biddingActivity || [],
        isWalletVerified: stats.isWalletVerified || false
      });
      setActiveBids(bids.bids || bids || []);
      setRecentActivity(activities.activities || activities || []);
    } catch (error: any) {
      console.error("Failed to fetch dashboard data:", error);
      toast.error("Failed to load dashboard data: " + error.message);
    } finally {
      setLoading(false);
    }
  }, [user?._id]);

  // Create a ref to store the fetch function for socket callbacks
  const fetchDashboardRef = useRef(fetchDashboardData);

  // Keep the ref updated with the latest function
  useEffect(() => {
    fetchDashboardRef.current = fetchDashboardData;
  }, [fetchDashboardData]);

  // Fetch dashboard data on mount - only run once when isSeller is determined
  useEffect(() => {
    if (!isSeller && user?._id) {
      console.log('📊 Initial dashboard data fetch for user:', user._id);
      fetchDashboardData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSeller, user?._id]); // Only depend on isSeller and user ID, not fetchDashboardData

  // Listen for real-time updates - use ref to avoid dependency issues
  useEffect(() => {
    if (!socket || isSeller) return;

    console.log('📊 Setting up dashboard real-time updates');

    // Refresh stats when a bid is placed
    const handleBidUpdate = (data: any) => {
      console.log('📊 Bid update received, refreshing dashboard:', data);
      // Call fetchDashboardData directly from the ref
      fetchDashboardRef.current?.();
    };

    // Refresh stats when auction ends
    const handleNotificationUpdate = (data: any) => {
      if (data.type === 'auction_ended' || data.type === 'auction_created') {
        console.log('📊 Auction event received, refreshing dashboard:', data);
        fetchDashboardRef.current?.();
      }
    };

    socket.on('bidUpdate', handleBidUpdate);
    socket.on('notificationUpdate', handleNotificationUpdate);

    return () => {
      socket.off('bidUpdate', handleBidUpdate);
      socket.off('notificationUpdate', handleNotificationUpdate);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket, isSeller]); // Don't include fetchDashboardData here

  // For sellers, render the SellerDashboard component
  if (isSeller) {
    return <SellerDashboard />;
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">{t('dashboard.dashboard')}</h1>
        <p className="text-muted-foreground">{t('dashboard.welcome_desc')}</p>
      </div>

      {/* Stats Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="p-6 border-border/50 bg-card/50 backdrop-blur-sm">
              <div className="flex items-center justify-center h-24">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title={t('dashboard.wallet_balance')}
            value={`$${stats.walletBalance.toLocaleString()}`}
            change={stats.isWalletVerified ? (stats.walletBalance > 0 ? "Active" : "No funds") : "Wallet not verified"}
            icon={Wallet}
            trend={stats.walletBalance > 0 ? "up" : "neutral"}
            chart={
              <ResponsiveContainer width="100%" height={40}>
                <AreaChart data={stats.biddingActivity || []}>
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke="#2563EB"
                    fill="#2563EB"
                    fillOpacity={0.2}
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            }
          />
          <StatCard
            title={t('dashboard.active_bids')}
            value={stats.activeBidsCount.toString()}
            change={stats.activeBidsCount > 0 ? `${stats.activeBidsCount} ongoing` : "No active bids"}
            icon={Gavel}
            trend={stats.activeBidsCount > 0 ? "up" : "neutral"}
            chart={
              <ResponsiveContainer width="100%" height={40}>
                <AreaChart data={stats.biddingActivity || []}>
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke="#10B981"
                    fill="#10B981"
                    fillOpacity={0.2}
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            }
          />
          <StatCard
            title={t('dashboard.items_won')}
            value={stats.itemsWon.toString()}
            change={stats.itemsWon > 0 ? `${stats.itemsWon} total` : "No wins yet"}
            icon={Trophy}
            trend={stats.itemsWon > 0 ? "up" : "neutral"}
          />
          <StatCard
            title={t('dashboard.success_rate')}
            value={`${stats.successRate}%`}
            change={stats.totalParticipatedAuctions > 0 ? `${stats.totalParticipatedAuctions} participated` : "No data"}
            icon={TrendingUp}
            trend={stats.successRate > 50 ? "up" : stats.successRate > 0 ? "neutral" : "down"}
          />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Bids */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="p-6 border-border/50 bg-card/50 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold">{t('dashboard.active_bids')}</h2>
                <p className="text-sm text-muted-foreground">{t('dashboard.track_ongoing')}</p>
              </div>
              <Link to="/dashboard/my-bids">
                <Button variant="outline" size="sm" className="gap-2">
                  {t('common.view_all')} <ArrowUpRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>

            {loading ? (
              <div className="flex items-center justify-center h-48">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : activeBids.length === 0 ? (
              <div className="text-center py-12">
                <Gavel className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">{t('dashboard.no_active_bids')}</p>
                <Link to="/dashboard/auctions">
                  <Button className="mt-4">{t('landing.explore_auctions')}</Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {activeBids.map((bid) => (
                  <Link key={bid._id} to={`/dashboard/auctions/${bid.auction._id}`}>
                    <div className="flex gap-4 p-4 rounded-lg border border-border/50 hover:border-primary/50 transition-all cursor-pointer group">
                      <img 
                        src={getImageUrl(bid.auction.images?.[0])} 
                        alt={bid.auction.title}
                        className="w-20 h-20 rounded-lg object-cover"
                      />
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium mb-1 group-hover:text-primary transition-colors truncate">
                          {bid.auction.title}
                        </h3>
                        <div className="flex items-center gap-4 text-sm mb-2">
                          <span className="text-muted-foreground">
                            Your bid: <span className="text-foreground font-medium">${bid.yourBid.toLocaleString()}</span>
                          </span>
                          <span className="text-muted-foreground">
                            Current: <span className="text-primary font-medium">${bid.currentBid.toLocaleString()}</span>
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge 
                            variant={bid.status === "winning" ? "default" : "destructive"}
                            className={bid.status === "winning" ? "bg-secondary" : ""}
                          >
                            {bid.status === "winning" ? (
                              <>
                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                Winning
                              </>
                            ) : (
                              <>
                                <AlertCircle className="h-3 w-3 mr-1" />
                                Outbid
                              </>
                            )}
                          </Badge>
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {bid.timeLeft}
                          </span>
                        </div>
                      </div>
                      <Button variant="outline" size="sm" className="self-center">
                        Place Bid
                      </Button>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </Card>

          {/* Activity Chart */}
          <Card className="p-6 border-border/50 bg-card/50 backdrop-blur-sm">
            <div className="mb-6">
              <h2 className="text-xl font-bold">{t('dashboard.bidding_activity')}</h2>
              <p className="text-sm text-muted-foreground">{t('dashboard.activity_desc')}</p>
            </div>
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={stats.biddingActivity.length > 0 ? stats.biddingActivity : [
                  { name: "Mon", value: 0 },
                  { name: "Tue", value: 0 },
                  { name: "Wed", value: 0 },
                  { name: "Thu", value: 0 },
                  { name: "Fri", value: 0 },
                  { name: "Sat", value: 0 },
                  { name: "Sun", value: 0 },
                ]}>
                  <XAxis 
                    dataKey="name" 
                    stroke="#9ca3af"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis 
                    stroke="#9ca3af"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1a1a24',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '8px'
                    }}
                  />
                  <Bar 
                    dataKey="value" 
                    fill="#2563EB" 
                    radius={[8, 8, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Quick Actions */}
          <Card className="p-6 border-border/50 bg-card/50 backdrop-blur-sm">
            <h2 className="text-xl font-bold mb-4">{t('dashboard.quick_actions')}</h2>
            <div className="space-y-2">
              <Link to="/dashboard/auctions">
                <Button variant="outline" className="w-full justify-start gap-2">
                  <Gavel className="h-4 w-4" />
                  Browse Auctions
                </Button>
              </Link>
              <Link to="/dashboard/wallet">
                <Button variant="outline" className="w-full justify-start gap-2">
                  <Wallet className="h-4 w-4" />
                  Add Funds
                </Button>
              </Link>
              <Link to="/dashboard/seller/create">
                <Button variant="outline" className="w-full justify-start gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Create Auction
                </Button>
              </Link>
            </div>
          </Card>

          {/* Recent Activity */}
          <Card className="p-6 border-border/50 bg-card/50 backdrop-blur-sm">
            <h2 className="text-xl font-bold mb-4">{t('dashboard.recent_activity')}</h2>
            <div className="space-y-3">
              {recentActivity.map((activity, index) => (
                <div key={index} className="flex items-start gap-3 pb-3 border-b border-border/50 last:border-0 last:pb-0">
                  <div className={`h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    activity.type === "bid" ? "bg-primary/10 text-primary" :
                    activity.type === "outbid" ? "bg-destructive/10 text-destructive" :
                    activity.type === "win" ? "bg-secondary/10 text-secondary" :
                    "bg-muted text-foreground"
                  }`}>
                    {activity.type === "bid" && <Gavel className="h-4 w-4" />}
                    {activity.type === "outbid" && <TrendingUp className="h-4 w-4" />}
                    {activity.type === "win" && <Trophy className="h-4 w-4" />}
                    {activity.type === "payment" && <Wallet className="h-4 w-4" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm truncate">{activity.title}</p>
                    <div className="flex items-center justify-between mt-1">
                      <p className="text-xs text-muted-foreground">{activity.time}</p>
                      <p className="text-sm font-medium">{activity.amount}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
