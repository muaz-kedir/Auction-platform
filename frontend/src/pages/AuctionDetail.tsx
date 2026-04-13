import { useState } from "react";
import { useParams, Link } from "react-router";
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
  Clock,
  Users,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  Gavel
} from "lucide-react";
import { motion } from "motion/react";
import { toast } from "sonner@2.0.3";

const bidHistory = [
  { id: 1, bidder: "User #8234", amount: 5420, time: "2 minutes ago", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=1" },
  { id: 2, bidder: "User #7192", amount: 5200, time: "15 minutes ago", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=2" },
  { id: 3, bidder: "User #6543", amount: 5100, time: "1 hour ago", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=3" },
  { id: 4, bidder: "User #5421", amount: 4950, time: "2 hours ago", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=4" },
  { id: 5, bidder: "User #4832", amount: 4800, time: "3 hours ago", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=5" },
];

const similarAuctions = [
  {
    id: "2",
    title: "Latest Smartphone Pro Max 512GB",
    image: "https://images.unsplash.com/photo-1717996563514-e3519f9ef9f7?w=400&h=300&fit=crop",
    currentBid: 899,
    timeLeft: "5h 12m",
    bids: 28,
    category: "Electronics",
  },
  {
    id: "3",
    title: "Vintage Film Camera Collection",
    image: "https://images.unsplash.com/photo-1678958169679-42e6ca5785e3?w=400&h=300&fit=crop",
    currentBid: 1250,
    timeLeft: "1d 8h",
    bids: 15,
    category: "Collectibles",
  },
  {
    id: "8",
    title: "Vintage Rolex Submariner 1960s",
    image: "https://images.unsplash.com/photo-1605101232508-283d0cd4909e?w=400&h=300&fit=crop",
    currentBid: 12500,
    timeLeft: "2d 3h",
    bids: 89,
    category: "Watches",
    isLive: true,
  },
];

const images = [
  "https://images.unsplash.com/photo-1605101232508-283d0cd4909e?w=800&h=600&fit=crop",
  "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&h=600&fit=crop",
  "https://images.unsplash.com/photo-1611690302822-84e81c88e0e4?w=800&h=600&fit=crop",
];

export function AuctionDetail() {
  const { id } = useParams();
  const [selectedImage, setSelectedImage] = useState(0);
  const [bidAmount, setBidAmount] = useState("");
  const [isFavorite, setIsFavorite] = useState(false);

  const endTime = new Date(Date.now() + 2 * 60 * 60 * 1000 + 34 * 60 * 1000);
  const minBid = 5450;

  const handlePlaceBid = () => {
    const amount = parseFloat(bidAmount);
    if (!amount || amount < minBid) {
      toast.error("Bid amount must be at least $" + minBid.toLocaleString());
      return;
    }
    toast.success("Bid placed successfully!", {
      description: `Your bid of $${amount.toLocaleString()} has been placed.`,
    });
    setBidAmount("");
  };

  return (
    <div className="space-y-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link to="/dashboard/auctions" className="hover:text-primary transition-colors">
          Auctions
        </Link>
        <span>/</span>
        <span className="text-foreground">Luxury Swiss Automatic Watch</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Images */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="overflow-hidden border-border/50 bg-card/50 backdrop-blur-sm">
            <div className="relative aspect-[4/3] bg-muted">
              <img
                src={images[selectedImage]}
                alt="Product"
                className="w-full h-full object-cover"
              />
              <div className="absolute top-4 left-4 flex gap-2">
                <Badge className="bg-destructive/90 backdrop-blur-sm border-0 animate-pulse">
                  <span className="relative flex h-2 w-2 mr-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                  </span>
                  LIVE
                </Badge>
                <Badge className="bg-primary/90 backdrop-blur-sm border-0">
                  <Sparkles className="h-3 w-3 mr-1" />
                  AI Verified
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
                  onClick={() => toast.success("Link copied to clipboard!")}
                >
                  <Share2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
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
          </Card>

          {/* Tabs - Description, Shipping, etc. */}
          <Card className="p-6 border-border/50 bg-card/50 backdrop-blur-sm">
            <Tabs defaultValue="description">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="description">Description</TabsTrigger>
                <TabsTrigger value="shipping">Shipping</TabsTrigger>
                <TabsTrigger value="history">Bid History</TabsTrigger>
              </TabsList>
              <TabsContent value="description" className="space-y-4 pt-4">
                <div>
                  <h3 className="font-semibold mb-2">About This Item</h3>
                  <p className="text-muted-foreground">
                    This exquisite Swiss automatic watch represents the pinnacle of horological craftsmanship. 
                    Features a 42mm stainless steel case, sapphire crystal, and a precision automatic movement 
                    with 48-hour power reserve. Water resistant to 100 meters.
                  </p>
                </div>
                <Separator />
                <div>
                  <h3 className="font-semibold mb-2">Specifications</h3>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex justify-between">
                      <span>Brand:</span>
                      <span className="text-foreground">Swiss Luxury</span>
                    </li>
                    <li className="flex justify-between">
                      <span>Model:</span>
                      <span className="text-foreground">Automatic Pro</span>
                    </li>
                    <li className="flex justify-between">
                      <span>Case Size:</span>
                      <span className="text-foreground">42mm</span>
                    </li>
                    <li className="flex justify-between">
                      <span>Movement:</span>
                      <span className="text-foreground">Automatic</span>
                    </li>
                    <li className="flex justify-between">
                      <span>Water Resistance:</span>
                      <span className="text-foreground">100m</span>
                    </li>
                    <li className="flex justify-between">
                      <span>Condition:</span>
                      <span className="text-foreground">Excellent</span>
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
                      Insured delivery via FedEx with tracking. Ships within 2 business days after payment.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50">
                  <Shield className="h-5 w-5 text-secondary flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-medium mb-1">Buyer Protection</h4>
                    <p className="text-sm text-muted-foreground">
                      Full escrow protection. Payment released only after you confirm receipt and authenticity.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50">
                  <MapPin className="h-5 w-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-medium mb-1">Shipping From</h4>
                    <p className="text-sm text-muted-foreground">
                      Los Angeles, California, USA
                    </p>
                  </div>
                </div>
              </TabsContent>
              <TabsContent value="history" className="pt-4">
                <div className="space-y-2">
                  {bidHistory.map((bid, index) => (
                    <div
                      key={bid.id}
                      className={`flex items-center justify-between p-3 rounded-lg ${
                        index === 0 ? "bg-primary/10 border border-primary/20" : "bg-muted/30"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                          <AvatarImage src={bid.avatar} />
                          <AvatarFallback>U</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{bid.bidder}</p>
                          <p className="text-xs text-muted-foreground">{bid.time}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-primary">${bid.amount.toLocaleString()}</p>
                        {index === 0 && (
                          <Badge variant="outline" className="text-xs">
                            Current Bid
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
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
                <h1 className="text-2xl font-bold mb-2">Luxury Swiss Automatic Watch</h1>
                <Badge variant="secondary">Watches</Badge>
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
                  <span className="text-3xl font-bold text-primary">$5,420</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <Users className="h-3.5 w-3.5" />
                    42 bids
                  </span>
                  <span className="text-secondary flex items-center gap-1">
                    <TrendingUp className="h-3.5 w-3.5" />
                    +12% increase
                  </span>
                </div>
              </div>

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
                    placeholder={`$${minBid.toLocaleString()}`}
                    value={bidAmount}
                    onChange={(e) => setBidAmount(e.target.value)}
                    className="flex-1"
                  />
                  <Button onClick={handlePlaceBid} className="gap-2">
                    <Gavel className="h-4 w-4" />
                    Place Bid
                  </Button>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1" onClick={() => setBidAmount(String(minBid))}>
                    ${minBid.toLocaleString()}
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1" onClick={() => setBidAmount(String(minBid + 100))}>
                    ${(minBid + 100).toLocaleString()}
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1" onClick={() => setBidAmount(String(minBid + 250))}>
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
            </div>
          </Card>

          {/* Seller Info */}
          <Card className="p-6 border-border/50 bg-card/50 backdrop-blur-sm">
            <h3 className="font-semibold mb-4">Seller Information</h3>
            <div className="flex items-start gap-3 mb-4">
              <Avatar className="h-12 w-12">
                <AvatarImage src="https://api.dicebear.com/7.x/avataaars/svg?seed=seller" />
                <AvatarFallback>JD</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-medium">Premium Watches Inc.</p>
                  <Badge variant="outline" className="text-xs bg-secondary/10 text-secondary border-secondary/20">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Verified
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">Member since 2020</p>
              </div>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Rating:</span>
                <span className="font-medium">4.9/5 ⭐</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Items Sold:</span>
                <span className="font-medium">234</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Response Time:</span>
                <span className="font-medium">&lt; 2 hours</span>
              </div>
            </div>
            <Button variant="outline" className="w-full mt-4">
              View Profile
            </Button>
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

      {/* Similar Auctions */}
      <div>
        <h2 className="text-2xl font-bold mb-6">Similar Auctions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {similarAuctions.map((auction) => (
            <AuctionCard key={auction.id} {...auction} />
          ))}
        </div>
      </div>
    </div>
  );
}
