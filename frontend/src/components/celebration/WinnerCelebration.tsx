import { useEffect, useState } from "react";
import { X, Trophy, Sparkles, PartyPopper } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CelebrationTrophy } from "./CelebrationTrophy";

interface WinnerCelebrationProps {
  isOpen: boolean;
  onClose: () => void;
  winnerName: string;
  auctionTitle: string;
  winningBid: number;
  isCurrentUser: boolean;
}

export function WinnerCelebration({
  isOpen,
  onClose,
  winnerName,
  auctionTitle,
  winningBid,
  isCurrentUser,
}: WinnerCelebrationProps) {
  const [showOnce, setShowOnce] = useState(true);

  // Check if celebration should show (once per winner)
  const shouldShowCelebration = () => {
    if (!isCurrentUser || !isOpen) return false;
    
    const storageKey = `celebration_${auctionTitle}_${winnerName}`;
    const hasSeen = localStorage.getItem(storageKey);
    
    if (hasSeen && showOnce) {
      return false;
    }
    
    if (showOnce) {
      localStorage.setItem(storageKey, "true");
    }
    
    return true;
  };

  if (!isOpen || !isCurrentUser || !shouldShowCelebration()) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleIn {
          from { 
            transform: scale(0) rotate(180deg);
            opacity: 0;
          }
          to { 
            transform: scale(1) rotate(0deg);
            opacity: 1;
          }
        }
        @keyframes bounceIn {
          0% { 
            transform: scale(0) rotate(-360deg);
            opacity: 0;
          }
          50% { 
            transform: scale(1.3) rotate(0deg);
            opacity: 1;
          }
          100% { 
            transform: scale(1) rotate(0deg);
            opacity: 1;
          }
        }
        @keyframes slideUp {
          from { 
            transform: translateY(30px);
            opacity: 0;
          }
          to { 
            transform: translateY(0);
            opacity: 1;
          }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        @keyframes sparkle {
          0% { 
            transform: scale(0) rotate(0deg);
            opacity: 0;
          }
          50% { 
            transform: scale(1) rotate(180deg);
            opacity: 1;
          }
          100% { 
            transform: scale(0) rotate(360deg);
            opacity: 0;
          }
        }
        @keyframes confetti {
          0% { 
            transform: translateY(0) translateX(0) rotate(0deg);
            opacity: 1;
          }
          100% { 
            transform: translateY(-300px) translateX(100px) rotate(720deg);
            opacity: 0;
          }
        }
        .animate-fade-in {
          animation: fadeIn 0.8s ease-out;
        }
        .animate-scale-in {
          animation: scaleIn 1.2s cubic-bezier(0.68, -0.55, 0.265, 1.55) 0.2s both;
        }
        .animate-bounce-in {
          animation: bounceIn 1.5s cubic-bezier(0.68, -0.55, 0.265, 1.55) 0.6s both;
        }
        .animate-slide-up {
          animation: slideUp 1s cubic-bezier(0.19, 1, 0.22, 1) forwards;
        }
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
        .animate-sparkle {
          animation: sparkle 2s ease-in-out infinite;
        }
        .animate-confetti {
          animation: confetti 3s ease-out forwards;
        }
      `}</style>
      
      <div
        className="relative bg-gradient-to-br from-yellow-400 via-orange-400 to-pink-500 rounded-3xl p-8 max-w-md w-full shadow-2xl overflow-hidden animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Background sparkles */}
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute text-white/20 animate-sparkle"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 2}s`,
              }}
            >
              <Sparkles className="w-6 h-6" />
            </div>
          ))}
        </div>

        {/* Confetti particles */}
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(30)].map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 rounded-full animate-confetti"
              style={{
                backgroundColor: ["#FFD700", "#FFA500", "#FF6B6B", "#4ECDC4", "#45B7D1", "#FFC107"][Math.floor(Math.random() * 6)],
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${1 + Math.random() * 2}s`,
                animationDuration: `${2 + Math.random() * 2}s`,
              }}
            />
          ))}
        </div>

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors z-10"
        >
          <X className="h-6 w-6" />
        </button>

        {/* 3D Trophy Container */}
        <div className="flex justify-center mb-6 h-32 relative">
          <div className="relative z-10 animate-bounce-in">
            <CelebrationTrophy 
              className="w-32 h-32" 
              onLoad={() => console.log("Trophy loaded")}
            />
            <div className="absolute -top-2 -right-2">
              <PartyPopper className="h-8 w-8 text-white animate-pulse" />
            </div>
          </div>
        </div>

        {/* Title */}
        <h2
          className="text-4xl font-black text-center text-white mb-2 drop-shadow-lg animate-slide-up"
          style={{ animationDelay: '0.8s' }}
        >
          🎉 CONGRATULATIONS!
        </h2>

        {/* Message */}
        <p
          className="text-center text-white/90 text-lg mb-6 animate-slide-up"
          style={{ animationDelay: '1s' }}
        >
          You won this auction!
        </p>

        {/* Auction Details */}
        <div
          className="bg-white/20 backdrop-blur-md rounded-2xl p-6 mb-6 space-y-4 animate-slide-up"
          style={{ animationDelay: '1.2s' }}
        >
          <div className="space-y-2">
            <p className="text-white/80 text-sm">Auction</p>
            <p className="text-white font-bold text-lg line-clamp-2">
              {auctionTitle}
            </p>
          </div>
          
          <div className="h-px bg-white/30" />
          
          <div className="space-y-2">
            <p className="text-white/80 text-sm">Your Winning Bid</p>
            <p className="text-4xl font-black text-white drop-shadow-lg">
              ${winningBid.toLocaleString()}
            </p>
          </div>
        </div>

        {/* Action Button */}
        <Button
          onClick={onClose}
          className="w-full bg-white text-orange-600 hover:bg-white/90 font-bold py-6 text-lg shadow-lg animate-slide-up"
          style={{ animationDelay: '1.4s' }}
        >
          <Trophy className="h-5 w-5 mr-2" />
          View My Winnings
        </Button>
        
        <p className="text-center text-white/80 text-sm mt-4 animate-slide-up" style={{ animationDelay: '1.6s' }}>
          Please complete your payment within 24 hours
        </p>
      </div>
    </div>
  );
}

export default WinnerCelebration;
