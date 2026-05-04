import { useState, useEffect } from "react";
import { Card } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { AlertCircle, CheckCircle2, Gavel, Trophy, Wallet, TrendingUp, Bell, X, Loader2 } from "lucide-react";
import { api } from "../services/api";
import { toast } from "sonner";

// Notification type configuration for icons and colors
const notificationConfig: Record<string, { icon: any; color: string; bgColor: string; label: string }> = {
  admin: { icon: Bell, color: "text-blue-500", bgColor: "bg-blue-500/10", label: "Admin" },
  auction_created: { icon: Gavel, color: "text-green-500", bgColor: "bg-green-500/10", label: "New Auction" },
  auction_ended: { icon: Trophy, color: "text-purple-500", bgColor: "bg-purple-500/10", label: "Auction Ended" },
  auction_won: { icon: Trophy, color: "text-yellow-500", bgColor: "bg-yellow-500/10", label: "You Won!" },
  bid_placed: { icon: CheckCircle2, color: "text-secondary", bgColor: "bg-secondary/10", label: "Bid Placed" },
  outbid: { icon: TrendingUp, color: "text-destructive", bgColor: "bg-destructive/10", label: "Outbid" },
  payment: { icon: Wallet, color: "text-purple-500", bgColor: "bg-purple-500/10", label: "Payment" },
  system: { icon: AlertCircle, color: "text-primary", bgColor: "bg-primary/10", label: "System" },
};

interface Notification {
  _id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
  auctionId?: {
    _id: string;
    title: string;
    images: string[];
    currentBid: number;
  };
  createdBy?: {
    name: string;
    role: string;
  };
  priority: string;
}

// Format relative time
const formatTimeAgo = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return "Just now";
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;
  return date.toLocaleDateString();
};

export function Notifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, unread: 0, urgent: 0 });
  const [activeTab, setActiveTab] = useState("all");

  // Fetch notifications
  useEffect(() => {
    fetchNotifications();
    fetchStats();
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await api.notifications.getAll();
      if (response.notifications) {
        setNotifications(response.notifications);
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
      toast.error("Failed to load notifications");
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await api.notifications.getStats();
      if (response) {
        setStats(response);
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      await api.notifications.markAsRead(id);
      // Update local state
      setNotifications(prev =>
        prev.map(n => (n._id === id ? { ...n, isRead: true } : n))
      );
      // Update stats
      setStats(prev => ({ ...prev, unread: Math.max(0, prev.unread - 1) }));
      toast.success("Marked as read");
    } catch (error) {
      console.error("Error marking as read:", error);
      toast.error("Failed to mark as read");
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await api.notifications.markAllAsRead();
      // Update local state
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      // Update stats
      setStats(prev => ({ ...prev, unread: 0 }));
      toast.success("All notifications marked as read");
    } catch (error) {
      console.error("Error marking all as read:", error);
      toast.error("Failed to mark all as read");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.notifications.delete(id);
      // Update local state
      setNotifications(prev => prev.filter(n => n._id !== id));
      // Update stats
      setStats(prev => ({
        ...prev,
        total: Math.max(0, prev.total - 1),
        unread: prev.unread - (notifications.find(n => n._id === id)?.isRead ? 0 : 1),
      }));
      toast.success("Notification deleted");
    } catch (error) {
      console.error("Error deleting notification:", error);
      toast.error("Failed to delete notification");
    }
  };

  const filteredNotifications = activeTab === "unread"
    ? notifications.filter(n => !n.isRead)
    : notifications;

  const unreadCount = notifications.filter(n => !n.isRead).length;

  // Get config for notification type
  const getNotificationConfig = (type: string) => {
    return notificationConfig[type] || notificationConfig.system;
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Notifications</h1>
          <p className="text-muted-foreground">Stay updated with your auction activity</p>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" size="sm" onClick={handleMarkAllAsRead}>
            Mark all as read
          </Button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-6 border-border/50 bg-card/50 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-lg bg-destructive/10 flex items-center justify-center">
              <Bell className="h-6 w-6 text-destructive" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.unread}</p>
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
              <p className="text-2xl font-bold">{stats.total}</p>
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
              <p className="text-2xl font-bold">{stats.urgent}</p>
              <p className="text-sm text-muted-foreground">Urgent</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Notifications List */}
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <Tabs defaultValue="all" className="w-full" onValueChange={setActiveTab}>
          <TabsList className="w-full justify-start border-b rounded-none h-auto p-0 bg-transparent">
            <TabsTrigger 
              value="all" 
              className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none"
            >
              All ({notifications.length})
            </TabsTrigger>
            <TabsTrigger 
              value="unread"
              className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none"
            >
              Unread ({unreadCount})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="p-6 space-y-3">
            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : filteredNotifications.length === 0 ? (
              <div className="text-center py-12">
                <Bell className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground">No notifications yet</p>
              </div>
            ) : (
              filteredNotifications.map((notification) => {
                const config = getNotificationConfig(notification.type);
                const Icon = config.icon;
                return (
                  <div
                    key={notification._id}
                    className={`flex gap-4 p-4 rounded-lg border transition-all ${
                      notification.isRead 
                        ? "border-border/50 hover:border-border" 
                        : "border-primary/30 bg-primary/5 hover:border-primary/50"
                    }`}
                  >
                    <div className={`h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0 ${config.bgColor}`}>
                      <Icon className={`h-5 w-5 ${config.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium">{notification.title}</h3>
                          <Badge variant="outline" className="text-xs">
                            {config.label}
                          </Badge>
                        </div>
                        {!notification.isRead && (
                          <Badge className="bg-primary/20 text-primary border-primary/30 text-xs">
                            New
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{notification.message}</p>
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-muted-foreground">
                          {formatTimeAgo(notification.createdAt)}
                        </p>
                        <div className="flex gap-2">
                          {!notification.isRead && (
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => handleMarkAsRead(notification._id)}
                            >
                              Mark as read
                            </Button>
                          )}
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8"
                            onClick={() => handleDelete(notification._id)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </TabsContent>

          <TabsContent value="unread" className="p-6 space-y-3">
            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : filteredNotifications.length === 0 ? (
              <div className="text-center py-12">
                <CheckCircle2 className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground">No unread notifications</p>
                <p className="text-sm text-muted-foreground/70 mt-1">
                  You&apos;re all caught up!
                </p>
              </div>
            ) : (
              filteredNotifications.map((notification) => {
                const config = getNotificationConfig(notification.type);
                const Icon = config.icon;
                return (
                  <div
                    key={notification._id}
                    className="flex gap-4 p-4 rounded-lg border border-primary/30 bg-primary/5 hover:border-primary/50 transition-all"
                  >
                    <div className={`h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0 ${config.bgColor}`}>
                      <Icon className={`h-5 w-5 ${config.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium">{notification.title}</h3>
                          <Badge variant="outline" className="text-xs">
                            {config.label}
                          </Badge>
                        </div>
                        <Badge className="bg-primary/20 text-primary border-primary/30 text-xs">
                          New
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{notification.message}</p>
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-muted-foreground">
                          {formatTimeAgo(notification.createdAt)}
                        </p>
                        <div className="flex gap-2">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => handleMarkAsRead(notification._id)}
                          >
                            Mark as read
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8"
                            onClick={() => handleDelete(notification._id)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
}
