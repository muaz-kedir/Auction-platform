import { useState, useEffect } from "react";
import { Card } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Link } from "react-router";
import { Clock, TrendingUp, Trophy, AlertCircle, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { api } from "../services/api";
import { toast } from "sonner";
import { getImageUrl } from "../utils/imageUtils";

interface Bid {
  _id: string;
  auction: {
    _id: string;
    title: string;
    images: string[];
    currentBid: number;
    endTime: string;
  };
  yourBid: number;
  currentBid: number;
  timeLeft: string;
  status: 'winning' | 'outbid';
  createdAt: string;
}

interface WonAuction {
  _id: string;
  title: string;
  images: string[];
  winningBid: number;
  yourBid: number;
  endDate: string;
  status: 'paid' | 'pending';
  seller: { name: string; email: string };
}

interface LostAuction {
  _id: string;
  title: string;
  images: string[];
  yourBid: number;
  winningBid: number;
  endDate: string;
  seller: { name: string; email: string };
  winner: { name: string; email: string };
}


export function MyBids() {
  const [activeBids, setActiveBids] = useState<Bid[]>([]);
  const [wonAuctions, setWonAuctions] = useState<WonAuction[]>([]);
  const [lostAuctions, setLostAuctions] = useState<LostAuction[]>([]);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [stats, setStats] = useState({
    activeBidsCount: 0,
    itemsWon: 0,
    winningCount: 0,
    outbidCount: 0
  });

  useEffect(() => {
    fetchBidsData();
  }, []);

  const fetchBidsData = async () => {
    try {
      setLoading(true);
      setStatsLoading(true);
      
      console.log("📊 Fetching My Bids data...");
      
      // Fetch all data in parallel
      const [activeBidsRes, wonRes, lostRes, statsRes] = await Promise.all([
        api.dashboard.getActiveBids(50),
        api.dashboard.getWonAuctions(),
        api.dashboard.getLostAuctions(),
        api.dashboard.getStats()
      ]);
      
      console.log("✅ Active bids:", activeBidsRes);
      console.log("✅ Won auctions:", wonRes);
      console.log("✅ Lost auctions:", lostRes);
      console.log("✅ Stats:", statsRes);
      
      setActiveBids(activeBidsRes || []);
      setWonAuctions(wonRes || []);
      setLostAuctions(lostRes || []);
      
      // Calculate stats
      const winningCount = (activeBidsRes || []).filter((b: Bid) => b.status === 'winning').length;
      const outbidCount = (activeBidsRes || []).filter((b: Bid) => b.status === 'outbid').length;
      
      setStats({
        activeBidsCount: statsRes?.activeBidsCount || activeBidsRes?.length || 0,
        itemsWon: statsRes?.itemsWon || wonRes?.length || 0,
        winningCount,
        outbidCount
      });
    } catch (error: any) {
      console.error("❌ Error fetching bids:", error);
      toast.error("Failed to load your bids");
    } finally {
      setLoading(false);
      setStatsLoading(false);
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">My Bids</h1>
        <p className="text-muted-foreground">Track all your bidding activity</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-6 border-border/50 bg-card/50 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
              <TrendingUp className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className={`text-2xl font-bold ${statsLoading ? 'animate-pulse text-muted-foreground' : ''}`}>
                {statsLoading ? '...' : stats.activeBidsCount}
              </p>
              <p className="text-sm text-muted-foreground">Active Bids</p>
            </div>
          </div>
        </Card>
        <Card className="p-6 border-border/50 bg-card/50 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-lg bg-secondary/10 flex items-center justify-center">
              <Trophy className="h-6 w-6 text-secondary" />
            </div>
            <div>
              <p className={`text-2xl font-bold ${statsLoading ? 'animate-pulse text-muted-foreground' : ''}`}>
                {statsLoading ? '...' : stats.itemsWon}
              </p>
              <p className="text-sm text-muted-foreground">Items Won</p>
            </div>
          </div>
        </Card>
        <Card className="p-6 border-border/50 bg-card/50 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-lg bg-yellow-500/10 flex items-center justify-center">
              <CheckCircle2 className="h-6 w-6 text-yellow-500" />
            </div>
            <div>
              <p className={`text-2xl font-bold ${statsLoading ? 'animate-pulse text-muted-foreground' : ''}`}>
                {statsLoading ? '...' : stats.winningCount}
              </p>
              <p className="text-sm text-muted-foreground">Winning</p>
            </div>
          </div>
        </Card>
        <Card className="p-6 border-border/50 bg-card/50 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-lg bg-destructive/10 flex items-center justify-center">
              <AlertCircle className="h-6 w-6 text-destructive" />
            </div>
            <div>
              <p className={`text-2xl font-bold ${statsLoading ? 'animate-pulse text-muted-foreground' : ''}`}>
                {statsLoading ? '...' : stats.outbidCount}
              </p>
              <p className="text-sm text-muted-foreground">Outbid</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Tabs */}
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <Tabs defaultValue="active" className="w-full">
          <TabsList className="w-full justify-start border-b rounded-none h-auto p-0 bg-transparent">
            <TabsTrigger 
              value="active" 
              className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none"
            >
              Active Bids ({activeBids.length})
            </TabsTrigger>
            <TabsTrigger 
              value="won"
              className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none"
            >
              Won ({wonAuctions.length})
            </TabsTrigger>
            <TabsTrigger 
              value="lost"
              className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none"
            >
              Lost ({lostAuctions.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="p-6 space-y-4">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-2 text-muted-foreground">Loading your active bids...</span>
              </div>
            ) : activeBids.length === 0 ? (
              <div className="text-center py-12">
                <TrendingUp className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h3 className="text-lg font-semibold mb-2">No Active Bids</h3>
                <p className="text-muted-foreground">You haven't placed any bids yet. Start exploring auctions!</p>
                <Link to="/dashboard/auctions">
                  <Button className="mt-4">Browse Auctions</Button>
                </Link>
              </div>
            ) : (
              activeBids.map((bid) => (
                <Link key={bid._id} to={`/dashboard/auctions/${bid.auction._id}`}>
                  <div className="flex gap-4 p-4 rounded-lg border border-border/50 hover:border-primary/50 transition-all group cursor-pointer">
                    <img 
                      src={getImageUrl(bid.auction.images?.[0])} 
                      alt={bid.auction.title}
                      className="w-24 h-24 rounded-lg object-cover"
                    />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium mb-2 group-hover:text-primary transition-colors">
                        {bid.auction.title}
                      </h3>
                      <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                        <div>
                          <p className="text-muted-foreground">Your Bid</p>
                          <p className="font-medium">${bid.yourBid?.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Current Bid</p>
                          <p className={`font-medium ${
                            bid.auction.currentBid > bid.yourBid ? "text-destructive" : "text-secondary"
                          }`}>
                            ${bid.auction.currentBid?.toLocaleString()}
                          </p>
                        </div>
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
                          {bid.timeLeft} left
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col justify-between items-end">
                      <Button size="sm" variant={bid.status === "outbid" ? "default" : "outline"}>
                        {bid.status === "outbid" ? "Increase Bid" : "View"}
                      </Button>
                    </div>
                  </div>
                </Link>
              ))
            )}
          </TabsContent>

          <TabsContent value="won" className="p-6 space-y-4">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-2 text-muted-foreground">Loading your won auctions...</span>
              </div>
            ) : wonAuctions.length === 0 ? (
              <div className="text-center py-12">
                <Trophy className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h3 className="text-lg font-semibold mb-2">No Items Won Yet</h3>
                <p className="text-muted-foreground">Keep bidding to win your first auction!</p>
                <Link to="/dashboard/auctions">
                  <Button className="mt-4">Browse Auctions</Button>
                </Link>
              </div>
            ) : (
              wonAuctions.map((auction) => (
                <Link key={auction._id} to={`/dashboard/auctions/${auction._id}`}>
                  <div className="flex gap-4 p-4 rounded-lg border border-border/50 hover:border-primary/50 transition-all group cursor-pointer">
                    <img 
                      src={getImageUrl(auction.images?.[0])} 
                      alt={auction.title}
                      className="w-24 h-24 rounded-lg object-cover"
                    />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium mb-2 group-hover:text-primary transition-colors">
                        {auction.title}
                      </h3>
                      <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                        <div>
                          <p className="text-muted-foreground">Winning Bid</p>
                          <p className="font-medium text-secondary">${auction.winningBid?.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Ended</p>
                          <p className="font-medium">{formatDate(auction.endDate)}</p>
                        </div>
                      </div>
                      <Badge variant={auction.status === "paid" ? "default" : "outline"} className={auction.status === "paid" ? "bg-secondary" : ""}>
                        {auction.status === "paid" ? (
                          <>
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Payment Complete
                          </>
                        ) : (
                          <>
                            <AlertCircle className="h-3 w-3 mr-1" />
                            Payment Pending
                          </>
                        )}
                      </Badge>
                    </div>
                    <div className="flex flex-col justify-between items-end">
                      <Trophy className="h-6 w-6 text-yellow-500" />
                      {auction.status === "pending" && (
                        <Button size="sm">Pay Now</Button>
                      )}
                    </div>
                  </div>
                </Link>
              ))
            )}
          </TabsContent>

          <TabsContent value="lost" className="p-6 space-y-4">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-2 text-muted-foreground">Loading your lost bids...</span>
              </div>
            ) : lostAuctions.length === 0 ? (
              <div className="text-center py-12">
                <XCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h3 className="text-lg font-semibold mb-2">No Lost Bids</h3>
                <p className="text-muted-foreground">You haven't lost any auctions. Great job!</p>
              </div>
            ) : (
              lostAuctions.map((auction) => (
                <div key={auction._id} className="flex gap-4 p-4 rounded-lg border border-border/50 opacity-75">
                  <img 
                    src={getImageUrl(auction.images?.[0])} 
                    alt={auction.title}
                    className="w-24 h-24 rounded-lg object-cover grayscale"
                  />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium mb-2">{auction.title}</h3>
                    <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                      <div>
                        <p className="text-muted-foreground">Your Bid</p>
                        <p className="font-medium">${auction.yourBid?.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Winning Bid</p>
                        <p className="font-medium text-destructive">${auction.winningBid?.toLocaleString()}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant="outline">
                        <XCircle className="h-3 w-3 mr-1" />
                        Lost
                      </Badge>
                      <span className="text-xs text-muted-foreground">Ended {formatDate(auction.endDate)}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
}
