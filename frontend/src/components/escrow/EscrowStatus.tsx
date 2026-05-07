import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Separator } from "../ui/separator";
import { toast } from "sonner";
import { api } from "../../services/api";
import { useAuth } from "../../hooks/useAuth";
import {
  Lock,
  Unlock,
  Package,
  Truck,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Clock,
  DollarSign,
  Shield,
  AlertTriangle,
} from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";

interface EscrowStatusProps {
  auctionId: string;
  auctionStatus?: string;
}

interface EscrowData {
  auction: {
    _id: string;
    title: string;
    images: string[];
    winningBid: number;
  };
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
  escrowStatus: string;
  paymentStatus: string;
  deliveryStatus: string;
  dispute?: {
    isOpen: boolean;
    reason: string;
    openedAt: string;
  };
  escrowHoldAt: string | null;
  deliveredAt: string | null;
  releasedAt: string | null;
  refundedAt: string | null;
  walletInfo?: {
    balance: number;
    heldBalance: number;
    availableBalance: number;
  } | null;
  isWinner: boolean;
  isSeller: boolean;
}

export function EscrowStatus({ auctionId, auctionStatus }: EscrowStatusProps) {
  const { user } = useAuth();
  const [escrowData, setEscrowData] = useState<EscrowData | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (auctionId && auctionStatus === "ENDED") {
      fetchEscrowStatus();
    }
  }, [auctionId, auctionStatus]);

  const fetchEscrowStatus = async () => {
    try {
      setLoading(true);
      const data = await api.escrow.getStatus(auctionId);
      setEscrowData(data);
    } catch (error: any) {
      console.error("Failed to fetch escrow status:", error);
      // Don't show error toast if user is not involved in this auction
      if (error.response?.status !== 403) {
        toast.error("Failed to load escrow status");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleMarkDelivered = async () => {
    try {
      setActionLoading(true);
      await api.escrow.markDelivered(auctionId);
      toast.success("Item marked as delivered");
      await fetchEscrowStatus();
    } catch (error: any) {
      toast.error(error.message || "Failed to mark as delivered");
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirmDelivery = async () => {
    try {
      setActionLoading(true);
      await api.escrow.confirm(auctionId);
      toast.success("Delivery confirmed");
      await fetchEscrowStatus();
    } catch (error: any) {
      toast.error(error.message || "Failed to confirm delivery");
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenDispute = async () => {
    const reason = window.prompt("Please provide a reason for the dispute:");
    if (!reason) return;

    try {
      setActionLoading(true);
      await api.escrow.openDispute(auctionId, reason);
      toast.success("Dispute opened successfully");
      await fetchEscrowStatus();
    } catch (error: any) {
      toast.error(error.message || "Failed to open dispute");
    } finally {
      setActionLoading(false);
    }
  };

  // Don't show if auction hasn't ended or user is not involved
  if (auctionStatus !== "ENDED" || !escrowData) {
    return null;
  }

  if (loading) {
    return (
      <Card className="border-border/50">
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-24">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const { escrowStatus, paymentStatus, deliveryStatus, isWinner, isSeller, winner, seller, auction } = escrowData;

  // Status configurations
  const statusConfig: Record<string, { color: string; icon: React.ReactNode; label: string }> = {
    none: { color: "bg-gray-100 text-gray-700", icon: <Clock className="w-4 h-4" />, label: "Awaiting Payment" },
    awaiting_payment: { color: "bg-yellow-100 text-yellow-700", icon: <Clock className="w-4 h-4" />, label: "Awaiting Payment" },
    payment_secured: { color: "bg-blue-100 text-blue-700", icon: <Lock className="w-4 h-4" />, label: "Payment Secured" },
    delivered: { color: "bg-purple-100 text-purple-700", icon: <Truck className="w-4 h-4" />, label: "Delivered - Awaiting Approval" },
    released: { color: "bg-green-100 text-green-700", icon: <Unlock className="w-4 h-4" />, label: "Payment Released" },
    refunded: { color: "bg-red-100 text-red-700", icon: <XCircle className="w-4 h-4" />, label: "Refunded" },
    payment_failed: { color: "bg-red-100 text-red-700", icon: <AlertCircle className="w-4 h-4" />, label: "Payment Failed" },
  };

  const currentStatus = statusConfig[escrowStatus] || statusConfig.none;

  return (
    <Card className="border-border/50 bg-card/60 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            <CardTitle className="text-lg">Escrow Status</CardTitle>
          </div>
          <Badge className={currentStatus.color}>
            <span className="flex items-center gap-1">
              {currentStatus.icon}
              {currentStatus.label}
            </span>
          </Badge>
        </div>
        <CardDescription>
          Secure payment held in escrow for "{auction.title}"
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Amount Display */}
        <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-full">
              <DollarSign className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Amount in Escrow</p>
              <p className="text-2xl font-bold">${auction.winningBid.toLocaleString()}</p>
            </div>
          </div>
          {escrowData.walletInfo && isWinner && (
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Your Wallet</p>
              <p className="text-sm">
                <span className="text-amber-600 font-medium">${escrowData.walletInfo.heldBalance.toLocaleString()}</span>
                {" "}locked
              </p>
            </div>
          )}
        </div>

        {/* Parties Info */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-3 bg-muted/30 rounded-lg">
            <p className="text-xs text-muted-foreground mb-1">Buyer (Winner)</p>
            <p className="font-medium text-sm truncate">{winner?.name || "Unknown"}</p>
            {isWinner && <Badge variant="outline" className="mt-1 text-xs">You</Badge>}
          </div>
          <div className="p-3 bg-muted/30 rounded-lg">
            <p className="text-xs text-muted-foreground mb-1">Seller</p>
            <p className="font-medium text-sm truncate">{seller.name}</p>
            {isSeller && <Badge variant="outline" className="mt-1 text-xs">You</Badge>}
          </div>
        </div>

        <Separator />

        {/* Status Timeline */}
        <div className="space-y-3">
          <p className="text-sm font-medium">Transaction Timeline</p>
          <div className="space-y-2">
            <TimelineItem
              status={escrowStatus !== "none" && escrowStatus !== "awaiting_payment" ? "completed" : escrowStatus === "awaiting_payment" ? "current" : "pending"}
              label="Payment Secured"
              date={escrowData.escrowHoldAt}
              icon={<Lock className="w-4 h-4" />}
            />
            <TimelineItem
              status={deliveryStatus === "delivered" || deliveryStatus === "confirmed" ? "completed" : deliveryStatus === "shipped" ? "current" : "pending"}
              label="Item Delivered"
              date={escrowData.deliveredAt}
              icon={<Package className="w-4 h-4" />}
            />
            <TimelineItem
              status={escrowStatus === "released" ? "completed" : escrowStatus === "refunded" ? "cancelled" : "pending"}
              label={escrowStatus === "refunded" ? "Refunded" : "Payment Released"}
              date={escrowStatus === "refunded" ? escrowData.refundedAt : escrowData.releasedAt}
              icon={escrowStatus === "refunded" ? <XCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
            />
          </div>
        </div>

        {/* Dispute Warning */}
        {escrowData.dispute?.isOpen && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5" />
              <div>
                <p className="font-medium text-red-700">Dispute Opened</p>
                <p className="text-sm text-red-600 mt-1">{escrowData.dispute.reason}</p>
                <p className="text-xs text-red-500 mt-1">
                  Opened {formatDistanceToNow(new Date(escrowData.dispute.openedAt))} ago
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2">
          {isSeller && escrowStatus === "payment_secured" && deliveryStatus === "pending" && (
            <Button
              onClick={handleMarkDelivered}
              disabled={actionLoading}
              className="flex-1"
            >
              <Truck className="w-4 h-4 mr-2" />
              {actionLoading ? "Processing..." : "Mark as Delivered"}
            </Button>
          )}

          {isWinner && deliveryStatus === "delivered" && escrowStatus !== "released" && (
            <Button
              onClick={handleConfirmDelivery}
              disabled={actionLoading}
              variant="outline"
              className="flex-1"
            >
              <CheckCircle2 className="w-4 h-4 mr-2" />
              {actionLoading ? "Processing..." : "Confirm Delivery"}
            </Button>
          )}

          {(isWinner || isSeller) && 
           escrowStatus !== "released" && 
           escrowStatus !== "refunded" &&
           escrowStatus !== "payment_failed" &&
           !escrowData.dispute?.isOpen && (
            <Button
              onClick={handleOpenDispute}
              disabled={actionLoading}
              variant="destructive"
              className="flex-1"
            >
              <AlertTriangle className="w-4 h-4 mr-2" />
              Open Dispute
            </Button>
          )}
        </div>

        {/* Info Message */}
        <div className="text-xs text-muted-foreground bg-muted/30 p-3 rounded-lg">
          <div className="flex items-start gap-2">
            <Shield className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <p>
              {escrowStatus === "payment_secured" && "Your payment is safely held in escrow. The seller will deliver your item."}
              {escrowStatus === "delivered" && isWinner && "The seller has marked the item as delivered. Please confirm receipt."}
              {escrowStatus === "delivered" && isSeller && "Waiting for buyer to confirm delivery before payment is released."}
              {escrowStatus === "released" && "The transaction is complete. Payment has been released to the seller."}
              {escrowStatus === "refunded" && "The payment has been refunded to your wallet."}
              {escrowStatus === "awaiting_payment" && "Waiting for payment to be secured in escrow."}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Timeline Item Component
interface TimelineItemProps {
  status: "completed" | "current" | "pending" | "cancelled";
  label: string;
  date: string | null;
  icon: React.ReactNode;
}

function TimelineItem({ status, label, date, icon }: TimelineItemProps) {
  const statusStyles = {
    completed: "bg-green-100 text-green-700 border-green-200",
    current: "bg-blue-100 text-blue-700 border-blue-200 ring-2 ring-blue-200",
    pending: "bg-gray-100 text-gray-400 border-gray-200",
    cancelled: "bg-red-100 text-red-700 border-red-200",
  };

  return (
    <div className="flex items-center gap-3">
      <div className={`p-2 rounded-full border ${statusStyles[status]}`}>
        {icon}
      </div>
      <div className="flex-1">
        <p className={`text-sm font-medium ${status === "pending" ? "text-gray-400" : "text-foreground"}`}>
          {label}
        </p>
        {date && (
          <p className="text-xs text-muted-foreground">
            {format(new Date(date), "MMM d, yyyy h:mm a")}
          </p>
        )}
      </div>
      {status === "completed" && <CheckCircle2 className="w-4 h-4 text-green-500" />}
      {status === "cancelled" && <XCircle className="w-4 h-4 text-red-500" />}
    </div>
  );
}
