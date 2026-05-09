import { useState, useEffect, useCallback } from "react";
import { Card } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { AlertCircle, CheckCircle2, Gavel, Trophy, Wallet, TrendingUp, Bell, X, Loader2 } from "lucide-react";
import { api } from "../services/api";
import { toast } from "sonner";
import { useSocket } from "../hooks/useSocket";
import { useTranslation } from "react-i18next";

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
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 86400)} hours ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;
  return date.toLocaleDateString();
};

export function Notifications() {
  const { t } = useTranslation();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, unread: 0, urgent: 0 });
  const [activeTab, setActiveTab] = useState("all");
  const socket = useSocket();

  const fetchNotifications = useCallback(async () => {
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
  }, []);

  const fetchStats = useCallback(async () => {
    try {
      const response = await api.notifications.getStats();
      if (response) {
        setStats(response);
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  }, []);

  // Fetch notifications
  useEffect(() => {
    fetchNotifications();
    fetchStats();
  }, []);

  // Listen for real-time notification updates
  useEffect(() => {
    if (!socket) return;

    console.log('🔔 Setting up notification socket listener');

    const handleNotificationUpdate = (data: any) => {
      console.log('📨 Real-time notification received:', data);

      // Refresh notifications to get the latest from backend
      fetchNotifications();
      fetchStats();

      // Show toast for new notification
      if (data.message) {
        toast.info(data.message, {
          duration: 5000,
        });
      }
    };

    socket.on("notificationUpdate", handleNotificationUpdate);

    return () => {
      socket.off("notificationUpdate", handleNotificationUpdate);
    };
  }, [socket, fetchNotifications, fetchStats]);

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
      setStats(prev => ({ ...prev, unread: 0 }));
      toast.success("All marked as read");
    } catch (error) {
      console.error("Error marking all as read:", error);
      toast.error("Failed to mark all as read");
    }
  };

  const filteredNotifications = notifications.filter(n => 
    activeTab === "all" ? true : 
    activeTab === "unread" ? !n.isRead : 
    activeTab === n.type ? n.type === activeTab : false
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          {t('notifications.title')}
        </h1>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card className="p-6 border-border/50 bg-card/50 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
              <Bell className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.total}</p>
              <p className="text-sm text-muted-foreground">{t('notifications.total')}</p>
            </div>
          </div>
        </Card>
        <Card className="p-6 border-border/50 bg-card/50 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-lg bg-green-500/10 flex items-center justify-center">
              <CheckCircle2 className="h-6 w-6 text-green-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.unread}</p>
              <p className="text-sm text-muted-foreground">{t('notifications.unread')}</p>
            </div>
          </div>
        </Card>
        <Card className="p-6 border-border/50 bg-card/50 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-lg bg-red-500/10 flex items-center justify-center">
              <AlertCircle className="h-6 w-6 text-red-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.urgent}</p>
              <p className="text-sm text-muted-foreground">{t('notifications.urgent')}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all">
            {t('notifications.all')}
            {notifications.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {notifications.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="unread">
            {t('notifications.unread')}
            {stats.unread > 0 && (
              <Badge variant="destructive" className="ml-2">
                {stats.unread}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="auction_created">
            {t('notifications.auction_created')}
          </TabsTrigger>
          <TabsTrigger value="auction_ended">
            {t('notifications.auction_ended')}
          </TabsTrigger>
          <TabsTrigger value="auction_won">
            {t('notifications.auction_won')}
          </TabsTrigger>
          <TabsTrigger value="bid_placed">
            {t('notifications.bid_placed')}
          </TabsTrigger>
          <TabsTrigger value="outbid">
            {t('notifications.outbid')}
          </TabsTrigger>
          <TabsTrigger value="payment">
            {t('notifications.payment')}
          </TabsTrigger>
          <TabsTrigger value="system">
            {t('notifications.system')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-6">
          <div className="space-y-4">
            {filteredNotifications.map((notification) => (
              <div
                key={notification._id}
                className={`p-4 border rounded-lg ${
                  notification.isRead
                    ? "bg-white dark:bg-gray-800"
                    : "bg-blue-50 dark:bg-blue-900/20"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center ${notificationConfig[notification.type]?.bgColor}`}
                    >
                      {notificationConfig[notification.type]?.icon}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {notification.title}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                        {notification.message}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-gray-500">
                      {formatTimeAgo(notification.createdAt)}
                    </span>
                  </div>
                </div>
                {!notification.isRead && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleMarkAsRead(notification._id)}
                  >
                    Mark as read
                  </Button>
                )}
              </div>
            ))}
          </div>
          {filteredNotifications.length === 0 && (
            <div className="text-center py-12">
              <div className="text-gray-500 mb-4">
                <Bell className="h-12 w-12 mx-auto" />
              </div>
              <p className="text-lg font-medium text-gray-600 dark:text-gray-300">
                {t('notifications.no_notifications')}
              </p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="unread" className="mt-6">
          <div className="space-y-4">
            {filteredNotifications.map((notification) => (
              <div
                key={notification._id}
                className="p-4 border rounded-lg bg-blue-50 dark:bg-blue-900/20"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center ${notificationConfig[notification.type]?.bgColor}`}
                    >
                      {notificationConfig[notification.type]?.icon}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {notification.title}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                        {notification.message}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-gray-500">
                      {formatTimeAgo(notification.createdAt)}
                    </span>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleMarkAsRead(notification._id)}
                >
                  Mark as read
                </Button>
              </div>
            ))}
          </div>
          {filteredNotifications.length === 0 && (
            <div className="text-center py-12">
              <div className="text-gray-500 mb-4">
                <Bell className="h-12 w-12 mx-auto" />
              </div>
              <p className="text-lg font-medium text-gray-600 dark:text-gray-300">
                {t('notifications.no_notifications')}
              </p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="auction_created" className="mt-6">
          <div className="space-y-4">
            {filteredNotifications.map((notification) => (
              <div
                key={notification._id}
                className="p-4 border rounded-lg bg-green-50 dark:bg-green-900/20"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center ${notificationConfig[notification.type]?.bgColor}`}
                    >
                      {notificationConfig[notification.type]?.icon}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {notification.title}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                        {notification.message}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-gray-500">
                      {formatTimeAgo(notification.createdAt)}
                    </span>
                  </div>
                </div>
                {!notification.isRead && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleMarkAsRead(notification._id)}
                  >
                    Mark as read
                  </Button>
                )}
              </div>
            ))}
          </div>
          {filteredNotifications.length === 0 && (
            <div className="text-center py-12">
              <div className="text-gray-500 mb-4">
                <Bell className="h-12 w-12 mx-auto" />
              </div>
              <p className="text-lg font-medium text-gray-600 dark:text-gray-300">
                {t('notifications.no_notifications')}
              </p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="auction_ended" className="mt-6">
          <div className="space-y-4">
            {filteredNotifications.map((notification) => (
              <div
                key={notification._id}
                className="p-4 border rounded-lg bg-purple-50 dark:bg-purple-900/20"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center ${notificationConfig[notification.type]?.bgColor}`}
                    >
                      {notificationConfig[notification.type]?.icon}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {notification.title}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                        {notification.message}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-gray-500">
                      {formatTimeAgo(notification.createdAt)}
                    </span>
                  </div>
                </div>
                {!notification.isRead && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleMarkAsRead(notification._id)}
                  >
                    Mark as read
                  </Button>
                )}
              </div>
            ))}
          </div>
          {filteredNotifications.length === 0 && (
            <div className="text-center py-12">
              <div className="text-gray-500 mb-4">
                <Bell className="h-12 w-12 mx-auto" />
              </div>
              <p className="text-lg font-medium text-gray-600 dark:text-gray-300">
                {t('notifications.no_notifications')}
              </p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="auction_won" className="mt-6">
          <div className="space-y-4">
            {filteredNotifications.map((notification) => (
              <div
                key={notification._id}
                className="p-4 border rounded-lg bg-yellow-50 dark:bg-yellow-900/20"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center ${notificationConfig[notification.type]?.bgColor}`}
                    >
                      {notificationConfig[notification.type]?.icon}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {notification.title}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                        {notification.message}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-gray-500">
                      {formatTimeAgo(notification.createdAt)}
                    </span>
                  </div>
                </div>
                {!notification.isRead && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleMarkAsRead(notification._id)}
                  >
                    Mark as read
                  </Button>
                )}
              </div>
            ))}
          </div>
          {filteredNotifications.length === 0 && (
            <div className="text-center py-12">
              <div className="text-gray-500 mb-4">
                <Bell className="h-12 w-12 mx-auto" />
              </div>
              <p className="text-lg font-medium text-gray-600 dark:text-gray-300">
                {t('notifications.no_notifications')}
              </p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="bid_placed" className="mt-6">
          <div className="space-y-4">
            {filteredNotifications.map((notification) => (
              <div
                key={notification._id}
                className="p-4 border rounded-lg bg-secondary/50 dark:bg-secondary-900/20"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center ${notificationConfig[notification.type]?.bgColor}`}
                    >
                      {notificationConfig[notification.type]?.icon}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {notification.title}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                        {notification.message}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-gray-500">
                      {formatTimeAgo(notification.createdAt)}
                    </span>
                  </div>
                </div>
                {!notification.isRead && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleMarkAsRead(notification._id)}
                  >
                    Mark as read
                  </Button>
                )}
              </div>
            ))}
          </div>
          {filteredNotifications.length === 0 && (
            <div className="text-center py-12">
              <div className="text-gray-500 mb-4">
                <Bell className="h-12 w-12 mx-auto" />
              </div>
              <p className="text-lg font-medium text-gray-600 dark:text-gray-300">
                {t('notifications.no_notifications')}
              </p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="outbid" className="mt-6">
          <div className="space-y-4">
            {filteredNotifications.map((notification) => (
              <div
                key={notification._id}
                className="p-4 border rounded-lg bg-destructive/50 dark:bg-destructive-900/20"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center ${notificationConfig[notification.type]?.bgColor}`}
                    >
                      {notificationConfig[notification.type]?.icon}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {notification.title}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                        {notification.message}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-gray-500">
                      {formatTimeAgo(notification.createdAt)}
                    </span>
                  </div>
                </div>
                {!notification.isRead && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleMarkAsRead(notification._id)}
                  >
                    Mark as read
                  </Button>
                )}
              </div>
            ))}
          </div>
          {filteredNotifications.length === 0 && (
            <div className="text-center py-12">
              <div className="text-gray-500 mb-4">
                <Bell className="h-12 w-12 mx-auto" />
              </div>
              <p className="text-lg font-medium text-gray-600 dark:text-gray-300">
                {t('notifications.no_notifications')}
              </p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="payment" className="mt-6">
          <div className="space-y-4">
            {filteredNotifications.map((notification) => (
              <div
                key={notification._id}
                className="p-4 border rounded-lg bg-purple-50 dark:bg-purple-900/20"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center ${notificationConfig[notification.type]?.bgColor}`}
                    >
                      {notificationConfig[notification.type]?.icon}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {notification.title}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                        {notification.message}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-gray-500">
                      {formatTimeAgo(notification.createdAt)}
                    </span>
                  </div>
                </div>
                {!notification.isRead && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleMarkAsRead(notification._id)}
                  >
                    Mark as read
                  </Button>
                )}
              </div>
            ))}
          </div>
          {filteredNotifications.length === 0 && (
            <div className="text-center py-12">
              <div className="text-gray-500 mb-4">
                <Bell className="h-12 w-12 mx-auto" />
              </div>
              <p className="text-lg font-medium text-gray-600 dark:text-gray-300">
                {t('notifications.no_notifications')}
              </p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="system" className="mt-6">
          <div className="space-y-4">
            {filteredNotifications.map((notification) => (
              <div
                key={notification._id}
                className="p-4 border rounded-lg bg-primary/50 dark:bg-primary-900/20"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center ${notificationConfig[notification.type]?.bgColor}`}
                    >
                      {notificationConfig[notification.type]?.icon}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {notification.title}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                        {notification.message}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-gray-500">
                      {formatTimeAgo(notification.createdAt)}
                    </span>
                  </div>
                </div>
                {!notification.isRead && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleMarkAsRead(notification._id)}
                  >
                    Mark as read
                  </Button>
                )}
              </div>
            ))}
          </div>
          {filteredNotifications.length === 0 && (
            <div className="text-center py-12">
              <div className="text-gray-500 mb-4">
                <Bell className="h-12 w-12 mx-auto" />
              </div>
              <p className="text-lg font-medium text-gray-600 dark:text-gray-300">
                {t('notifications.no_notifications')}
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Action Buttons */}
      <div className="flex gap-4 mt-6">
        <Button
          variant="outline"
          onClick={handleMarkAllAsRead}
          disabled={stats.unread === 0}
        >
          <CheckCircle2 className="h-4 w-4 mr-2" />
          Mark All as Read
        </Button>
      </div>
    </div>
  );
}
