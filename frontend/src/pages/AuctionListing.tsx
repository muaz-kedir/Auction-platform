import { useState } from "react";
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

const auctions = [
  {
    id: "1",
    title: "Luxury Swiss Automatic Watch - Limited Edition",
    image: "https://images.unsplash.com/photo-1605101232508-283d0cd4909e?w=400&h=300&fit=crop",
    currentBid: 5420,
    timeLeft: "2h 34m",
    bids: 42,
    category: "Watches",
    isLive: true,
  },
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
    id: "4",
    title: "Luxury Sports Car 2023 Model",
    image: "https://images.unsplash.com/photo-1694380975491-6cca2b30e26c?w=400&h=300&fit=crop",
    currentBid: 45000,
    timeLeft: "3d 5h",
    bids: 67,
    category: "Vehicles",
    isLive: true,
  },
  {
    id: "5",
    title: "Contemporary Abstract Art Painting",
    image: "https://images.unsplash.com/photo-1667980898743-fcfe470b7d2a?w=400&h=300&fit=crop",
    currentBid: 2800,
    timeLeft: "12h 45m",
    bids: 23,
    category: "Art",
  },
  {
    id: "6",
    title: "Diamond Engagement Ring 2.5ct",
    image: "https://images.unsplash.com/photo-1774504347388-3d01f7cac097?w=400&h=300&fit=crop",
    currentBid: 8900,
    timeLeft: "6h 20m",
    bids: 34,
    category: "Jewelry",
  },
  {
    id: "7",
    title: "Professional DSLR Camera with Lens Kit",
    image: "https://images.unsplash.com/photo-1678958169679-42e6ca5785e3?w=400&h=300&fit=crop",
    currentBid: 1850,
    timeLeft: "8h 15m",
    bids: 19,
    category: "Electronics",
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
  {
    id: "9",
    title: "Gaming Laptop RTX 4090 32GB RAM",
    image: "https://images.unsplash.com/photo-1717996563514-e3519f9ef9f7?w=400&h=300&fit=crop",
    currentBid: 2199,
    timeLeft: "15h 30m",
    bids: 45,
    category: "Electronics",
  },
];

const categories = ["All", "Electronics", "Watches", "Art", "Vehicles", "Jewelry", "Collectibles"];

export function AuctionListing() {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [priceRange, setPriceRange] = useState([0, 50000]);
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);

  const filteredAuctions = auctions.filter((auction) => {
    const matchesCategory = selectedCategory === "All" || auction.category === selectedCategory;
    const matchesPrice = auction.currentBid >= priceRange[0] && auction.currentBid <= priceRange[1];
    const matchesSearch = auction.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesPrice && matchesSearch;
  });

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
            {categories.map((category) => (
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
          <Select defaultValue="ending-soon">
            <SelectTrigger className="w-full lg:w-[180px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ending-soon">Ending Soon</SelectItem>
              <SelectItem value="newly-listed">Newly Listed</SelectItem>
              <SelectItem value="price-low">Price: Low to High</SelectItem>
              <SelectItem value="price-high">Price: High to Low</SelectItem>
              <SelectItem value="most-bids">Most Bids</SelectItem>
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
          Showing {filteredAuctions.length} {filteredAuctions.length === 1 ? "auction" : "auctions"}
        </p>
        <Badge variant="outline" className="gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-secondary opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-secondary"></span>
          </span>
          {auctions.filter(a => a.isLive).length} Live Auctions
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
      ) : filteredAuctions.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAuctions.map((auction) => (
            <AuctionCard key={auction.id} {...auction} />
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
      {filteredAuctions.length > 0 && (
        <div className="flex justify-center pt-6">
          <Button variant="outline" size="lg">
            Load More Auctions
          </Button>
        </div>
      )}
    </div>
  );
}
