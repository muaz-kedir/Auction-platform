import { Card } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { AlertCircle, CheckCircle2, Gavel, Trophy, Wallet, TrendingUp, Bell, X } from "lucide-react";

const notifications = {
  all: [
    {
      id: 1,
      type: "warning",
      icon: AlertCircle,
      color: "text-yellow-500",
      title: "Auction ending soon",
      message: "Your bid on Luxury Swiss Watch is ending in 2 hours. Consider increasing your bid!",
      time: "10 minutes ago",
      read: false,
    },
    {
      id: 2,
      type: "success",
      icon: CheckCircle2,
      color: "text-secondary",
      title: "Bid placed successfully",
      message: "Your bid of $5,200 on Luxury Swiss Watch has been placed successfully.",
      time: "30 minutes ago",
      read: false,
    },
    {
      id: 3,
      type: "error",
      icon: TrendingUp,
      color: "text-destructive",
      title: "You've been outbid",
      message: "Someone outbid you on Diamond Ring 2.5ct. Current bid: $8,900",
      time: "1 hour ago",
      read: false,
    },
    {
      id: 4,
      type: "info",
      icon: Trophy,
      color: "text-primary",
      title: "You won an auction!",
      message: "Congratulations! You won Abstract Art Painting for $2,800. Please complete payment.",
      time: "3 hours ago",
      read: true,
    },
    {
      id: 5,
      type: "info",
      icon: Wallet,
      color: "text-purple-500",
      title: "Funds added successfully",
      message: "$1,000 has been added to your wallet via Credit Card.",
      time: "5 hours ago",
      read: true,
    },
    {
      id: 6,
      type: "info",
      icon: Gavel,
      color: "text-blue-500",
      title: "New auction matching your interests",
      message: "A new Vintage Rolex Submariner auction has just started!",
      time: "1 day ago",
      read: true,
    },
  ],
};

export function Notifications() {
  const unreadCount = notifications.all.filter(n => !n.read).length;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Notifications</h1>
          <p className="text-muted-foreground">Stay updated with your auction activity</p>
        </div>
        <Button variant="outline" size="sm">
          Mark all as read
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-6 border-border/50 bg-card/50 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-lg bg-destructive/10 flex items-center justify-center">
              <Bell className="h-6 w-6 text-destructive" />
            </div>
            <div>
              <p className="text-2xl font-bold">{unreadCount}</p>
              <p className="text-sm text-muted-foreground">Unread</p>
            </div>
          </div>
        </Card>
        <Card className="p-6 border-border/50 bg-card/50 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
              <CheckCircle2 className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{notifications.all.length}</p>
              <p className="text-sm text-muted-foreground">Total</p>
            </div>
          </div>
        </Card>
        <Card className="p-6 border-border/50 bg-card/50 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-lg bg-secondary/10 flex items-center justify-center">
              <TrendingUp className="h-6 w-6 text-secondary" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {notifications.all.filter(n => n.type === "warning" || n.type === "error").length}
              </p>
              <p className="text-sm text-muted-foreground">Urgent</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Notifications List */}
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="w-full justify-start border-b rounded-none h-auto p-0 bg-transparent">
            <TabsTrigger 
              value="all" 
              className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none"
            >
              All ({notifications.all.length})
            </TabsTrigger>
            <TabsTrigger 
              value="unread"
              className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none"
            >
              Unread ({unreadCount})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="p-6 space-y-3">
            {notifications.all.map((notification) => (
              <div
                key={notification.id}
                className={`flex gap-4 p-4 rounded-lg border transition-all cursor-pointer ${
                  notification.read 
                    ? "border-border/50 hover:border-border" 
                    : "border-primary/30 bg-primary/5 hover:border-primary/50"
                }`}
              >
                <div className={`h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                  notification.type === "warning" ? "bg-yellow-500/10" :
                  notification.type === "success" ? "bg-secondary/10" :
                  notification.type === "error" ? "bg-destructive/10" :
                  "bg-primary/10"
                }`}>
                  <notification.icon className={`h-5 w-5 ${notification.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h3 className="font-medium">{notification.title}</h3>
                    {!notification.read && (
                      <Badge className="bg-primary/20 text-primary border-primary/30 text-xs">
                        New
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">{notification.message}</p>
                  <p className="text-xs text-muted-foreground">{notification.time}</p>
                </div>
                <Button variant="ghost" size="icon" className="flex-shrink-0">
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </TabsContent>

          <TabsContent value="unread" className="p-6 space-y-3">
            {notifications.all.filter(n => !n.read).map((notification) => (
              <div
                key={notification.id}
                className="flex gap-4 p-4 rounded-lg border border-primary/30 bg-primary/5 hover:border-primary/50 transition-all cursor-pointer"
              >
                <div className={`h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                  notification.type === "warning" ? "bg-yellow-500/10" :
                  notification.type === "success" ? "bg-secondary/10" :
                  notification.type === "error" ? "bg-destructive/10" :
                  "bg-primary/10"
                }`}>
                  <notification.icon className={`h-5 w-5 ${notification.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h3 className="font-medium">{notification.title}</h3>
                    <Badge className="bg-primary/20 text-primary border-primary/30 text-xs">
                      New
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">{notification.message}</p>
                  <p className="text-xs text-muted-foreground">{notification.time}</p>
                </div>
                <Button variant="ghost" size="icon" className="flex-shrink-0">
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
}
