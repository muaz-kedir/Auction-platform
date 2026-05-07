import { Trophy, Sparkles } from "lucide-react";
import { SplineTrophy } from "./SplineTrophy";

interface CelebrationTrophyProps {
  className?: string;
  onLoad?: () => void;
}

export function CelebrationTrophy({ className = "", onLoad }: CelebrationTrophyProps) {
  return (
    <div className={`relative ${className}`}>
      {/* Try to load Spline 3D trophy */}
      <SplineTrophy className="w-full h-full" onLoad={onLoad} />
      
      {/* Fallback animated trophy */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="relative">
          <Trophy className="h-24 w-24 text-yellow-100 drop-shadow-2xl animate-bounce" />
          <div className="absolute -top-2 -right-2">
            <Sparkles className="h-8 w-8 text-white animate-pulse" />
          </div>
          {/* Glow effect */}
          <div className="absolute inset-0 -m-4 rounded-full bg-gradient-to-r from-yellow-400 to-orange-400 opacity-30 blur-xl animate-pulse" />
        </div>
      </div>
    </div>
  );
}

export default CelebrationTrophy;
