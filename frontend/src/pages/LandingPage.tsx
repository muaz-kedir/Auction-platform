import { useState, useEffect } from "react";
import { Link } from "react-router";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { 
  Gavel, 
  TrendingUp, 
  Shield, 
  Zap, 
  ArrowRight,
  Star,
  Clock,
  Users,
  CheckCircle2,
  Sparkles,
  Bell,
  X,
  Megaphone
} from "lucide-react";
import { motion } from "motion/react";
import { ThemeToggle } from "../components/ThemeToggle";
import { LanguageSwitcher } from "../components/LanguageSwitcher";
import { FeaturedAuctions } from "../components/FeaturedAuctions";
import { useTranslation } from "react-i18next";

const categories = [
  { name: "common.categories.electronics", icon: Zap, color: "text-blue-500" },
  { name: "common.categories.watches", icon: Clock, color: "text-purple-500" },
  { name: "common.categories.art", icon: Sparkles, color: "text-pink-500" },
  { name: "common.categories.vehicles", icon: TrendingUp, color: "text-green-500" },
  { name: "common.categories.jewelry", icon: Star, color: "text-yellow-500" },
  { name: "common.categories.collectibles", icon: Shield, color: "text-red-500" },
];

const steps = [
  {
    number: "01",
    title: "landing.steps.step_1_title",
    description: "landing.steps.step_1_desc",
  },
  {
    number: "02",
    title: "landing.steps.step_2_title",
    description: "landing.steps.step_2_desc",
  },
  {
    number: "03",
    title: "landing.steps.step_3_title",
    description: "landing.steps.step_3_desc",
  },
];

const testimonials = [
  {
    name: "Sarah Johnson",
    role: "Collector",
    content: "Best auction platform I've used. The AI recommendations are spot-on and the escrow system gives me peace of mind.",
    rating: 5,
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah",
  },
  {
    name: "Michael Chen",
    role: "Seller",
    content: "Sold over $50k worth of items here. The platform is professional, secure, and the buyer protection is excellent.",
    rating: 5,
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Michael",
  },
  {
    name: "Emma Davis",
    role: "Buyer",
    content: "Love the real-time bidding experience! It's smooth, fast, and I've found some amazing deals.",
    rating: 5,
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Emma",
  },
];

interface Announcement {
  _id: string;
  title: string;
  content: string;
  createdAt: string;
  createdBy: { name: string };
}

interface PublicStats {
  activeUsers: string;
  itemsSold: string;
  successRate: number;
}

const SEEN_ANNOUNCEMENTS_KEY = "seenAnnouncements";

export function LandingPage() {
  const { t } = useTranslation();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [seenIds, setSeenIds] = useState<string[]>([]);
  
  // Stats state
  const [stats, setStats] = useState<PublicStats>({
    activeUsers: "...",
    itemsSold: "...",
    successRate: 0
  });
  const [statsLoading, setStatsLoading] = useState(true);

  // Load seen announcement IDs from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(SEEN_ANNOUNCEMENTS_KEY);
    if (stored) {
      setSeenIds(JSON.parse(stored));
    }
  }, []);

  // Fetch announcements
  useEffect(() => {
    fetchAnnouncements();
    fetchStats();
  }, []);

  // Fetch public stats
  const fetchStats = async () => {
    try {
      setStatsLoading(true);
      const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
      const response = await fetch(`${API_URL}/api/stats/public`);
      const data = await response.json();
      if (data.success && data.stats) {
        setStats(data.stats);
      }
    } catch (error) {
      console.error("Failed to fetch stats:", error);
      // Fallback to default values if fetch fails
      setStats({
        activeUsers: "50K+",
        itemsSold: "$2M+",
        successRate: 99
      });
    } finally {
      setStatsLoading(false);
    }
  };

  // Update unread count when announcements or seenIds change
  useEffect(() => {
    const unread = announcements.filter(a => !seenIds.includes(a._id));
    setUnreadCount(unread.length);
  }, [announcements, seenIds]);

  const fetchAnnouncements = async () => {
    try {
      const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
      const response = await fetch(`${API_URL}/api/announcements/public`);
      const data = await response.json();
      if (data.announcements) {
        const activeAnnouncements = data.announcements.filter((a: Announcement) => 
          a.visibility === "homepage" || a.visibility === "both"
        );
        setAnnouncements(activeAnnouncements.slice(0, 5));
      }
    } catch (error) {
      console.error("Failed to fetch announcements:", error);
    }
  };

  const handleOpenNotifications = () => {
    setShowNotifications(true);
    // Mark all current announcements as seen
    const currentIds = announcements.map(a => a._id);
    const newSeenIds = Array.from(new Set([...seenIds, ...currentIds]));
    setSeenIds(newSeenIds);
    localStorage.setItem(SEEN_ANNOUNCEMENTS_KEY, JSON.stringify(newSeenIds));
  };

  const handleCloseNotifications = () => {
    setShowNotifications(false);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 border-b border-border bg-card/80 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2">
              <div className="h-9 w-9 rounded-lg bg-primary flex items-center justify-center">
                <Gavel className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold">BidSmart</span>
            </Link>

            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-sm hover:text-primary transition-colors">
                {t('landing.features_badge')}
              </a>
              <a href="#how-it-works" className="text-sm hover:text-primary transition-colors">
                {t('common.how_it_works')}
              </a>
              <Link to="/dashboard/auctions" className="text-sm hover:text-primary transition-colors">
                {t('common.auctions')}
              </Link>
            </div>

            <div className="flex items-center gap-3">
              {/* Notification Bell */}
              <div className="relative">
                <button
                  onClick={() => showNotifications ? handleCloseNotifications() : handleOpenNotifications()}
                  className="relative p-2 rounded-lg hover:bg-muted transition-colors"
                >
                  <Bell className="h-5 w-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-destructive text-destructive-foreground text-xs flex items-center justify-center font-medium">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {/* Notifications Dropdown */}
                {showNotifications && (
                  <>
                    <div 
                      className="fixed inset-0 z-40" 
                      onClick={handleCloseNotifications}
                    />
                    <Card className="absolute right-0 top-full mt-2 w-96 z-50 shadow-lg border-border">
                      <div className="p-4 border-b border-border flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Megaphone className="h-4 w-4 text-primary" />
                          <h3 className="font-semibold">{t('notifications.title')}</h3>
                        </div>
                        <button 
                          onClick={handleCloseNotifications}
                          className="p-1 rounded hover:bg-muted transition-colors"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                      <div className="max-h-80 overflow-y-auto">
                        {announcements.length === 0 ? (
                          <div className="p-8 text-center text-muted-foreground">
                            <Megaphone className="h-8 w-8 mx-auto mb-2 opacity-50" />
                            <p className="text-sm">{t('notifications.no_notifications')}</p>
                          </div>
                        ) : (
                          <div className="divide-y divide-border">
                            {announcements.map((announcement) => (
                              <div 
                                key={announcement._id} 
                                className="p-4 hover:bg-muted/50 transition-colors cursor-pointer"
                              >
                                <div className="flex items-start gap-3">
                                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                                    <Megaphone className="h-4 w-4 text-primary" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <h4 className="font-medium text-sm line-clamp-1">
                                      {announcement.title}
                                    </h4>
                                    <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                                      {announcement.content}
                                    </p>
                                    <div className="flex items-center gap-2 mt-2">
                                      <span className="text-xs text-muted-foreground">
                                        By {announcement.createdBy?.name || "Admin"}
                                      </span>
                                      <span className="text-xs text-muted-foreground">•</span>
                                      <span className="text-xs text-muted-foreground">
                                        {formatDate(announcement.createdAt)}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="p-3 border-t border-border bg-muted/50">
                        <Link 
                          to="/announcements" 
                          className="block text-center text-sm text-primary hover:underline"
                          onClick={() => setShowNotifications(false)}
                        >
                          {t('notifications.view_all_announcements')}
                        </Link>
                      </div>
                    </Card>
                  </>
                )}
              </div>

              <LanguageSwitcher />
              <ThemeToggle />
              <Link to="/login">
                <Button variant="ghost">{t('common.login')}</Button>
              </Link>
              <Link to="/register">
                <Button>{t('common.register')}</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-secondary/10" />
        <div className="container mx-auto px-6 py-24 lg:py-32 relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-3xl mx-auto text-center space-y-8"
          >
            <Badge className="bg-primary/10 text-primary border-primary/20 hover:bg-primary/20">
              <Sparkles className="h-3 w-3 mr-1" />
              {t('landing.hero_badge')}
            </Badge>
            
            <h1 className="text-5xl lg:text-7xl font-bold tracking-tight">
              {t('landing.hero_title_1')}{" "}
              <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                {t('landing.hero_title_2')}
              </span>
            </h1>
            
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              {t('landing.hero_subtitle')}
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/register">
                <Button size="lg" className="gap-2">
                  {t('landing.start_bidding')} <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link to="/dashboard/auctions">
                <Button size="lg" variant="outline">
                  {t('landing.explore_auctions')}
                </Button>
              </Link>
            </div>

            <div className="flex items-center justify-center gap-8 pt-8">
              <div className="text-center">
                <p className={`text-3xl font-bold text-primary ${statsLoading ? 'animate-pulse' : ''}`}>
                  {stats.activeUsers}
                </p>
                <p className="text-sm text-muted-foreground">{t('landing.stats.active_users')}</p>
              </div>
              <div className="h-12 w-px bg-border" />
              <div className="text-center">
                <p className={`text-3xl font-bold text-primary ${statsLoading ? 'animate-pulse' : ''}`}>
                  {stats.itemsSold}
                </p>
                <p className="text-sm text-muted-foreground">{t('landing.stats.items_sold')}</p>
              </div>
              <div className="h-12 w-px bg-border" />
              <div className="text-center">
                <p className={`text-3xl font-bold text-primary ${statsLoading ? 'animate-pulse' : ''}`}>
                  {stats.successRate}%
                </p>
                <p className="text-sm text-muted-foreground">{t('landing.stats.success_rate')}</p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Featured Auctions */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-6">
          <div className="flex items-center justify-between mb-12">
            <div>
              <h2 className="text-3xl font-bold mb-2">{t('landing.featured_title')}</h2>
              <p className="text-muted-foreground">{t('landing.featured_subtitle')}</p>
            </div>
            <Link to="/auctions">
              <Button variant="outline" className="gap-2">
                {t('common.view_all')} <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>

          <FeaturedAuctions />
        </div>
      </section>

      {/* Categories */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-2">{t('landing.categories_title')}</h2>
            <p className="text-muted-foreground">{t('landing.categories_subtitle')}</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {categories.map((category, index) => (
              <motion.div
                key={category.name}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
              >
                <Card className="p-6 text-center hover:border-primary/50 transition-all cursor-pointer group">
                  <category.icon className={`h-8 w-8 mx-auto mb-3 ${category.color} group-hover:scale-110 transition-transform`} />
                  <p className="font-medium">{t(category.name)}</p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 bg-muted/30">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-2">{t('landing.how_works_title')}</h2>
            <p className="text-muted-foreground">{t('landing.how_works_subtitle')}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {steps.map((step, index) => (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.2 }}
              >
                <Card className="p-8 text-center relative overflow-hidden group hover:border-primary/50 transition-all">
                  <div className="absolute top-4 right-4 text-6xl font-bold text-primary/5 group-hover:text-primary/10 transition-colors">
                    {step.number}
                  </div>
                  <div className="relative">
                    <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
                      <span className="text-2xl font-bold text-primary">{step.number}</span>
                    </div>
                    <h3 className="text-xl font-bold mb-3">{t(step.title)}</h3>
                    <p className="text-muted-foreground">{t(step.description)}</p>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <Badge className="bg-primary/10 text-primary border-primary/20">
                {t('landing.features_badge')}
              </Badge>
              <h2 className="text-4xl font-bold">
                {t('landing.features_title')}
              </h2>
              <p className="text-lg text-muted-foreground">
                {t('landing.features_subtitle')}
              </p>

              <div className="space-y-4">
                {[
                  { icon: Sparkles, title: "landing.features.ai.title", description: "landing.features.ai.desc" },
                  { icon: Shield, title: "landing.features.escrow.title", description: "landing.features.escrow.desc" },
                  { icon: Zap, title: "landing.features.realtime.title", description: "landing.features.realtime.desc" },
                  { icon: CheckCircle2, title: "landing.features.verified.title", description: "landing.features.verified.desc" },
                ].map((feature, index) => (
                  <motion.div
                    key={feature.title}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4, delay: index * 0.1 }}
                    className="flex gap-4"
                  >
                    <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <feature.icon className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-semibold mb-1">{t(feature.title)}</h4>
                      <p className="text-sm text-muted-foreground">{t(feature.description)}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Card className="p-6 space-y-4">
                <TrendingUp className="h-8 w-8 text-secondary" />
                <div>
                  <p className="text-3xl font-bold">2.5M+</p>
                  <p className="text-sm text-muted-foreground">Successful Bids</p>
                </div>
              </Card>
              <Card className="p-6 space-y-4">
                <Users className="h-8 w-8 text-primary" />
                <div>
                  <p className="text-3xl font-bold">50K+</p>
                  <p className="text-sm text-muted-foreground">Active Bidders</p>
                </div>
              </Card>
              <Card className="p-6 space-y-4">
                <Shield className="h-8 w-8 text-purple-500" />
                <div>
                  <p className="text-3xl font-bold">100%</p>
                  <p className="text-sm text-muted-foreground">Secure Payments</p>
                </div>
              </Card>
              <Card className="p-6 space-y-4">
                <Star className="h-8 w-8 text-yellow-500" />
                <div>
                  <p className="text-3xl font-bold">4.9/5</p>
                  <p className="text-sm text-muted-foreground">User Rating</p>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-2">{t('landing.testimonials_title')}</h2>
            <p className="text-muted-foreground">{t('landing.testimonials_subtitle')}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={testimonial.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
              >
                <Card className="p-6 h-full">
                  <div className="flex gap-1 mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                    ))}
                  </div>
                  <p className="text-muted-foreground mb-6">{testimonial.content}</p>
                  <div className="flex items-center gap-3">
                    <img 
                      src={testimonial.avatar} 
                      alt={testimonial.name}
                      className="h-10 w-10 rounded-full"
                    />
                    <div>
                      <p className="font-semibold">{testimonial.name}</p>
                      <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <Card className="p-12 text-center bg-gradient-to-br from-primary/10 via-card to-secondary/10 border-primary/20">
            <h2 className="text-4xl font-bold mb-4">{t('landing.cta_title')}</h2>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              {t('landing.cta_subtitle')}
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/register">
                <Button size="lg" className="gap-2">
                  {t('auth.create_account')} <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link to="/dashboard/auctions">
                <Button size="lg" variant="outline">
                  {t('landing.explore_auctions')}
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-card/50">
        <div className="container mx-auto px-6 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                  <Gavel className="h-5 w-5 text-primary-foreground" />
                </div>
                <span className="text-lg font-bold">BidSmart</span>
              </div>
              <p className="text-sm text-muted-foreground">
                {t('landing.footer_desc')}
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-4">{t('landing.footer_platform')}</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-primary transition-colors">How it works</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Security</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Features</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">{t('landing.footer_support')}</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-primary transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Contact Us</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Trust & Safety</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Seller Guide</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">{t('landing.footer_legal')}</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-primary transition-colors">Terms of Service</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Cookie Policy</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Licenses</a></li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-border text-center text-sm text-muted-foreground">
            <p>© 2026 BidSmart. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
