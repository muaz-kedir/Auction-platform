import { motion, AnimatePresence } from "framer-motion";
import { Gavel, TrendingUp, Trophy, Wallet, Clock } from "lucide-react";
import { Card } from "../ui/card";

interface Activity {
  id: string;
  type: "bid" | "outbid" | "win" | "payment";
  message: string;
  amount: number;
  time: string;
  bidderName?: string;
  isOwn?: boolean;
  isNew?: boolean;
}

interface RecentActivityProps {
  activities: Activity[];
}

export function RecentActivity({ activities }: RecentActivityProps) {
  const getActivityIcon = (type: string) => {
    switch (type) {
      case "bid":
        return <Gavel className="h-4 w-4" />;
      case "outbid":
        return <TrendingUp className="h-4 w-4" />;
      case "win":
        return <Trophy className="h-4 w-4" />;
      case "payment":
        return <Wallet className="h-4 w-4" />;
      default:
        return <Gavel className="h-4 w-4" />;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case "bid":
        return "bg-primary/10 text-primary";
      case "outbid":
        return "bg-destructive/10 text-destructive";
      case "win":
        return "bg-secondary/10 text-secondary";
      case "payment":
        return "bg-muted text-foreground";
      default:
        return "bg-muted text-foreground";
    }
  };

  const formatTime = (timeString: string) => {
    const date = new Date(timeString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? "s" : ""} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
    return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
  };

  return (
    <Card className="p-6 border-border/50 bg-card/50 backdrop-blur-sm">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold">Recent Activity</h2>
          <p className="text-sm text-muted-foreground">Live bidding updates</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <div className="h-2 w-2 rounded-full bg-secondary animate-pulse" />
          <span>Live</span>
        </div>
      </div>

      <div className="space-y-3 max-h-[400px] overflow-y-auto">
        <AnimatePresence mode="popLayout">
          {activities.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-8 text-muted-foreground"
            >
              <Clock className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No activity yet</p>
            </motion.div>
          ) : (
            activities.map((activity, index) => (
              <motion.div
                key={activity.id}
                initial={{ opacity: 0, y: -20, scale: 0.95 }}
                animate={{ 
                  opacity: 1, 
                  y: 0, 
                  scale: 1,
                  transition: {
                    type: "spring",
                    stiffness: 500,
                    damping: 30,
                    mass: 1
                  }
                }}
                exit={{ 
                  opacity: 0, 
                  y: 20, 
                  scale: 0.95,
                  transition: { duration: 0.2 }
                }}
                layout
                className={`flex items-start gap-3 pb-3 border-b border-border/50 last:border-0 last:pb-0 rounded-lg transition-all ${
                  activity.isNew ? "bg-primary/5 p-3 -m-3 mb-0" : ""
                }`}
              >
                <motion.div
                  initial={activity.isNew ? { scale: 0 } : false}
                  animate={activity.isNew ? { 
                    scale: [0, 1.2, 1],
                    rotate: [0, 10, -10, 0]
                  } : {}}
                  transition={{ duration: 0.5 }}
                  className={`h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 ${getActivityColor(
                    activity.type
                  )}`}
                >
                  {getActivityIcon(activity.type)}
                </motion.div>
                <div className="flex-1 min-w-0">
                  {activity.isOwn ? (
                    <p className="text-sm font-medium text-primary truncate">
                      You placed a bid
                    </p>
                  ) : (
                    <p className="text-sm truncate">
                      <span className="font-medium">{activity.bidderName || 'Someone'}</span>
                      <span className="text-muted-foreground"> placed a bid</span>
                    </p>
                  )}
                  <div className="flex items-center justify-between mt-1">
                    <p className="text-xs text-muted-foreground">
                      {formatTime(activity.time)}
                    </p>
                    <motion.p
                      initial={activity.isNew ? { scale: 0 } : false}
                      animate={activity.isNew ? { scale: [0, 1.3, 1] } : {}}
                      transition={{ duration: 0.4, delay: 0.2 }}
                      className={`text-sm font-medium ${activity.isOwn ? 'text-primary' : ''}`}
                    >
                      ${activity.amount.toLocaleString()}
                    </motion.p>
                  </div>
                </div>
                {activity.isNew && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0 }}
                    className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-secondary"
                  />
                )}
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </Card>
  );
}
