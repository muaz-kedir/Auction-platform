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
import { useState, useEffect } from "react";
import { api } from "../services/api";
import { toast } from "sonner";
import { useNavigate } from "react-router";
import { getImageUrl } from "../utils/imageUtils";

export function Dashboard() {
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
    biddingActivity: []
  });
  const [activeBids, setActiveBids] = useState<any[]>([]);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  
  // Fetch dashboard data
  useEffect(() => {
    if (!isSeller) {
      fetchDashboardData();
    }
  }, [isSeller]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch stats, active bids, and recent activity in parallel
      const [statsData, bidsData, activityData] = await Promise.all([
        api.dashboard.getStats(),
        api.dashboard.getActiveBids(3),
        api.dashboard.getRecentActivity()
      ]);
      
      setStats(statsData);
      setActiveBids(bidsData);
      setRecentActivity(activityData);
    } catch (error: any) {
      console.error("Failed to fetch dashboard data:", error);
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };
  
  // For sellers, render the SellerDashboard component
  if (isSeller) {
    return <SellerDashboard />;
  }

  // Mini chart data for stat cards
  const miniChartData = [
    { value: 20 }, { value: 35 }, { value: 25 }, { value: 40 }, { value: 30 }, { value: 45 }, { value: 38 }
  ];
  
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
        <p className="text-muted-foreground">Welcome back! Here's what's happening with your auctions.</p>
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
            title="Wallet Balance"
            value={`$${stats.walletBalance.toLocaleString()}`}
            change={stats.walletBalance > 0 ? "Active" : "No funds"}
            icon={Wallet}
            trend={stats.walletBalance > 0 ? "up" : "neutral"}
            chart={
              <ResponsiveContainer width="100%" height={40}>
                <AreaChart data={miniChartData}>
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
            title="Active Bids"
            value={stats.activeBidsCount.toString()}
            change={stats.activeBidsCount > 0 ? `${stats.activeBidsCount} ongoing` : "No active bids"}
            icon={Gavel}
            trend={stats.activeBidsCount > 0 ? "up" : "neutral"}
            chart={
              <ResponsiveContainer width="100%" height={40}>
                <AreaChart data={miniChartData}>
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
            title="Items Won"
            value={stats.itemsWon.toString()}
            change={stats.itemsWon > 0 ? `${stats.itemsWon} total` : "No wins yet"}
            icon={Trophy}
            trend={stats.itemsWon > 0 ? "up" : "neutral"}
          />
          <StatCard
            title="Success Rate"
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
                <h2 className="text-xl font-bold">Active Bids</h2>
                <p className="text-sm text-muted-foreground">Track your ongoing auctions</p>
              </div>
              <Link to="/dashboard/my-bids">
                <Button variant="outline" size="sm" className="gap-2">
                  View All <ArrowUpRight className="h-4 w-4" />
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
                <p className="text-muted-foreground">No active bids yet</p>
                <Link to="/dashboard/auctions">
                  <Button className="mt-4">Browse Auctions</Button>
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
              <h2 className="text-xl font-bold">Bidding Activity</h2>
              <p className="text-sm text-muted-foreground">Your bidding trends this week</p>
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
            <h2 className="text-xl font-bold mb-4">Quick Actions</h2>
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
            <h2 className="text-xl font-bold mb-4">Recent Activity</h2>
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
