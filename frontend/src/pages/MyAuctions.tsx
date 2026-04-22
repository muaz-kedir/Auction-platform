import { useState, useEffect } from "react";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../components/ui/alert-dialog";
import { Link } from "react-router";
import { 
  Search, 
  MoreVertical, 
  Eye, 
  Edit, 
  Trash2, 
  Send,
  Loader2,
  Plus
} from "lucide-react";
import { api } from "../services/api";
import { useAuth } from "../hooks/useAuth";
import { toast } from "sonner";

interface Auction {
  _id: string;
  title: string;
  images: string[];
  currentBid: number;
  startingBid: number;
  status: string;
  approvalStatus: string;
  endTime: string;
  createdAt: string;
  category?: {
    name: string;
  };
}

export function MyAuctions() {
  const { user } = useAuth();
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [filteredAuctions, setFilteredAuctions] = useState<Auction[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedAuction, setSelectedAuction] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchAuctions();
  }, []);

  useEffect(() => {
    filterAuctions();
  }, [auctions, searchQuery, statusFilter]);

  const fetchAuctions = async () => {
    try {
      setLoading(true);
      // Fetch all auctions for this seller (including pending, approved, rejected)
      const response = await api.auctions.getAll({ seller: user?._id });
      setAuctions(response);
    } catch (error: any) {
      console.error("Failed to fetch auctions:", error);
      toast.error("Failed to load auctions");
    } finally {
      setLoading(false);
    }
  };

  const filterAuctions = () => {
    let filtered = [...auctions];

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter((auction) =>
        auction.title.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== "all") {
      if (statusFilter === "pending") {
        filtered = filtered.filter(
          (a) => a.approvalStatus === "PENDING" || a.approvalStatus === "SUBMITTED"
        );
      } else if (statusFilter === "active") {
        filtered = filtered.filter((a) => a.status === "ACTIVE");
      } else if (statusFilter === "ended") {
        filtered = filtered.filter((a) => a.status === "ENDED");
      } else if (statusFilter === "rejected") {
        filtered = filtered.filter((a) => a.approvalStatus === "REJECTED");
      }
    }

    setFilteredAuctions(filtered);
  };

  const handleSubmitForApproval = async (auctionId: string) => {
    try {
      setSubmitting(true);
      await api.admin.submitAuctionForApproval(auctionId);
      toast.success("Auction submitted for approval");
      fetchAuctions();
    } catch (error: any) {
      console.error("Failed to submit auction:", error);
      toast.error(error.response?.data?.message || "Failed to submit auction");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteAuction = async () => {
    if (!selectedAuction) return;

    try {
      await api.admin.deleteAuction(selectedAuction);
      toast.success("Auction deleted successfully");
      fetchAuctions();
      setDeleteDialogOpen(false);
      setSelectedAuction(null);
    } catch (error: any) {
      console.error("Failed to delete auction:", error);
      toast.error(error.response?.data?.message || "Failed to delete auction");
    }
  };

  const getStatusBadge = (auction: Auction) => {
    if (auction.status === "ACTIVE") {
      return <Badge className="bg-secondary">Active</Badge>;
    }
    if (auction.status === "ENDED") {
      return <Badge variant="outline">Ended</Badge>;
    }
    if (auction.approvalStatus === "PENDING") {
      return <Badge className="bg-yellow-500">Pending</Badge>;
    }
    if (auction.approvalStatus === "SUBMITTED") {
      return <Badge className="bg-blue-500">Submitted</Badge>;
    }
    if (auction.approvalStatus === "REJECTED") {
      return <Badge variant="destructive">Rejected</Badge>;
    }
    return <Badge variant="secondary">Draft</Badge>;
  };

  const calculateTimeLeft = (endTime: string) => {
    const end = new Date(endTime).getTime();
    const now = new Date().getTime();
    const diff = end - now;

    if (diff <= 0) return "Ended";

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (days > 0) return `${days}d ${hours}h`;
    return `${hours}h`;
  };

  const canEdit = (auction: Auction) => {
    return auction.approvalStatus === "PENDING" && auction.status !== "ACTIVE";
  };

  const canDelete = (auction: Auction) => {
    return auction.status !== "ACTIVE" && auction.approvalStatus !== "APPROVED";
  };

  const canSubmit = (auction: Auction) => {
    return auction.approvalStatus === "PENDING" && auction.status === "PENDING";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">My Auctions</h1>
          <p className="text-muted-foreground">Manage your auction listings</p>
        </div>
        <Link to="/dashboard/seller/create">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Create Auction
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <Card className="p-4 border-border/50 bg-card/50 backdrop-blur-sm">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search auctions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full md:w-[200px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Auctions</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="pending">Pending Approval</SelectItem>
              <SelectItem value="ended">Ended</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Results Count */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Showing {filteredAuctions.length} {filteredAuctions.length === 1 ? "auction" : "auctions"}
        </p>
      </div>

      {/* Auctions List */}
      {filteredAuctions.length === 0 ? (
        <Card className="p-12 text-center border-dashed">
          <div className="max-w-md mx-auto">
            <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No auctions found</h3>
            <p className="text-muted-foreground mb-6">
              {searchQuery || statusFilter !== "all"
                ? "Try adjusting your filters"
                : "Create your first auction to get started"}
            </p>
            {!searchQuery && statusFilter === "all" && (
              <Link to="/dashboard/seller/create">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Auction
                </Button>
              </Link>
            )}
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredAuctions.map((auction) => (
            <Card key={auction._id} className="p-6 border-border/50 bg-card/50 backdrop-blur-sm">
              <div className="flex gap-4">
                <img
                  src={auction.images[0] || "https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?w=150"}
                  alt={auction.title}
                  className="w-32 h-32 rounded-lg object-cover"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="text-lg font-semibold mb-1">{auction.title}</h3>
                      <p className="text-sm text-muted-foreground">
                        {auction.category?.name || "Uncategorized"}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(auction)}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link to={`/auction/${auction._id}`}>
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </Link>
                          </DropdownMenuItem>
                          {canEdit(auction) && (
                            <DropdownMenuItem>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                          )}
                          {canSubmit(auction) && (
                            <DropdownMenuItem
                              onClick={() => handleSubmitForApproval(auction._id)}
                              disabled={submitting}
                            >
                              <Send className="h-4 w-4 mr-2" />
                              Submit for Approval
                            </DropdownMenuItem>
                          )}
                          {canDelete(auction) && (
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => {
                                setSelectedAuction(auction._id);
                                setDeleteDialogOpen(true);
                              }}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Starting Bid</p>
                      <p className="font-medium">${auction.startingBid.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Current Bid</p>
                      <p className="font-medium text-primary">${auction.currentBid.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Time Left</p>
                      <p className="font-medium">{calculateTimeLeft(auction.endTime)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Created</p>
                      <p className="font-medium">{new Date(auction.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Auction</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this auction? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteAuction} className="bg-destructive">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
