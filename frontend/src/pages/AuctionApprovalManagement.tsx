import { useState, useEffect } from "react";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { CheckCircle2, XCircle, Loader2, Search, Eye } from "lucide-react";
import { toast } from "sonner";
import { api } from "../services/api";
import { useAuth } from "../contexts/AuthContext";

interface Auction {
  _id: string;
  title: string;
  seller: { _id: string; name: string; email: string } | null;
  currentBid: number;
  startingBid: number;
  status: string;
  approvalStatus: string;
  createdAt: string;
  rejectionReason?: string;
}

export function AuctionApprovalManagement() {
  const { user } = useAuth();
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  
  // Reject Dialog
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectingAuction, setRejectingAuction] = useState<Auction | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [rejectLoading, setRejectLoading] = useState(false);

  const isSuperAdmin = user?.role === "super_admin";

  useEffect(() => {
    fetchAuctions();
  }, [searchTerm, statusFilter]);

  const fetchAuctions = async () => {
    try {
      setLoading(true);
      // Get pending auctions from Super Admin endpoint
      const response = await api.auctions.getPending();
      setAuctions(response);
    } catch (error: any) {
      toast.error(error.message || "Failed to fetch auctions");
    } finally {
      setLoading(false);
    }
  };


  const handleApprove = async (auctionId: string) => {
    try {
      await api.auctions.approve(auctionId);
      toast.success("Auction approved successfully! Now visible to buyers.");
      fetchAuctions();
    } catch (error: any) {
      toast.error(error.message || "Failed to approve auction");
    }
  };

  const openRejectDialog = (auction: Auction) => {
    setRejectingAuction(auction);
    setRejectionReason("");
    setRejectDialogOpen(true);
  };

  const handleReject = async () => {
    if (!rejectingAuction) return;
    if (!rejectionReason.trim()) {
      toast.error("Please provide a rejection reason");
      return;
    }

    setRejectLoading(true);
    try {
      await api.auctions.reject(rejectingAuction._id, rejectionReason);
      toast.success("Auction rejected");
      setRejectDialogOpen(false);
      fetchAuctions();
    } catch (error: any) {
      toast.error(error.message || "Failed to reject auction");
    } finally {
      setRejectLoading(false);
    }
  };

  const getApprovalStatusBadge = (status: string) => {
    const badges = {
      PENDING: <Badge variant="outline" className="bg-yellow-100 text-yellow-800">Pending</Badge>,
      SUBMITTED: <Badge className="bg-blue-500">Submitted</Badge>,
      APPROVED: <Badge className="bg-green-500">Approved</Badge>,
      REJECTED: <Badge variant="destructive">Rejected</Badge>,
    };
    return badges[status as keyof typeof badges] || <Badge>{status}</Badge>;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">Auction Approval Management</h1>
        <p className="text-muted-foreground">
          Review and manage auction approvals
        </p>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search auctions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="PENDING">Pending</SelectItem>
              <SelectItem value="SUBMITTED">Submitted</SelectItem>
              <SelectItem value="APPROVED">Approved</SelectItem>
              <SelectItem value="REJECTED">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Auctions Table */}
      <Card>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Seller</TableHead>
                <TableHead>Starting Bid</TableHead>
                <TableHead>Current Bid</TableHead>
                <TableHead>Approval Status</TableHead>
                <TableHead>Created Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                  </TableCell>
                </TableRow>
              ) : auctions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No auctions found
                  </TableCell>
                </TableRow>
              ) : (
                auctions.map((auction) => (
                  <TableRow key={auction._id}>
                    <TableCell className="font-medium">{auction.title}</TableCell>
                    <TableCell>
                      {auction.seller ? (
                        <div>
                          <div className="font-medium">{auction.seller.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {auction.seller.email}
                          </div>
                        </div>
                      ) : (
                        <div className="text-sm text-muted-foreground">No seller</div>
                      )}
                    </TableCell>
                    <TableCell>{formatCurrency(auction.startingBid)}</TableCell>
                    <TableCell>{formatCurrency(auction.currentBid)}</TableCell>
                    <TableCell>
                      {getApprovalStatusBadge(auction.approvalStatus)}
                      {auction.rejectionReason && (
                        <div className="text-xs text-destructive mt-1">
                          {auction.rejectionReason}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>{formatDate(auction.createdAt)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {/* Super Admin can approve/reject pending auctions */}
                        {(auction.approvalStatus === "PENDING" || auction.approvalStatus === "SUBMITTED") && (
                          <>
                            <Button
                              size="sm"
                              onClick={() => handleApprove(auction._id)}
                              className="bg-green-500 hover:bg-green-600"
                            >
                              <CheckCircle2 className="h-4 w-4 mr-1" />
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => openRejectDialog(auction)}
                            >
                              <XCircle className="h-4 w-4 mr-1" />
                              Reject
                            </Button>
                          </>
                        )}

                        {/* View button for all */}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => window.open(`/dashboard/auctions/${auction._id}`, '_blank')}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Auction</DialogTitle>
            <DialogDescription>
              Provide a reason for rejecting this auction. The seller will be notified.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium mb-2">
                Auction: {rejectingAuction?.title}
              </p>
              <Textarea
                placeholder="Enter rejection reason..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRejectDialogOpen(false)}
              disabled={rejectLoading}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={rejectLoading}
            >
              {rejectLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Rejecting...
                </>
              ) : (
                "Reject Auction"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
