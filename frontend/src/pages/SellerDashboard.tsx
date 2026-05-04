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
  CheckCircle,
  AlertCircle,
  Loader2,
  User,
  Mail,
  Shield,
  XCircle,
  Eye
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";
import { api } from "../services/api";
import { useAuth } from "../hooks/useAuth";
import { toast } from "sonner";
import { getImageUrl } from "../utils/imageUtils";

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
  const isSuperAdmin = user?.role === "super_admin" || user?.role === "admin";
  const [stats, setStats] = useState<DashboardStats>({
    totalAuctions: 0,
    activeAuctions: 0,
    pendingAuctions: 0,
    totalEarnings: 0,
    currentBalance: 0,
  });
  const [recentAuctions, setRecentAuctions] = useState<Auction[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleApprove = async (auctionId: string) => {
    try {
      setProcessingId(auctionId);
      await api.auctions.approve(auctionId);
      toast.success("Auction approved! Now visible on landing page.");
      fetchDashboardData(); // Refresh the list
    } catch (error: any) {
      console.error("Failed to approve auction:", error);
      toast.error(error.message || "Failed to approve auction");
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (auctionId: string) => {
    try {
      setProcessingId(auctionId);
      await api.auctions.reject(auctionId, "Rejected by admin");
      toast.success("Auction rejected");
      fetchDashboardData(); // Refresh the list
    } catch (error: any) {
      console.error("Failed to reject auction:", error);
      toast.error(error.message || "Failed to reject auction");
    } finally {
      setProcessingId(null);
    }
  };

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      let auctionsResponse;
      let myAuctions;
      let pendingAuctions;
      
      if (isSuperAdmin) {
        // Super Admin: Fetch ALL auctions including pending from all sellers
        auctionsResponse = await api.auctions.getAll({ includeAll: true });
        myAuctions = auctionsResponse; // Show all auctions
        // Count all pending auctions from all sellers
        pendingAuctions = auctionsResponse.filter(
          (a: Auction) => a.approvalStatus === "PENDING" || a.approvalStatus === "SUBMITTED"
        );
      } else {
        // Regular Seller: Fetch only their own auctions
        auctionsResponse = await api.auctions.getAll({ 
          seller: user?._id,
          includeAll: true
        });
        myAuctions = auctionsResponse.filter(
          (auction: Auction) => auction.seller?._id === user?._id || auction.seller === user?._id
        );
        pendingAuctions = myAuctions.filter(
          (a: Auction) => a.approvalStatus === "PENDING" || a.approvalStatus === "SUBMITTED"
        );
      }

      // Calculate stats
      const activeCount = auctionsResponse.filter((a: Auction) => a.status === "ACTIVE").length;
      const pendingCount = pendingAuctions.length;

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

      // Set recent auctions - Super Admin sees pending auctions first, Seller sees their own
      if (isSuperAdmin && pendingAuctions.length > 0) {
        // Super Admin: Show pending auctions first
        setRecentAuctions(pendingAuctions.slice(0, 5));
      } else {
        // Seller: Show their own auctions
        setRecentAuctions(myAuctions.slice(0, 5));
      }
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

      {/* Seller Profile Card */}
      <Card className="p-6 border-border/50 bg-card/50 backdrop-blur-sm">
        <div className="flex items-start gap-6">
          <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
            <User className="h-10 w-10 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-xl font-bold">{user?.name || "Seller"}</h2>
              <span className={`px-2 py-1 text-xs rounded-full ${
                user?.role === "super_admin" 
                  ? "bg-purple-500/20 text-purple-500" 
                  : user?.role === "admin"
                  ? "bg-blue-500/20 text-blue-500"
                  : user?.role === "seller"
                  ? "bg-green-500/20 text-green-500"
                  : "bg-muted text-muted-foreground"
              }`}>
                {user?.role?.replace("_", " ")?.toUpperCase() || "SELLER"}
              </span>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                <span>{user?.email}</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                <span>Seller Account</span>
              </div>
            </div>
          </div>
          <Link to="/dashboard/settings">
            <Button variant="outline" size="sm">Edit Profile</Button>
          </Link>
        </div>
      </Card>

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

      {/* Pending Approval Section */}
      {stats.pendingAuctions > 0 && (
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm border-l-4 border-l-yellow-500">
          <div className="p-6 border-b border-border/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-yellow-500/10 flex items-center justify-center">
                  <Clock className="h-5 w-5 text-yellow-500" />
                </div>
                <div>
                  <h2 className="text-lg font-bold">Pending Approval</h2>
                  <p className="text-sm text-muted-foreground">
                    Your auctions awaiting Super Admin review
                  </p>
                </div>
              </div>
              <span className="px-3 py-1 text-sm rounded-full bg-yellow-500/20 text-yellow-500 font-medium">
                {stats.pendingAuctions} Pending
              </span>
            </div>
          </div>
          <div className="p-6">
            <div className="space-y-3">
              {recentAuctions
                .filter((a) => a.approvalStatus === "PENDING" || a.approvalStatus === "SUBMITTED")
                .map((auction) => (
                  <div
                    key={auction._id}
                    className="flex items-center gap-4 p-4 rounded-lg border border-border/50 bg-background/50"
                  >
                    <img
                      src={getImageUrl(auction.images[0])}
                      alt={auction.title}
                      className="w-16 h-16 rounded-lg object-cover"
                    />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium truncate">{auction.title}</h3>
                      <p className="text-sm text-muted-foreground">
                        Submitted {new Date(auction.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-1 text-xs rounded-full bg-yellow-500/20 text-yellow-500">
                        Awaiting Approval
                      </span>
                      <Link to={`/dashboard/auctions/${auction._id}`}>
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}
            </div>
            <div className="mt-4 p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
              <p className="text-sm text-yellow-600">
                <strong>Note:</strong> Your auction will be reviewed by the Super Admin. 
                Once approved, it will go live and be visible to all buyers.
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Auction Status Overview */}
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <div className="p-6 border-b border-border/50">
          <h2 className="text-xl font-bold mb-4">Auction Status Overview</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="h-4 w-4 text-yellow-500" />
                <span className="text-sm font-medium text-yellow-600">Pending</span>
              </div>
              <p className="text-2xl font-bold text-yellow-500">
                {recentAuctions.filter(a => a.approvalStatus === "PENDING").length}
              </p>
            </div>
            <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="h-4 w-4 text-blue-500" />
                <span className="text-sm font-medium text-blue-600">Submitted</span>
              </div>
              <p className="text-2xl font-bold text-blue-500">
                {recentAuctions.filter(a => a.approvalStatus === "SUBMITTED").length}
              </p>
            </div>
            <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="h-4 w-4 text-green-500" />
                <span className="text-sm font-medium text-green-600">Approved</span>
              </div>
              <p className="text-2xl font-bold text-green-500">
                {recentAuctions.filter(a => a.approvalStatus === "APPROVED").length}
              </p>
            </div>
            <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20">
              <div className="flex items-center gap-2 mb-2">
                <XCircle className="h-4 w-4 text-destructive" />
                <span className="text-sm font-medium text-destructive">Rejected</span>
              </div>
              <p className="text-2xl font-bold text-destructive">
                {recentAuctions.filter(a => a.approvalStatus === "REJECTED").length}
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Recent Auctions */}
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <div className="p-6 border-b border-border/50 flex items-center justify-between">
          <h2 className="text-xl font-bold">
            {isSuperAdmin && stats.pendingAuctions > 0 ? "Pending Approval" : "Recent Auctions"}
          </h2>
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
                    src={getImageUrl(auction.images[0])}
                    alt={auction.title}
                    className="w-20 h-20 rounded-lg object-cover"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-medium truncate">{auction.title}</h3>
                      {getStatusBadge(auction)}
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                      <div>
                        <p className="text-muted-foreground">Current Bid</p>
                        <p className="font-medium text-primary">${auction.currentBid.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Time Left</p>
                        <p className="font-medium">{calculateTimeLeft(auction.endTime)}</p>
                      </div>
                    </div>
                    
                    {/* Approve/Reject buttons for Super Admin on pending auctions */}
                    {isSuperAdmin && (auction.approvalStatus === "PENDING" || auction.approvalStatus === "SUBMITTED") && (
                      <div className="flex items-center gap-2 mt-2">
                        <Button
                          size="sm"
                          onClick={() => handleApprove(auction._id)}
                          disabled={processingId === auction._id}
                          className="bg-green-500 hover:bg-green-600"
                        >
                          {processingId === auction._id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <>
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Approve
                            </>
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleReject(auction._id)}
                          disabled={processingId === auction._id}
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Reject
                        </Button>
                      </div>
                    )}
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
