import { useEffect, useRef, useState } from "react";
import { Application } from "@splinetool/runtime";
import { Trophy } from "lucide-react";

interface SplineTrophyProps {
  className?: string;
  onLoad?: () => void;
}

export function SplineTrophy({ className = "", onLoad }: SplineTrophyProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const splineAppRef = useRef<Application | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    if (!canvasRef.current) return;

    setIsLoading(true);
    setHasError(false);

    // Initialize Spline application
    const splineApp = new Application(canvasRef.current);

    // Load the Spline scene
    splineApp.load("https://prod.spline.design/6Wt1T7I9q1gJ8q2W/scene.splinecode")
      .then(() => {
        console.log("Spline trophy loaded successfully");
        setIsLoading(false);
        onLoad?.();
      })
      .catch((error) => {
        console.error("Spline trophy failed to load:", error);
        setIsLoading(false);
        setHasError(true);
      });

    splineAppRef.current = splineApp;

    return () => {
      // Cleanup Spline application
      if (splineAppRef.current) {
        splineAppRef.current.dispose();
      }
    };
  }, [onLoad]);

  return (
    <div className={`relative ${className}`}>
      <canvas
        ref={canvasRef}
        className="w-full h-full"
        style={{ width: "100%", height: "100%" }}
      />
      {/* Loading indicator */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-yellow-200 to-orange-200 rounded-lg">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-yellow-400 border-t-transparent"></div>
        </div>
      )}
      {/* Error fallback */}
      {hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-yellow-100 to-orange-100 rounded-lg">
          <div className="text-center">
            <Trophy className="h-16 w-16 text-yellow-500 mx-auto mb-2" />
            <p className="text-sm text-gray-600">3D Trophy Loading</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default SplineTrophy;
