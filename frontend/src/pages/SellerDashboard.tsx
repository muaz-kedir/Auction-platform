import { useState, useEffect } from "react";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Link } from "react-router";
import { 
  TrendingUp, 
  DollarSign, 
  Package, 
  Plus,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";
import { api } from "../services/api";
import { useAuth } from "../contexts/AuthContext";
import { toast } from "sonner";

interface DashboardStats {
  totalAuctions: number;
  activeAuctions: number;
  pendingAuctions: number;
  totalEarnings: number;
  currentBalance: number;
}

interface Auction {
  _id: string;
  title: string;
  images: string[];
  currentBid: number;
  status: string;
  approvalStatus: string;
  endTime: string;
  createdAt: string;
}

export function SellerDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalAuctions: 0,
    activeAuctions: 0,
    pendingAuctions: 0,
    totalEarnings: 0,
    currentBalance: 0,
  });
  const [recentAuctions, setRecentAuctions] = useState<Auction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch auctions
      const auctionsResponse = await api.auctions.getAll();
      const myAuctions = auctionsResponse.filter(
        (auction: Auction) => auction.seller?._id === user?._id || auction.seller === user?._id
      );

      // Calculate stats
      const activeCount = myAuctions.filter((a: Auction) => a.status === "ACTIVE").length;
      const pendingCount = myAuctions.filter(
        (a: Auction) => a.approvalStatus === "PENDING" || a.approvalStatus === "SUBMITTED"
      ).length;

      // Fetch wallet
      let balance = 0;
      let earnings = 0;
      try {
        const walletResponse = await api.wallet.getBalance();
        balance = walletResponse.balance || 0;
        earnings = walletResponse.totalEarnings || balance;
      } catch (error) {
        console.log("Wallet not available");
      }

      setStats({
        totalAuctions: myAuctions.length,
        activeAuctions: activeCount,
        pendingAuctions: pendingCount,
        totalEarnings: earnings,
        currentBalance: balance,
      });

      // Set recent auctions (last 5)
      setRecentAuctions(myAuctions.slice(0, 5));
    } catch (error: any) {
      console.error("Failed to fetch dashboard data:", error);
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const calculateTimeLeft = (endTime: string) => {
    const end = new Date(endTime).getTime();
    const now = new Date().getTime();
    const diff = end - now;

    if (diff <= 0) return "Ended";

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (days > 0) return `${days}d ${hours}h`;
    return `${hours}h`;
  };

  const getStatusBadge = (auction: Auction) => {
    if (auction.status === "ACTIVE") {
      return <span className="px-2 py-1 text-xs rounded-full bg-secondary/20 text-secondary">Active</span>;
    }
    if (auction.status === "ENDED") {
      return <span className="px-2 py-1 text-xs rounded-full bg-muted text-muted-foreground">Ended</span>;
    }
    if (auction.approvalStatus === "PENDING") {
      return <span className="px-2 py-1 text-xs rounded-full bg-yellow-500/20 text-yellow-500">Pending</span>;
    }
    if (auction.approvalStatus === "SUBMITTED") {
      return <span className="px-2 py-1 text-xs rounded-full bg-blue-500/20 text-blue-500">Submitted</span>;
    }
    if (auction.approvalStatus === "REJECTED") {
      return <span className="px-2 py-1 text-xs rounded-full bg-destructive/20 text-destructive">Rejected</span>;
    }
    return <span className="px-2 py-1 text-xs rounded-full bg-muted text-muted-foreground">Draft</span>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Seller Dashboard</h1>
          <p className="text-muted-foreground">Manage your auctions and track earnings</p>
        </div>
        <Link to="/dashboard/seller/create">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Create Auction
          </Button>
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-6 border-border/50 bg-card/50 backdrop-blur-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Total Auctions</p>
              <p className="text-3xl font-bold">{stats.totalAuctions}</p>
              <p className="text-xs text-muted-foreground mt-1">All time</p>
            </div>
            <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
              <Package className="h-6 w-6 text-primary" />
            </div>
          </div>
        </Card>

        <Card className="p-6 border-border/50 bg-card/50 backdrop-blur-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Active Auctions</p>
              <p className="text-3xl font-bold text-secondary">{stats.activeAuctions}</p>
              <p className="text-xs text-muted-foreground mt-1">Currently live</p>
            </div>
            <div className="h-12 w-12 rounded-lg bg-secondary/10 flex items-center justify-center">
              <CheckCircle2 className="h-6 w-6 text-secondary" />
            </div>
          </div>
        </Card>

        <Card className="p-6 border-border/50 bg-card/50 backdrop-blur-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Pending Approval</p>
              <p className="text-3xl font-bold text-yellow-500">{stats.pendingAuctions}</p>
              <p className="text-xs text-muted-foreground mt-1">Awaiting review</p>
            </div>
            <div className="h-12 w-12 rounded-lg bg-yellow-500/10 flex items-center justify-center">
              <Clock className="h-6 w-6 text-yellow-500" />
            </div>
          </div>
        </Card>

        <Card className="p-6 border-border/50 bg-card/50 backdrop-blur-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Current Balance</p>
              <p className="text-3xl font-bold text-primary">${stats.currentBalance.toLocaleString()}</p>
              <p className="text-xs text-secondary mt-1">Total: ${stats.totalEarnings.toLocaleString()}</p>
            </div>
            <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
              <DollarSign className="h-6 w-6 text-primary" />
            </div>
          </div>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link to="/dashboard/seller/auctions">
          <Card className="p-6 border-border/50 bg-card/50 backdrop-blur-sm hover:border-primary/50 transition-all cursor-pointer">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <Package className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">My Auctions</h3>
                <p className="text-sm text-muted-foreground">View and manage listings</p>
              </div>
            </div>
          </Card>
        </Link>

        <Link to="/dashboard/wallet">
          <Card className="p-6 border-border/50 bg-card/50 backdrop-blur-sm hover:border-primary/50 transition-all cursor-pointer">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-lg bg-secondary/10 flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-secondary" />
              </div>
              <div>
                <h3 className="font-semibold">Wallet</h3>
                <p className="text-sm text-muted-foreground">View earnings & withdraw</p>
              </div>
            </div>
          </Card>
        </Link>

        <Link to="/dashboard/notifications">
          <Card className="p-6 border-border/50 bg-card/50 backdrop-blur-sm hover:border-primary/50 transition-all cursor-pointer">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-lg bg-yellow-500/10 flex items-center justify-center">
                <AlertCircle className="h-6 w-6 text-yellow-500" />
              </div>
              <div>
                <h3 className="font-semibold">Notifications</h3>
                <p className="text-sm text-muted-foreground">View updates & alerts</p>
              </div>
            </div>
          </Card>
        </Link>
      </div>

      {/* Recent Auctions */}
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <div className="p-6 border-b border-border/50 flex items-center justify-between">
          <h2 className="text-xl font-bold">Recent Auctions</h2>
          <Link to="/dashboard/seller/auctions">
            <Button variant="outline" size="sm">View All</Button>
          </Link>
        </div>
        <div className="p-6">
          {recentAuctions.length === 0 ? (
            <div className="text-center py-12">
              <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No auctions yet</h3>
              <p className="text-muted-foreground mb-6">Create your first auction to get started</p>
              <Link to="/dashboard/seller/create">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Auction
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {recentAuctions.map((auction) => (
                <div
                  key={auction._id}
                  className="flex gap-4 p-4 rounded-lg border border-border/50 hover:border-primary/50 transition-all"
                >
                  <img 
                    src={auction.images[0] || "https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?w=100"}
                    alt={auction.title}
                    className="w-20 h-20 rounded-lg object-cover"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-medium truncate">{auction.title}</h3>
                      {getStatusBadge(auction)}
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Current Bid</p>
                        <p className="font-medium text-primary">${auction.currentBid.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Time Left</p>
                        <p className="font-medium">{calculateTimeLeft(auction.endTime)}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
