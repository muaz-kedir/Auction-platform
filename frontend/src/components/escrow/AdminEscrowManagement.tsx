import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Input } from "../ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { toast } from "sonner";
import { api } from "../../services/api";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import {
  Lock,
  Unlock,
  RefreshCw,
  DollarSign,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Eye,
  Shield,
  Search,
  Package,
} from "lucide-react";
import { format } from "date-fns";
import { getImageUrl } from "../../utils/imageUtils";

interface EscrowAuction {
  _id: string;
  title: string;
  images: string[];
  winningBid: number;
  currentBid: number;
  escrowStatus: string;
  paymentStatus: string;
  deliveryStatus: string;
  winner: {
    _id: string;
    name: string;
    email: string;
    profileImage?: string;
  } | null;
  seller: {
    _id: string;
    name: string;
    email: string;
    profileImage?: string;
  };
  escrowHoldAt: string | null;
  deliveredAt: string | null;
  releasedAt: string | null;
  refundedAt: string | null;
  dispute?: {
    isOpen: boolean;
    reason: string;
    openedAt: string;
  };
  createdAt: string;
}

interface EscrowStats {
  _id: string;
  count: number;
  totalAmount: number;
}

export function AdminEscrowManagement() {
  const [auctions, setAuctions] = useState<EscrowAuction[]>([]);
  const [stats, setStats] = useState<EscrowStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAuction, setSelectedAuction] = useState<EscrowAuction | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [refundReason, setRefundReason] = useState("");
  const [showRefundDialog, setShowRefundDialog] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const itemsPerPage = 10;

  useEffect(() => {
    fetchEscrowAuctions();
  }, [statusFilter, currentPage]);

  const fetchEscrowAuctions = async () => {
    try {
      setLoading(true);
      const params: any = { page: currentPage, limit: itemsPerPage };
      if (statusFilter !== "all") {
        params.status = statusFilter;
      }
      
      const response = await api.admin.getEscrowAuctions(params);
      setAuctions(response.auctions);
      setStats(response.stats);
      setTotalPages(response.pagination.pages);
    } catch (error: any) {
      toast.error("Failed to load escrow auctions");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleReleaseFunds = async (auctionId: string) => {
    try {
      setActionLoading(true);
      await api.escrow.releaseFunds(auctionId);
      toast.success("Funds released to seller successfully");
      await fetchEscrowAuctions();
      setSelectedAuction(null);
    } catch (error: any) {
      toast.error(error.message || "Failed to release funds");
    } finally {
      setActionLoading(false);
    }
  };

  const handleRefundFunds = async (auctionId: string) => {
    if (!refundReason.trim()) {
      toast.error("Please provide a refund reason");
      return;
    }

    try {
      setActionLoading(true);
      await api.escrow.refundFunds(auctionId, refundReason);
      toast.success("Funds refunded to buyer successfully");
      setShowRefundDialog(false);
      setRefundReason("");
      await fetchEscrowAuctions();
      setSelectedAuction(null);
    } catch (error: any) {
      toast.error(error.message || "Failed to refund funds");
    } finally {
      setActionLoading(false);
    }
  };

  const handleManualHold = async (auctionId: string) => {
    try {
      setActionLoading(true);
      await api.escrow.holdFunds(auctionId);
      toast.success("Funds held in escrow successfully");
      await fetchEscrowAuctions();
    } catch (error: any) {
      toast.error(error.message || "Failed to hold funds");
    } finally {
      setActionLoading(false);
    }
  };

  // Status badge configuration
  const getStatusBadge = (status: string) => {
    const configs: Record<string, { color: string; label: string; icon: React.ReactNode }> = {
      none: { color: "bg-gray-100 text-gray-700", label: "None", icon: <XCircle className="w-3 h-3" /> },
      awaiting_payment: { color: "bg-yellow-100 text-yellow-700", label: "Awaiting Payment", icon: <RefreshCw className="w-3 h-3" /> },
      payment_secured: { color: "bg-blue-100 text-blue-700", label: "Payment Secured", icon: <Lock className="w-3 h-3" /> },
      delivered: { color: "bg-purple-100 text-purple-700", label: "Delivered", icon: <Package className="w-3 h-3" /> },
      released: { color: "bg-green-100 text-green-700", label: "Released", icon: <Unlock className="w-3 h-3" /> },
      refunded: { color: "bg-red-100 text-red-700", label: "Refunded", icon: <XCircle className="w-3 h-3" /> },
      payment_failed: { color: "bg-red-100 text-red-700", label: "Payment Failed", icon: <AlertTriangle className="w-3 h-3" /> },
    };

    const config = configs[status] || configs.none;
    return (
      <Badge className={`${config.color} flex items-center gap-1`}>
        {config.icon}
        {config.label}
      </Badge>
    );
  };

  // Filter auctions by search term
  const filteredAuctions = auctions.filter(
    (auction) =>
      auction.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      auction.winner?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      auction.seller.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Calculate totals
  const totalInEscrow = stats
    .filter((s) => ["payment_secured", "delivered"].includes(s._id))
    .reduce((sum, s) => sum + s.totalAmount, 0);
  
  const totalReleased = stats
    .find((s) => s._id === "released")?.totalAmount || 0;
  
  const totalRefunded = stats
    .find((s) => s._id === "refunded")?.totalAmount || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Shield className="w-6 h-6 text-primary" />
            Escrow Management
          </h2>
          <p className="text-muted-foreground mt-1">
            Manage escrow payments, releases, and refunds
          </p>
        </div>
        <Button onClick={fetchEscrowAuctions} variant="outline" disabled={loading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Lock className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">In Escrow</p>
                <p className="text-xl font-bold">${totalInEscrow.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Unlock className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Released</p>
                <p className="text-xl font-bold">${totalReleased.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <XCircle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Refunded</p>
                <p className="text-xl font-bold">${totalRefunded.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <DollarSign className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Volume</p>
                <p className="text-xl font-bold">
                  ${(totalInEscrow + totalReleased + totalRefunded).toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search auctions, buyers, or sellers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="awaiting_payment">Awaiting Payment</SelectItem>
            <SelectItem value="payment_secured">Payment Secured</SelectItem>
            <SelectItem value="delivered">Delivered</SelectItem>
            <SelectItem value="released">Released</SelectItem>
            <SelectItem value="refunded">Refunded</SelectItem>
            <SelectItem value="payment_failed">Payment Failed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">All ({auctions.length})</TabsTrigger>
          <TabsTrigger value="pending">Pending Action</TabsTrigger>
          <TabsTrigger value="disputes">Disputes</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Auction</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Buyer</TableHead>
                    <TableHead>Seller</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">
                        <RefreshCw className="w-6 h-6 animate-spin mx-auto text-muted-foreground" />
                      </TableCell>
                    </TableRow>
                  ) : filteredAuctions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        No escrow auctions found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredAuctions.map((auction) => (
                      <TableRow key={auction._id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            {auction.images?.[0] && (
                              <img
                                src={getImageUrl(auction.images[0])}
                                alt={auction.title}
                                className="w-10 h-10 rounded object-cover"
                              />
                            )}
                            <div>
                              <p className="font-medium line-clamp-1">{auction.title}</p>
                              <p className="text-xs text-muted-foreground">
                                {format(new Date(auction.createdAt), "MMM d, yyyy")}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <p className="font-medium">
                            ${(auction.winningBid || auction.currentBid).toLocaleString()}
                          </p>
                        </TableCell>
                        <TableCell>
                          <p className="text-sm">{auction.winner?.name || "N/A"}</p>
                          <p className="text-xs text-muted-foreground">{auction.winner?.email}</p>
                        </TableCell>
                        <TableCell>
                          <p className="text-sm">{auction.seller.name}</p>
                          <p className="text-xs text-muted-foreground">{auction.seller.email}</p>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            {getStatusBadge(auction.escrowStatus)}
                            {auction.dispute?.isOpen && (
                              <Badge variant="destructive" className="text-xs">
                                <AlertTriangle className="w-3 h-3 mr-1" />
                                Dispute
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelectedAuction(auction)}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            
                            {/* Admin Actions */}
                            {auction.escrowStatus === "awaiting_payment" && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleManualHold(auction._id)}
                                disabled={actionLoading}
                              >
                                <Lock className="w-3 h-3 mr-1" />
                                Hold
                              </Button>
                            )}
                            
                            {(auction.escrowStatus === "payment_secured" || 
                              auction.escrowStatus === "delivered") && (
                              <>
                                <Button
                                  variant="default"
                                  size="sm"
                                  onClick={() => handleReleaseFunds(auction._id)}
                                  disabled={actionLoading}
                                  className="bg-green-600 hover:bg-green-700"
                                >
                                  <Unlock className="w-3 h-3 mr-1" />
                                  Release
                                </Button>
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedAuction(auction);
                                    setShowRefundDialog(true);
                                  }}
                                  disabled={actionLoading}
                                >
                                  <XCircle className="w-3 h-3 mr-1" />
                                  Refund
                                </Button>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
          )}
        </TabsContent>

        <TabsContent value="pending" className="space-y-4">
          {/* Pending actions view - show auctions that need admin attention */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Pending Actions</CardTitle>
              <CardDescription>
                Auctions requiring admin intervention
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {auctions
                  .filter(
                    (a) =>
                      a.escrowStatus === "awaiting_payment" ||
                      a.escrowStatus === "delivered" ||
                      a.dispute?.isOpen
                  )
                  .map((auction) => (
                    <div
                      key={auction._id}
                      className="flex items-center justify-between p-4 bg-muted/50 rounded-lg"
                    >
                      <div>
                        <p className="font-medium">{auction.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {getStatusBadge(auction.escrowStatus)}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedAuction(auction)}
                        >
                          View Details
                        </Button>
                      </div>
                    </div>
                  ))}
                
                {auctions.filter(
                  (a) =>
                    a.escrowStatus === "awaiting_payment" ||
                    a.escrowStatus === "delivered" ||
                    a.dispute?.isOpen
                ).length === 0 && (
                  <p className="text-center text-muted-foreground py-8">
                    No pending actions
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="disputes" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Open Disputes</CardTitle>
              <CardDescription>
                Auctions with active disputes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {auctions
                  .filter((a) => a.dispute?.isOpen)
                  .map((auction) => (
                    <div
                      key={auction._id}
                      className="p-4 bg-red-50 border border-red-200 rounded-lg"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium text-red-700">{auction.title}</p>
                          <p className="text-sm text-red-600 mt-1">
                            Reason: {auction.dispute?.reason}
                          </p>
                          <p className="text-xs text-red-500 mt-1">
                            Opened: {auction.dispute?.openedAt && 
                              format(new Date(auction.dispute.openedAt), "MMM d, yyyy h:mm a")}
                          </p>
                        </div>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => {
                            setSelectedAuction(auction);
                            setShowRefundDialog(true);
                          }}
                        >
                          Process Refund
                        </Button>
                      </div>
                    </div>
                  ))}
                
                {auctions.filter((a) => a.dispute?.isOpen).length === 0 && (
                  <p className="text-center text-muted-foreground py-8">
                    No open disputes
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Detail Dialog */}
      <Dialog open={!!selectedAuction} onOpenChange={() => setSelectedAuction(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Escrow Details</DialogTitle>
            <DialogDescription>
              View and manage escrow for this auction
            </DialogDescription>
          </DialogHeader>
          
          {selectedAuction && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                {selectedAuction.images?.[0] && (
                  <img
                    src={getImageUrl(selectedAuction.images[0])}
                    alt={selectedAuction.title}
                    className="w-20 h-20 rounded-lg object-cover"
                  />
                )}
                <div>
                  <p className="font-medium text-lg">{selectedAuction.title}</p>
                  <p className="text-2xl font-bold text-primary">
                    ${(selectedAuction.winningBid || selectedAuction.currentBid).toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-xs text-muted-foreground">Buyer</p>
                  <p className="font-medium">{selectedAuction.winner?.name || "N/A"}</p>
                  <p className="text-sm text-muted-foreground">{selectedAuction.winner?.email}</p>
                </div>
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-xs text-muted-foreground">Seller</p>
                  <p className="font-medium">{selectedAuction.seller.name}</p>
                  <p className="text-sm text-muted-foreground">{selectedAuction.seller.email}</p>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium">Status Timeline</p>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Payment Held:</span>
                    <span>{selectedAuction.escrowHoldAt 
                      ? format(new Date(selectedAuction.escrowHoldAt), "MMM d, yyyy h:mm a")
                      : "Not yet"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Delivered:</span>
                    <span>{selectedAuction.deliveredAt
                      ? format(new Date(selectedAuction.deliveredAt), "MMM d, yyyy h:mm a")
                      : "Not yet"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Released:</span>
                    <span>{selectedAuction.releasedAt
                      ? format(new Date(selectedAuction.releasedAt), "MMM d, yyyy h:mm a")
                      : "Not yet"}
                    </span>
                  </div>
                </div>
              </div>

              {selectedAuction.dispute?.isOpen && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="font-medium text-red-700 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    Dispute Opened
                  </p>
                  <p className="text-sm text-red-600 mt-1">{selectedAuction.dispute.reason}</p>
                </div>
              )}
            </div>
          )}

          <DialogFooter className="gap-2">
            {selectedAuction?.escrowStatus === "awaiting_payment" && (
              <Button
                onClick={() => handleManualHold(selectedAuction._id)}
                disabled={actionLoading}
              >
                <Lock className="w-4 h-4 mr-2" />
                Hold Funds
              </Button>
            )}
            
            {(selectedAuction?.escrowStatus === "payment_secured" ||
              selectedAuction?.escrowStatus === "delivered") && (
              <>
                <Button
                  variant="default"
                  onClick={() => handleReleaseFunds(selectedAuction._id)}
                  disabled={actionLoading}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Unlock className="w-4 h-4 mr-2" />
                  Release to Seller
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => setShowRefundDialog(true)}
                  disabled={actionLoading}
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Refund Buyer
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Refund Dialog */}
      <Dialog open={showRefundDialog} onOpenChange={setShowRefundDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Process Refund</DialogTitle>
            <DialogDescription>
              This will refund the full amount to the buyer&apos;s wallet. Please provide a reason.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <p className="text-sm font-medium mb-2">Refund Amount</p>
              <p className="text-2xl font-bold text-red-600">
                ${selectedAuction ? (selectedAuction.winningBid || selectedAuction.currentBid).toLocaleString() : "0"}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">
                Refund Reason <span className="text-red-500">*</span>
              </label>
              <Input
                placeholder="Enter reason for refund..."
                value={refundReason}
                onChange={(e) => setRefundReason(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRefundDialog(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => selectedAuction && handleRefundFunds(selectedAuction._id)}
              disabled={actionLoading || !refundReason.trim()}
            >
              {actionLoading ? "Processing..." : "Confirm Refund"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
