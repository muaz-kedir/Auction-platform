import { Card } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Link } from "react-router";
import { Clock, TrendingUp, Trophy, AlertCircle, CheckCircle2, XCircle } from "lucide-react";

const bids = {
  active: [
    {
      id: "1",
      title: "Luxury Swiss Watch",
      image: "https://images.unsplash.com/photo-1605101232508-283d0cd4909e?w=400&h=300&fit=crop",
      yourBid: 5200,
      currentBid: 5420,
      timeLeft: "2h 34m",
      status: "outbid",
    },
    {
      id: "2",
      title: "Vintage Camera",
      image: "https://images.unsplash.com/photo-1678958169679-42e6ca5785e3?w=400&h=300&fit=crop",
      yourBid: 1250,
      currentBid: 1250,
      timeLeft: "1d 8h",
      status: "winning",
    },
    {
      id: "3",
      title: "Diamond Ring 2.5ct",
      image: "https://images.unsplash.com/photo-1774504347388-3d01f7cac097?w=400&h=300&fit=crop",
      yourBid: 8600,
      currentBid: 8900,
      timeLeft: "6h 20m",
      status: "outbid",
    },
  ],
  won: [
    {
      id: "4",
      title: "Abstract Art Painting",
      image: "https://images.unsplash.com/photo-1667980898743-fcfe470b7d2a?w=400&h=300&fit=crop",
      winningBid: 2800,
      endDate: "April 10, 2026",
      status: "paid",
    },
    {
      id: "5",
      title: "Professional Camera",
      image: "https://images.unsplash.com/photo-1678958169679-42e6ca5785e3?w=400&h=300&fit=crop",
      winningBid: 1850,
      endDate: "April 8, 2026",
      status: "pending",
    },
  ],
  lost: [
    {
      id: "6",
      title: "Smartphone Pro Max",
      image: "https://images.unsplash.com/photo-1717996563514-e3519f9ef9f7?w=400&h=300&fit=crop",
      yourBid: 850,
      winningBid: 899,
      endDate: "April 9, 2026",
    },
    {
      id: "7",
      title: "Luxury Sports Car",
      image: "https://images.unsplash.com/photo-1694380975491-6cca2b30e26c?w=400&h=300&fit=crop",
      yourBid: 43000,
      winningBid: 45000,
      endDate: "April 7, 2026",
    },
  ],
};

export function MyBids() {
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
              <p className="text-2xl font-bold">{bids.active.length}</p>
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
              <p className="text-2xl font-bold">{bids.won.length}</p>
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
              <p className="text-2xl font-bold">
                {bids.active.filter(b => b.status === "winning").length}
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
              <p className="text-2xl font-bold">
                {bids.active.filter(b => b.status === "outbid").length}
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
              Active Bids ({bids.active.length})
            </TabsTrigger>
            <TabsTrigger 
              value="won"
              className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none"
            >
              Won ({bids.won.length})
            </TabsTrigger>
            <TabsTrigger 
              value="lost"
              className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none"
            >
              Lost ({bids.lost.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="p-6 space-y-4">
            {bids.active.map((bid) => (
              <Link key={bid.id} to={`/dashboard/auctions/${bid.id}`}>
                <div className="flex gap-4 p-4 rounded-lg border border-border/50 hover:border-primary/50 transition-all group">
                  <img 
                    src={bid.image} 
                    alt={bid.title}
                    className="w-24 h-24 rounded-lg object-cover"
                  />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium mb-2 group-hover:text-primary transition-colors">
                      {bid.title}
                    </h3>
                    <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                      <div>
                        <p className="text-muted-foreground">Your Bid</p>
                        <p className="font-medium">${bid.yourBid.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Current Bid</p>
                        <p className={`font-medium ${
                          bid.currentBid > bid.yourBid ? "text-destructive" : "text-secondary"
                        }`}>
                          ${bid.currentBid.toLocaleString()}
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
            ))}
          </TabsContent>

          <TabsContent value="won" className="p-6 space-y-4">
            {bids.won.map((bid) => (
              <Link key={bid.id} to={`/dashboard/auctions/${bid.id}`}>
                <div className="flex gap-4 p-4 rounded-lg border border-border/50 hover:border-primary/50 transition-all group">
                  <img 
                    src={bid.image} 
                    alt={bid.title}
                    className="w-24 h-24 rounded-lg object-cover"
                  />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium mb-2 group-hover:text-primary transition-colors">
                      {bid.title}
                    </h3>
                    <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                      <div>
                        <p className="text-muted-foreground">Winning Bid</p>
                        <p className="font-medium text-secondary">${bid.winningBid.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Ended</p>
                        <p className="font-medium">{bid.endDate}</p>
                      </div>
                    </div>
                    <Badge variant={bid.status === "paid" ? "default" : "outline"} className={bid.status === "paid" ? "bg-secondary" : ""}>
                      {bid.status === "paid" ? (
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
                    {bid.status === "pending" && (
                      <Button size="sm">Pay Now</Button>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </TabsContent>

          <TabsContent value="lost" className="p-6 space-y-4">
            {bids.lost.map((bid) => (
              <div key={bid.id} className="flex gap-4 p-4 rounded-lg border border-border/50 opacity-75">
                <img 
                  src={bid.image} 
                  alt={bid.title}
                  className="w-24 h-24 rounded-lg object-cover grayscale"
                />
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium mb-2">{bid.title}</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                    <div>
                      <p className="text-muted-foreground">Your Bid</p>
                      <p className="font-medium">${bid.yourBid.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Winning Bid</p>
                      <p className="font-medium text-destructive">${bid.winningBid.toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant="outline">
                      <XCircle className="h-3 w-3 mr-1" />
                      Lost
                    </Badge>
                    <span className="text-xs text-muted-foreground">Ended {bid.endDate}</span>
                  </div>
                </div>
              </div>
            ))}
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
}
