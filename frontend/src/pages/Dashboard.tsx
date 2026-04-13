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
  CheckCircle2
} from "lucide-react";
import { Link } from "react-router";
import { AreaChart, Area, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from "recharts";

const activityData = [
  { name: "Mon", value: 12 },
  { name: "Tue", value: 19 },
  { name: "Wed", value: 15 },
  { name: "Thu", value: 25 },
  { name: "Fri", value: 22 },
  { name: "Sat", value: 30 },
  { name: "Sun", value: 28 },
];

const miniChartData = [
  { value: 20 }, { value: 35 }, { value: 25 }, { value: 40 }, { value: 30 }, { value: 45 }, { value: 38 }
];

const activeBids = [
  {
    id: "1",
    title: "Luxury Swiss Watch",
    currentBid: 5420,
    yourBid: 5200,
    timeLeft: "2h 34m",
    status: "outbid",
    image: "https://images.unsplash.com/photo-1605101232508-283d0cd4909e?w=400&h=300&fit=crop",
  },
  {
    id: "2",
    title: "Vintage Camera",
    currentBid: 1250,
    yourBid: 1250,
    timeLeft: "1d 8h",
    status: "winning",
    image: "https://images.unsplash.com/photo-1678958169679-42e6ca5785e3?w=400&h=300&fit=crop",
  },
  {
    id: "3",
    title: "Diamond Ring 2.5ct",
    currentBid: 8900,
    yourBid: 8600,
    timeLeft: "6h 20m",
    status: "outbid",
    image: "https://images.unsplash.com/photo-1774504347388-3d01f7cac097?w=400&h=300&fit=crop",
  },
];

const recentActivity = [
  {
    type: "bid",
    title: "You placed a bid on Luxury Swiss Watch",
    time: "5 minutes ago",
    amount: "$5,200",
  },
  {
    type: "outbid",
    title: "You were outbid on Vintage Camera",
    time: "1 hour ago",
    amount: "$1,180",
  },
  {
    type: "win",
    title: "You won the auction for Abstract Art",
    time: "3 hours ago",
    amount: "$2,800",
  },
  {
    type: "payment",
    title: "Payment received for Classic Guitar",
    time: "1 day ago",
    amount: "$950",
  },
];

const notifications = [
  {
    id: 1,
    type: "warning",
    title: "Auction ending soon",
    message: "Your bid on Luxury Swiss Watch is ending in 2 hours",
    time: "10 min ago",
  },
  {
    id: 2,
    type: "success",
    title: "Bid placed successfully",
    message: "Your bid of $5,200 has been placed",
    time: "30 min ago",
  },
  {
    id: 3,
    type: "error",
    title: "You've been outbid",
    message: "Someone outbid you on Diamond Ring",
    time: "1 hour ago",
  },
];

export function Dashboard() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
        <p className="text-muted-foreground">Welcome back! Here's what's happening with your auctions.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Wallet Balance"
          value="$12,450"
          change="+12.5%"
          icon={Wallet}
          trend="up"
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
          value="12"
          change="+3 today"
          icon={Gavel}
          trend="up"
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
          value="28"
          change="+5 this week"
          icon={Trophy}
          trend="up"
        />
        <StatCard
          title="Success Rate"
          value="89%"
          change="+2.1%"
          icon={TrendingUp}
          trend="up"
        />
      </div>

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

            <div className="space-y-4">
              {activeBids.map((bid) => (
                <Link key={bid.id} to={`/dashboard/auctions/${bid.id}`}>
                  <div className="flex gap-4 p-4 rounded-lg border border-border/50 hover:border-primary/50 transition-all cursor-pointer group">
                    <img 
                      src={bid.image} 
                      alt={bid.title}
                      className="w-20 h-20 rounded-lg object-cover"
                    />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium mb-1 group-hover:text-primary transition-colors truncate">
                        {bid.title}
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
          </Card>

          {/* Activity Chart */}
          <Card className="p-6 border-border/50 bg-card/50 backdrop-blur-sm">
            <div className="mb-6">
              <h2 className="text-xl font-bold">Bidding Activity</h2>
              <p className="text-sm text-muted-foreground">Your bidding trends this week</p>
            </div>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={activityData}>
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

          {/* Notifications */}
          <Card className="p-6 border-border/50 bg-card/50 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Notifications</h2>
              <Badge className="bg-destructive/90">3</Badge>
            </div>
            <div className="space-y-3">
              {notifications.map((notification) => (
                <div 
                  key={notification.id}
                  className="p-3 rounded-lg border border-border/50 hover:border-primary/30 transition-all cursor-pointer"
                >
                  <div className="flex items-start gap-2 mb-1">
                    {notification.type === "warning" && (
                      <AlertCircle className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                    )}
                    {notification.type === "success" && (
                      <CheckCircle2 className="h-4 w-4 text-secondary mt-0.5 flex-shrink-0" />
                    )}
                    {notification.type === "error" && (
                      <AlertCircle className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{notification.title}</p>
                      <p className="text-xs text-muted-foreground line-clamp-2">{notification.message}</p>
                      <p className="text-xs text-muted-foreground mt-1">{notification.time}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <Link to="/dashboard/notifications">
              <Button variant="ghost" size="sm" className="w-full mt-3">
                View All Notifications
              </Button>
            </Link>
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
