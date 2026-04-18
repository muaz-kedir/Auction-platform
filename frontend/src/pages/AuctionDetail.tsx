import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Card } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Separator } from "../components/ui/separator";
import { CountdownTimer } from "../components/auction/CountdownTimer";
import { AuctionCard } from "../components/auction/AuctionCard";
import {
  Heart,
  Share2,
  TrendingUp,
  Shield,
  Package,
  MapPin,
  Users,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  Gavel,
  Loader2,
  ArrowLeft
} from "lucide-react";
import { toast } from "sonner@2.0.3";
import { api } from "../services/api";
import { useAuth } from "../contexts/AuthContext";

interface Auction {
  _id: string;
  title: string;
  description: string;
  images: string[];
  currentBid: number;
  startingBid: number;
  endTime: string;
  status: string;
  seller: {
    _id: string;
    name: string;
    email: string;
    profileImage?: string;
  };
  category?: {
    _id: string;
    name: string;
  };
  createdAt: string;
}

export function AuctionDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [auction, setAuction] = useState<Auction | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [bidAmount, setBidAmount] = useState("");
  const [isFavorite, setIsFavorite] = useState(false);
  const [placingBid, setPlacingBid] = useState(false);

  useEffect(() => {
    if (id) {
      fetchAuction();
    }
  }, [id]);

  const fetchAuction = async () => {
    try {
      setLoading(true);
      const data = await api.auctions.getById(id!);
      setAuction(data);
    } catch (error: any) {
      console.error("Failed to fetch auction:", error);
      toast.error("Failed to load auction details");
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
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const handlePlaceBid = async () => {
    if (!auction) return;
    
    const amount = parseFloat(bidAmount);
    const minBid = auction.currentBid + 10;

    if (!amount || amount < minBid) {
      toast.error(`Bid amount must be at least $${minBid.toLocaleString()}`);
      return;
    }

    try {
      setPlacingBid(true);
      await api.bids.placeBid(auction._id, amount);
      toast.success("Bid placed successfully!", {
        description: `Your bid of $${amount.toLocaleString()} has been placed.`,
      });
      setBidAmount("");
      fetchAuction();
    } catch (error: any) {
      console.error("Failed to place bid:", error);
      toast.error(error.message || "Failed to place bid");
    } finally {
      setPlacingBid(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!auction) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <h2 className="text-2xl font-bold mb-2">Auction not found</h2>
        <p className="text-muted-foreground mb-6">The auction you're looking for doesn't exist.</p>
        <Button onClick={() => navigate("/")}>Back to Home</Button>
      </div>
    );
  }

  const endTime = new Date(auction.endTime);
  const minBid = auction.currentBid + 10;
  const images = auction.images.length > 0 
    ? auction.images 
    : ["https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?w=800&h=600&fit=crop"];
  const isActive = auction.status === "ACTIVE";
  const timeLeft = calculateTimeLeft(auction.endTime);

  return (
    <div className="space-y-8">
      {/* Back Button */}
      <Button
        variant="ghost"
        className="gap-2"
        onClick={() => navigate("/")}
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Auctions
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Images */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="overflow-hidden border-border/50 bg-card/50 backdrop-blur-sm">
            <div className="relative aspect-[4/3] bg-muted">
              <img
                src={images[selectedImage]}
                alt={auction.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute top-4 left-4 flex gap-2">
                {isActive && (
                  <Badge className="bg-destructive/90 backdrop-blur-sm border-0 animate-pulse">
                    <span className="relative flex h-2 w-2 mr-1.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                    </span>
                    LIVE
                  </Badge>
                )}
                <Badge className="bg-primary/90 backdrop-blur-sm border-0">
                  <Sparkles className="h-3 w-3 mr-1" />
                  Verified
                </Badge>
              </div>
              <div className="absolute top-4 right-4 flex gap-2">
                <Button
                  size="icon"
                  variant="secondary"
                  className="backdrop-blur-sm bg-black/50 hover:bg-black/70"
                  onClick={() => setIsFavorite(!isFavorite)}
                >
                  <Heart className={`h-4 w-4 ${isFavorite ? "fill-red-500 text-red-500" : ""}`} />
                </Button>
                <Button
                  size="icon"
                  variant="secondary"
                  className="backdrop-blur-sm bg-black/50 hover:bg-black/70"
                  onClick={() => {
                    navigator.clipboard.writeText(window.location.href);
                    toast.success("Link copied to clipboard!");
                  }}
                >
                  <Share2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
            {images.length > 1 && (
              <div className="p-4 flex gap-2 overflow-x-auto">
                {images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={`relative flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                      selectedImage === index
                        ? "border-primary"
                        : "border-transparent hover:border-muted-foreground/50"
                    }`}
                  >
                    <img src={image} alt={`Thumbnail ${index + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </Card>

          {/* Tabs - Description, Shipping, etc. */}
          <Card className="p-6 border-border/50 bg-card/50 backdrop-blur-sm">
            <Tabs defaultValue="description">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="description">Description</TabsTrigger>
                <TabsTrigger value="shipping">Shipping & Safety</TabsTrigger>
              </TabsList>
              <TabsContent value="description" className="space-y-4 pt-4">
                <div>
                  <h3 className="font-semibold mb-2">About This Item</h3>
                  <p className="text-muted-foreground whitespace-pre-wrap">
                    {auction.description}
                  </p>
                </div>
                <Separator />
                <div>
                  <h3 className="font-semibold mb-2">Details</h3>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex justify-between">
                      <span>Category:</span>
                      <span className="text-foreground">{auction.category?.name || "Uncategorized"}</span>
                    </li>
                    <li className="flex justify-between">
                      <span>Starting Bid:</span>
                      <span className="text-foreground">${auction.startingBid.toLocaleString()}</span>
                    </li>
                    <li className="flex justify-between">
                      <span>Status:</span>
                      <Badge variant={isActive ? "default" : "secondary"}>{auction.status}</Badge>
                    </li>
                    <li className="flex justify-between">
                      <span>Listed:</span>
                      <span className="text-foreground">{new Date(auction.createdAt).toLocaleDateString()}</span>
                    </li>
                  </ul>
                </div>
              </TabsContent>
              <TabsContent value="shipping" className="space-y-4 pt-4">
                <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50">
                  <Package className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-medium mb-1">Secure Shipping</h4>
                    <p className="text-sm text-muted-foreground">
                      Insured delivery with tracking. Ships within 2 business days after payment.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50">
                  <Shield className="h-5 w-5 text-secondary flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-medium mb-1">Buyer Protection</h4>
                    <p className="text-sm text-muted-foreground">
                      Full escrow protection. Payment released only after you confirm receipt.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50">
                  <MapPin className="h-5 w-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-medium mb-1">Authenticity Guaranteed</h4>
                    <p className="text-sm text-muted-foreground">
                      30-day money-back guarantee if item is not as described.
                    </p>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </Card>
        </div>

        {/* Right Column - Bidding */}
        <div className="space-y-4">
          {/* Countdown */}
          <Card className="p-6 border-border/50 bg-card/50 backdrop-blur-sm">
            <div className="space-y-4">
              <div>
                <h1 className="text-2xl font-bold mb-2">{auction.title}</h1>
                {auction.category && (
                  <Badge variant="secondary">{auction.category.name}</Badge>
                )}
              </div>

              <Separator />

              <div>
                <p className="text-sm text-muted-foreground mb-2">Time Remaining</p>
                <CountdownTimer endTime={endTime} />
              </div>

              <Separator />

              <div className="space-y-3">
                <div className="flex items-baseline justify-between">
                  <span className="text-sm text-muted-foreground">Current Bid</span>
                  <span className="text-3xl font-bold text-primary">${auction.currentBid.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <Users className="h-3.5 w-3.5" />
                    Bidding active
                  </span>
                  <span className="text-secondary flex items-center gap-1">
                    <TrendingUp className="h-3.5 w-3.5" />
                    {isActive ? "Live" : "Ended"}
                  </span>
                </div>
              </div>

              {isActive && (
                <>
                  <Separator />

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium">Your Bid</label>
                      <span className="text-xs text-muted-foreground">
                        Min: ${minBid.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        placeholder={`${minBid.toLocaleString()}`}
                        value={bidAmount}
                        onChange={(e) => setBidAmount(e.target.value)}
                        className="flex-1"
                        disabled={placingBid}
                      />
                      <Button onClick={handlePlaceBid} className="gap-2" disabled={placingBid}>
                        {placingBid ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Gavel className="h-4 w-4" />
                        )}
                        Bid
                      </Button>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1" 
                        onClick={() => setBidAmount(String(minBid))}
                        disabled={placingBid}
                      >
                        ${minBid.toLocaleString()}
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1" 
                        onClick={() => setBidAmount(String(minBid + 100))}
                        disabled={placingBid}
                      >
                        ${(minBid + 100).toLocaleString()}
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1" 
                        onClick={() => setBidAmount(String(minBid + 250))}
                        disabled={placingBid}
                      >
                        ${(minBid + 250).toLocaleString()}
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-start gap-2 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                    <AlertCircle className="h-4 w-4 text-blue-500 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-muted-foreground">
                      By placing a bid, you agree to the auction terms and commit to purchase if you win.
                    </p>
                  </div>
                </>
              )}
            </div>
          </Card>

          {/* Seller Info */}
          <Card className="p-6 border-border/50 bg-card/50 backdrop-blur-sm">
            <h3 className="font-semibold mb-4">Seller Information</h3>
            <div className="flex items-start gap-3 mb-4">
              <Avatar className="h-12 w-12">
                <AvatarImage src={auction.seller.profileImage || `https://api.dicebear.com/7.x/avataaars/svg?seed=${auction.seller.name}`} />
                <AvatarFallback>{auction.seller.name.charAt(0).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-medium">{auction.seller.name}</p>
                  <Badge variant="outline" className="text-xs bg-secondary/10 text-secondary border-secondary/20">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Verified
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">Trusted Seller</p>
              </div>
            </div>
          </Card>

          {/* Trust & Safety */}
          <Card className="p-6 border-border/50 bg-card/50 backdrop-blur-sm">
            <h3 className="font-semibold mb-4">Trust & Safety</h3>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Shield className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium">Escrow Protection</p>
                  <p className="text-xs text-muted-foreground">Your payment is held securely</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="h-8 w-8 rounded-full bg-secondary/10 flex items-center justify-center flex-shrink-0">
                  <Sparkles className="h-4 w-4 text-secondary" />
                </div>
                <div>
                  <p className="text-sm font-medium">AI Fraud Detection</p>
                  <p className="text-xs text-muted-foreground">Automated verification system</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="h-8 w-8 rounded-full bg-yellow-500/10 flex items-center justify-center flex-shrink-0">
                  <CheckCircle2 className="h-4 w-4 text-yellow-500" />
                </div>
                <div>
                  <p className="text-sm font-medium">Authenticity Guaranteed</p>
                  <p className="text-xs text-muted-foreground">30-day money-back guarantee</p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
