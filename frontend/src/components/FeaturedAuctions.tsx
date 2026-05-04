import { useState, useEffect } from "react";
import { AuctionCard } from "./auction/AuctionCard";
import { Loader2 } from "lucide-react";
import { api } from "../services/api";
import { getImageUrl } from "../utils/imageUtils";

interface Auction {
  _id: string;
  title: string;
  images: string[];
  currentBid: number;
  endTime: string;
  status: string;
  approvalStatus: string;
}

export function FeaturedAuctions() {
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAuctions();
  }, []);

  const fetchAuctions = async () => {
    try {
      setLoading(true);
      // Add cache-busting parameter to get fresh data
      const response = await api.auctions.getAll({ _t: Date.now() });
      setAuctions(response.slice(0, 6)); // Show first 6 active auctions
    } catch (error) {
      console.error("Failed to fetch auctions:", error);
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

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (auctions.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No active auctions at the moment</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {auctions.map((auction) => (
          <AuctionCard
            key={auction._id}
            id={auction._id}
            title={auction.title}
            image={getImageUrl(auction.images[0])}
            currentBid={auction.currentBid}
            timeLeft={calculateTimeLeft(auction.endTime)}
            bids={0}
            category={auction.status}
            isLive={auction.status === "ACTIVE"}
          />
        ))}
      </div>
    </div>
  );
}
