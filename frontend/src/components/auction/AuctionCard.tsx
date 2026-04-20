import { Clock, TrendingUp, Users } from "lucide-react";
import { Card } from "../ui/card";
import { Badge } from "../ui/badge";
import { motion } from "motion/react";
import { useNavigate } from "react-router";
import { useAuth } from "../../contexts/AuthContext";
import { toast } from "sonner";

interface AuctionCardProps {
  id: string;
  title: string;
  image: string;
  currentBid: number;
  timeLeft: string;
  bids: number;
  category: string;
  isLive?: boolean;
}

export function AuctionCard({
  id,
  title,
  image,
  currentBid,
  timeLeft,
  bids,
  category,
  isLive = false,
}: AuctionCardProps) {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    
    // Check if user is authenticated
    if (!user) {
      // Save the auction URL for redirect after login
      toast.info("Please login or register to view and bid on auctions");
      navigate("/login", { 
        state: { from: { pathname: `/auction/${id}` } }
      });
    } else {
      // User is authenticated, navigate to auction
      navigate(`/auction/${id}`);
    }
  };

  return (
    <div onClick={handleClick} className="cursor-pointer">
      <motion.div
        whileHover={{ y: -4 }}
        transition={{ duration: 0.2 }}
        className="h-full"
      >
        <Card className="overflow-hidden border border-border/50 bg-card/50 backdrop-blur-sm hover:border-primary/50 transition-all duration-300 h-full">
          <div className="relative aspect-[4/3] overflow-hidden">
            <img
              src={image}
              alt={title}
              className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
            />
            {isLive && (
              <div className="absolute top-3 left-3">
                <Badge className="bg-destructive/90 backdrop-blur-sm border-0 animate-pulse">
                  <span className="relative flex h-2 w-2 mr-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                  </span>
                  LIVE
                </Badge>
              </div>
            )}
            <div className="absolute top-3 right-3">
              <Badge variant="secondary" className="backdrop-blur-sm bg-black/50 border-0">
                {category}
              </Badge>
            </div>
          </div>

          <div className="p-4 space-y-3">
            <h3 className="font-medium text-foreground line-clamp-2 min-h-[48px]">
              {title}
            </h3>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Current Bid</p>
                <p className="text-lg font-semibold text-primary">
                  ${currentBid.toLocaleString()}
                </p>
              </div>
              <div className="flex items-center gap-1 text-secondary">
                <TrendingUp className="h-4 w-4" />
                <span className="text-xs">+12%</span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-border/50">
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Clock className="h-3.5 w-3.5" />
                <span className="text-xs">{timeLeft}</span>
              </div>
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Users className="h-3.5 w-3.5" />
                <span className="text-xs">{bids} bids</span>
              </div>
            </div>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}
