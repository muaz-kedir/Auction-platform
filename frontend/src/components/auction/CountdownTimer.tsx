import { useEffect, useState } from "react";
import { Clock } from "lucide-react";

interface CountdownTimerProps {
  endTime: Date;
  className?: string;
}

export function CountdownTimer({ endTime, className = "" }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

  function calculateTimeLeft() {
    const difference = +new Date(endTime) - +new Date();
    
    if (difference > 0) {
      return {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60),
      };
    }
    
    return { days: 0, hours: 0, minutes: 0, seconds: 0 };
  }

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, [endTime]);

  const isExpired = timeLeft.days === 0 && timeLeft.hours === 0 && timeLeft.minutes === 0 && timeLeft.seconds === 0;

  return (
    <div className={`flex items-center gap-4 ${className}`}>
      {isExpired ? (
        <div className="text-destructive font-medium">Auction Ended</div>
      ) : (
        <>
          <Clock className="h-5 w-5 text-primary" />
          <div className="flex gap-2">
            {timeLeft.days > 0 && (
              <div className="flex flex-col items-center bg-muted px-3 py-2 rounded-lg min-w-[60px]">
                <span className="text-2xl font-bold text-foreground">{timeLeft.days}</span>
                <span className="text-xs text-muted-foreground">Days</span>
              </div>
            )}
            <div className="flex flex-col items-center bg-muted px-3 py-2 rounded-lg min-w-[60px]">
              <span className="text-2xl font-bold text-foreground">{String(timeLeft.hours).padStart(2, '0')}</span>
              <span className="text-xs text-muted-foreground">Hours</span>
            </div>
            <div className="flex flex-col items-center bg-muted px-3 py-2 rounded-lg min-w-[60px]">
              <span className="text-2xl font-bold text-foreground">{String(timeLeft.minutes).padStart(2, '0')}</span>
              <span className="text-xs text-muted-foreground">Mins</span>
            </div>
            <div className="flex flex-col items-center bg-muted px-3 py-2 rounded-lg min-w-[60px]">
              <span className="text-2xl font-bold text-foreground">{String(timeLeft.seconds).padStart(2, '0')}</span>
              <span className="text-xs text-muted-foreground">Secs</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
