import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { AuctionCard } from "../components/auction/AuctionCard";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Slider } from "../components/ui/slider";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { Card } from "../components/ui/card";
import { Skeleton } from "../components/ui/skeleton";
import { api } from "../services/api";
import { toast } from "sonner";
import { getImageUrl } from "../utils/imageUtils";

interface Auction {
  _id: string;
  title: string;
  description: string;
  images: string[];
  currentBid: number;
  startingBid: number;
  endTime: string;
  status: string;
  approvalStatus: string;
  seller: {
    _id: string;
    name: string;
    email: string;
  };
  category?: {
    _id: string;
    name: string;
  };
  createdAt: string;
}

interface Category {
  _id: string;
  name: string;
}

export function AuctionListing() {
  const navigate = useNavigate();
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [priceRange, setPriceRange] = useState([0, 50000]);
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState("ending-soon");

  useEffect(() => {
    fetchAuctions();
    fetchCategories();
  }, []);

  const fetchAuctions = async () => {
    try {
      setLoading(true);
      // Backend only returns ACTIVE auctions for public requests
      const data = await api.auctions.getAll();
      setAuctions(data);
    } catch (error: any) {
      console.error("Failed to fetch auctions:", error);
      toast.error("Failed to load auctions");
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const data = await api.categories.getAll();
      setCategories(data);
    } catch (error: any) {
      console.error("Failed to fetch categories:", error);
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


  const filteredAuctions = auctions.filter((auction) => {
    const matchesCategory = selectedCategory === "All" || auction.category?.name === selectedCategory;
    const matchesPrice = auction.currentBid >= priceRange[0] && auction.currentBid <= priceRange[1];
    const matchesSearch = auction.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesPrice && matchesSearch;
  });

  // Sort auctions
  const sortedAuctions = [...filteredAuctions].sort((a, b) => {
    switch (sortBy) {
      case "ending-soon":
        return new Date(a.endTime).getTime() - new Date(b.endTime).getTime();
      case "newly-listed":
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      case "price-low":
        return a.currentBid - b.currentBid;
      case "price-high":
        return b.currentBid - a.currentBid;
      default:
        return 0;
    }
  });

  const allCategories = ["All", ...categories.map(cat => cat.name)];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">Browse Auctions</h1>
        <p className="text-muted-foreground">Discover amazing items up for auction</p>
      </div>

      {/* Search and Filter Bar */}
      <Card className="p-4 border-border/50 bg-card/50 backdrop-blur-sm">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search auctions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Category Filter */}
          <div className="flex gap-2 overflow-x-auto pb-2 lg:pb-0">
            {allCategories.map((category) => (
              <Badge
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                className={`cursor-pointer whitespace-nowrap ${
                  selectedCategory === category 
                    ? "bg-primary text-primary-foreground" 
                    : "hover:bg-muted"
                }`}
                onClick={() => setSelectedCategory(category)}
              >
                {category}
              </Badge>
            ))}
          </div>

          {/* Sort */}
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-full lg:w-[180px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ending-soon">Ending Soon</SelectItem>
              <SelectItem value="newly-listed">Newly Listed</SelectItem>
              <SelectItem value="price-low">Price: Low to High</SelectItem>
              <SelectItem value="price-high">Price: High to Low</SelectItem>
            </SelectContent>
          </Select>

          {/* Filter Toggle */}
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => setShowFilters(!showFilters)}
          >
            <SlidersHorizontal className="h-4 w-4" />
            Filters
          </Button>
        </div>

        {/* Advanced Filters */}
        {showFilters && (
          <div className="mt-6 pt-6 border-t border-border/50 space-y-6">
            <div>
              <div className="flex items-center justify-between mb-4">
                <label className="text-sm font-medium">Price Range</label>
                <span className="text-sm text-muted-foreground">
                  ${priceRange[0].toLocaleString()} - ${priceRange[1].toLocaleString()}
                </span>
              </div>
              <Slider
                value={priceRange}
                onValueChange={setPriceRange}
                max={50000}
                step={100}
                className="mb-2"
              />
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={() => {
                  setSelectedCategory("All");
                  setPriceRange([0, 50000]);
                  setSearchQuery("");
                }}
              >
                <X className="h-4 w-4" />
                Clear Filters
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Results Count */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Showing {sortedAuctions.length} {sortedAuctions.length === 1 ? "auction" : "auctions"}
        </p>
        <Badge variant="outline" className="gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-secondary opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-secondary"></span>
          </span>
          {auctions.length} Live Auctions
        </Badge>
      </div>

      {/* Auction Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <Skeleton className="aspect-[4/3] w-full" />
              <div className="p-4 space-y-3">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-8 w-full" />
              </div>
            </Card>
          ))}
        </div>
      ) : sortedAuctions.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedAuctions.map((auction) => (
            <AuctionCard 
              key={auction._id} 
              id={auction._id}
              title={auction.title}
              image={getImageUrl(auction.images[0])}
              currentBid={auction.currentBid}
              timeLeft={calculateTimeLeft(auction.endTime)}
              category={auction.category?.name || "Uncategorized"}
              isLive={auction.status === "ACTIVE"}
            />
          ))}
        </div>
      ) : (
        <Card className="p-12 text-center border-dashed">
          <div className="max-w-md mx-auto">
            <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No auctions found</h3>
            <p className="text-muted-foreground mb-6">
              Try adjusting your filters or search query to find what you're looking for.
            </p>
            <Button
              variant="outline"
              onClick={() => {
                setSelectedCategory("All");
                setPriceRange([0, 50000]);
                setSearchQuery("");
              }}
            >
              Clear All Filters
            </Button>
          </div>
        </Card>
      )}

      {/* Load More */}
      {sortedAuctions.length > 0 && sortedAuctions.length >= 9 && (
        <div className="flex justify-center pt-6">
          <Button variant="outline" size="lg" onClick={fetchAuctions}>
            Load More Auctions
          </Button>
        </div>
      )}
    </div>
  );
}
