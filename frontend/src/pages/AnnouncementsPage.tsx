import { useState, useEffect } from "react";
import { Link } from "react-router";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Megaphone, ArrowLeft, Calendar, User, Loader2 } from "lucide-react";
import { motion } from "motion/react";
import { ThemeToggle } from "../components/ThemeToggle";

interface Announcement {
  _id: string;
  title: string;
  content: string;
  visibility: string;
  isActive: boolean;
  createdBy: { name: string; email: string };
  createdAt: string;
}

export function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
      const response = await fetch(`${API_URL}/api/announcements/public`);
      const data = await response.json();
      if (data.announcements) {
        // Filter for homepage/both visibility and active announcements
        const publicAnnouncements = data.announcements.filter(
          (a: Announcement) => 
            a.isActive && 
            (a.visibility === "homepage" || a.visibility === "both")
        );
        setAnnouncements(publicAnnouncements);
      }
    } catch (error) {
      console.error("Failed to fetch announcements:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
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
                <Megaphone className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold">Announcements</span>
            </Link>

            <div className="flex items-center gap-3">
              <ThemeToggle />
              <Link to="/">
                <Button variant="ghost" className="gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Back to Home
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Content */}
      <main className="container mx-auto px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-4xl mx-auto"
        >
          <div className="text-center mb-12">
            <Badge className="bg-primary/10 text-primary border-primary/20 mb-4">
              <Megaphone className="h-3 w-3 mr-1" />
              Platform Updates
            </Badge>
            <h1 className="text-4xl font-bold mb-4">Latest Announcements</h1>
            <p className="text-muted-foreground text-lg">
              Stay updated with the latest news, features, and important updates from BidSmart
            </p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : announcements.length === 0 ? (
            <Card className="p-12 text-center">
              <Megaphone className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-xl font-semibold mb-2">No Announcements Yet</h3>
              <p className="text-muted-foreground">
                Check back later for updates and news from our team.
              </p>
            </Card>
          ) : (
            <div className="space-y-6">
              {announcements.map((announcement, index) => (
                <motion.div
                  key={announcement._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                >
                  <Card className="p-6 hover:border-primary/50 transition-all">
                    <div className="flex items-start gap-4">
                      <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Megaphone className="h-6 w-6 text-primary" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold mb-2">
                          {announcement.title}
                        </h3>
                        <p className="text-muted-foreground whitespace-pre-wrap mb-4">
                          {announcement.content}
                        </p>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <User className="h-4 w-4" />
                            <span>{announcement.createdBy?.name || "Admin"}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            <span>{formatDate(announcement.createdAt)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-card/50 mt-20">
        <div className="container mx-auto px-6 py-8">
          <div className="text-center text-sm text-muted-foreground">
            <p>© 2026 BidSmart. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
