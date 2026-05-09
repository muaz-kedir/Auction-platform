import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Textarea } from "../components/ui/textarea";
import { Label } from "../components/ui/label";
import { 
  AlertCircle, 
  ArrowLeft, 
  Loader2, 
  CheckCircle2, 
  XCircle, 
  History, 
  User, 
  Gavel, 
  Wallet,
  ExternalLink,
  MessageSquare
} from "lucide-react";
import { api } from "../services/api";
import { toast } from "sonner";
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

export function AdminDisputeDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [dispute, setDispute] = useState<any>(null);
  const [resolutionDetails, setResolutionDetails] = useState("");
  
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    action: 'refund' | 'release' | 'reject' | null;
    title: string;
    description: string;
  }>({
    open: false,
    action: null,
    title: "",
    description: ""
  });

  useEffect(() => {
    if (id) {
      fetchDisputeDetails();
    }
  }, [id]);

  const fetchDisputeDetails = async () => {
    try {
      setLoading(true);
      const data = await api.disputes.getById(id!);
      setDispute(data);
      
      // Auto move to UNDER_REVIEW if OPEN
      if (data.status === "OPEN") {
        await api.disputes.updateStatus(id!, "UNDER_REVIEW");
        setDispute((prev: any) => ({ ...prev, status: "UNDER_REVIEW" }));
      }
    } catch (error) {
      console.error("Error fetching dispute:", error);
      toast.error("Failed to load dispute details");
    } finally {
      setLoading(false);
    }
  };

  const handleResolve = async () => {
    if (!confirmDialog.action) return;
    
    try {
      setActionLoading(true);
      await api.disputes.resolve(id!, confirmDialog.action, resolutionDetails);
      toast.success(`Dispute resolved: ${confirmDialog.action}`);
      fetchDisputeDetails();
      setConfirmDialog({ ...confirmDialog, open: false });
    } catch (error: any) {
      toast.error(error.message || "Failed to resolve dispute");
    } finally {
      setActionLoading(false);
    }
  };

  const openConfirm = (action: 'refund' | 'release' | 'reject') => {
    const configs = {
      refund: {
        title: "Refund Buyer?",
        description: "This will transfer the held funds from escrow back to the buyer's wallet. This action is permanent."
      },
      release: {
        title: "Release to Seller?",
        description: "This will transfer the held funds from escrow to the seller's wallet. This action is permanent."
      },
      reject: {
        title: "Reject Dispute?",
        description: "This will close the dispute as rejected. No funds will be transferred automatically."
      }
    };

    setConfirmDialog({
      open: true,
      action,
      ...configs[action]
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!dispute) {
    return (
      <div className="text-center p-12">
        <h2 className="text-xl font-bold mb-4">Dispute not found</h2>
        <Button onClick={() => navigate("/dashboard/admin")}>Back to Dashboard</Button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-4 space-y-6 pb-20">
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to List
        </Button>
        <Badge 
          className={`px-3 py-1 text-sm ${
            dispute.status === "OPEN" ? "bg-destructive" : 
            dispute.status === "UNDER_REVIEW" ? "bg-blue-500" : 
            dispute.status === "RESOLVED" ? "bg-green-500" : "bg-muted"
          }`}
        >
          {dispute.status}
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Info */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <AlertCircle className="h-5 w-5 text-destructive" />
                Dispute Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-muted-foreground">Reason</Label>
                <p className="text-lg font-semibold">{dispute.reason}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Description</Label>
                <p className="whitespace-pre-wrap bg-muted/30 p-4 rounded-lg border border-border/50 mt-1">
                  {dispute.description}
                </p>
              </div>
              <div>
                <Label className="text-muted-foreground">Opened By</Label>
                <div className="flex items-center gap-2 mt-1">
                  <User className="h-4 w-4" />
                  <span className="font-medium">{dispute.creator?.name}</span>
                  <Badge variant="outline" className="text-xs">{dispute.creator?.role}</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <Gavel className="h-5 w-5 text-primary" />
                Auction Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4">
                {dispute.auction?.images?.[0] && (
                  <img 
                    src={dispute.auction.images[0]} 
                    alt="Auction" 
                    className="w-24 h-24 object-cover rounded-lg border"
                  />
                )}
                <div className="space-y-1">
                  <h3 className="font-bold text-lg">{dispute.auction?.title}</h3>
                  <p className="text-sm text-muted-foreground line-clamp-2">{dispute.auction?.description}</p>
                  <div className="flex gap-4 mt-2">
                    <div>
                      <Label className="text-[10px] uppercase text-muted-foreground">Winning Bid</Label>
                      <p className="font-bold text-green-600">${dispute.auction?.winningBid || dispute.auction?.currentBid}</p>
                    </div>
                    <div>
                      <Label className="text-[10px] uppercase text-muted-foreground">Status</Label>
                      <p className="font-medium capitalize">{dispute.auction?.status?.toLowerCase()}</p>
                    </div>
                  </div>
                </div>
              </div>
              <Button 
                variant="link" 
                className="mt-4 p-0 h-auto text-primary"
                onClick={() => window.open(`/auction/${dispute.auction?._id}`, '_blank')}
              >
                View Auction Page <ExternalLink className="h-3 w-3 ml-1" />
              </Button>
            </CardContent>
          </Card>

          {dispute.status === "RESOLVED" && (
            <Card className="border-green-500/20 bg-green-500/5">
              <CardHeader>
                <CardTitle className="text-green-600 flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5" />
                  Resolution Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground text-xs uppercase">Action Taken</Label>
                    <p className="font-bold capitalize text-lg">{dispute.resolutionAction}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground text-xs uppercase">Resolved By</Label>
                    <p className="font-medium">{dispute.resolvedBy?.name || "System"}</p>
                  </div>
                </div>
                {dispute.resolutionDetails && (
                  <div>
                    <Label className="text-muted-foreground text-xs uppercase">Resolution Note</Label>
                    <p className="bg-white/50 dark:bg-black/20 p-3 rounded mt-1 border">{dispute.resolutionDetails}</p>
                  </div>
                )}
                <div>
                  <Label className="text-muted-foreground text-xs uppercase">Resolved Date</Label>
                  <p className="text-sm">{new Date(dispute.resolvedAt).toLocaleString()}</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column: Participants & Actions */}
        <div className="space-y-6">
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-lg">Parties Involved</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-blue-500 font-bold">BUYER</Label>
                  {dispute.creator?._id === dispute.buyer?._id && <Badge className="text-[10px]">Claimant</Badge>}
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-blue-500/5 border border-blue-500/10">
                  <div className="h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                    <User className="h-5 w-5 text-blue-500" />
                  </div>
                  <div className="overflow-hidden">
                    <p className="font-medium truncate">{dispute.buyer?.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{dispute.buyer?.email}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-orange-500 font-bold">SELLER</Label>
                  {dispute.creator?._id === dispute.seller?._id && <Badge className="text-[10px]">Claimant</Badge>}
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-orange-500/5 border border-orange-500/10">
                  <div className="h-10 w-10 rounded-full bg-orange-500/10 flex items-center justify-center">
                    <User className="h-5 w-5 text-orange-500" />
                  </div>
                  <div className="overflow-hidden">
                    <p className="font-medium truncate">{dispute.seller?.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{dispute.seller?.email}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {dispute.status !== "RESOLVED" && dispute.status !== "REJECTED" && (
            <Card className="border-primary/20 shadow-lg shadow-primary/5 sticky top-6">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Wallet className="h-5 w-5" />
                  Take Action
                </CardTitle>
                <CardDescription>Review the evidence and decide the outcome</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="resolution-details">Resolution Note (Internal/Public)</Label>
                  <Textarea 
                    id="resolution-details"
                    placeholder="Enter details about why you are taking this action..."
                    value={resolutionDetails}
                    onChange={(e) => setResolutionDetails(e.target.value)}
                  />
                </div>
                
                <div className="grid grid-cols-1 gap-2 pt-2">
                  <Button 
                    className="w-full bg-green-600 hover:bg-green-700 text-white"
                    onClick={() => openConfirm('release')}
                  >
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Release to Seller
                  </Button>
                  <Button 
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                    onClick={() => openConfirm('refund')}
                  >
                    <History className="h-4 w-4 mr-2" />
                    Refund Buyer
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full text-destructive hover:text-destructive hover:bg-destructive/5"
                    onClick={() => openConfirm('reject')}
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Reject Dispute
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Confirm Dialog */}
      <AlertDialog open={confirmDialog.open} onOpenChange={(open) => setConfirmDialog({ ...confirmDialog, open })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{confirmDialog.title}</AlertDialogTitle>
            <AlertDialogDescription>
              {confirmDialog.description}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
             <Label className="text-sm font-bold mb-2 block">Resolution Details:</Label>
             <p className="text-sm bg-muted p-2 rounded italic">"{resolutionDetails || "No details provided"}"</p>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleResolve}
              className={`${confirmDialog.action === 'reject' ? 'bg-destructive hover:bg-destructive/90' : 'bg-primary'} text-white`}
              disabled={actionLoading}
            >
              {actionLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Confirm & Resolve
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
