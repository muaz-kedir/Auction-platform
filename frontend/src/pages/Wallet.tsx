import { useEffect, useMemo, useState } from "react";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Badge } from "../components/ui/badge";
import { Alert, AlertDescription } from "../components/ui/alert";
import { Loader2, Upload, ShieldAlert, CheckCircle2, Clock3, Wallet as WalletIcon, DollarSign, Users, Eye, CheckCircle2 as CheckCircleIcon, XCircle, Clock } from "lucide-react";
import { toast } from "sonner";
import { api } from "../services/api";
import { useAuth } from "../hooks/useAuth";

interface ApprovalDecision {
  role: "super_admin" | "admin" | "seller";
  decision: "approved" | "rejected";
}

interface WalletVerification {
  _id: string;
  fileUrl: string;
  fileName: string;
  status: "pending" | "ai_checking" | "approved" | "rejected";
  fraudStatus: "unchecked" | "clean" | "suspicious" | "unknown";
  fraudReason?: string;
  fraudScore: number | null;
  approvals: ApprovalDecision[];
  suggestedMaxBiddingAmount: number | null;
  maxBiddingAmount: number | null;
}

interface WalletData {
  balance: number;
  heldBalance: number;
  walletVerified?: boolean;
  maxBiddingAmount?: number | null;
}

interface Approval {
  role: "super_admin" | "admin" | "seller";
  decision: "approved" | "rejected";
  decidedBy: { name: string; email: string; role: string };
  decidedAt: string;
}

interface WalletFundingItem {
  _id: string;
  user: { _id: string; name: string; email: string; role: string };
  fundingRequest: {
    fullName: string;
    phone: string;
    email: string;
    location: string;
    walletAmount: number;
    escrowAmount: number;
  };
  fundingStatus: "not_created" | "pending" | "approved" | "rejected";
  approvals: Approval[];
  maxBiddingAmount: number | null;
  remainingBalance: number;
  totalUsedAmount: number;
}

export function Wallet() {
  const { user } = useAuth();
  const [verification, setVerification] = useState<WalletVerification | null>(null);
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [fundingItems, setFundingItems] = useState<WalletFundingItem[]>([]);
  const [fundingLoading, setFundingLoading] = useState(true);
  const [submittingId, setSubmittingId] = useState<string | null>(null);

  const isBuyer = user?.role === "buyer";
  const isAdminOrSeller = user?.role === "admin" || user?.role === "seller" || user?.role === "super_admin";

  const currentRole = user?.role as "super_admin" | "admin" | "seller" | undefined;

  const fetchWalletState = async () => {
    try {
      setLoading(true);
      const status = await api.wallet.getVerificationStatus();
      setVerification(status.verification || null);
      setWallet(status.wallet || null);
    } catch (error: any) {
      toast.error(error.message || "Failed to load wallet verification status");
    } finally {
      setLoading(false);
    }
  };

  const fetchFundingRequests = async () => {
    try {
      setFundingLoading(true);
      const data = await api.admin.getAllFundingRequests();
      setFundingItems(data.fundingRequests || []);
    } catch (error: any) {
      toast.error(error.message || "Failed to load funding requests");
    } finally {
      setFundingLoading(false);
    }
  };

  useEffect(() => {
    fetchWalletState();
    if (isAdminOrSeller) {
      fetchFundingRequests();
    }
  }, [isAdminOrSeller]);

  const handleSubmit = async () => {
    if (!file) {
      toast.error("Please choose a bank statement file");
      return;
    }

    const allowedTypes = ["application/pdf", "image/jpeg", "image/png"];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Only PDF, JPG, or PNG files are allowed");
      return;
    }

    try {
      setSubmitting(true);
      const formData = new FormData();
      formData.append("bankStatement", file);
      await api.wallet.submitVerification(formData);
      toast.success("Verification submitted successfully");
      setFile(null);
      await fetchWalletState();
    } catch (error: any) {
      toast.error(error.message || "Failed to submit verification");
    } finally {
      setSubmitting(false);
    }
  };

  const handleFundingDecision = async (userId: string, decision: "approved" | "rejected") => {
    try {
      setSubmittingId(userId);
      await api.admin.decideFundingRequest(userId, { decision });
      toast.success("Decision submitted");
      await fetchFundingRequests();
    } catch (error: any) {
      toast.error(error.message || "Failed to submit decision");
    } finally {
      setSubmittingId(null);
    }
  };

  const approvedCount = useMemo(
    () => verification?.approvals?.filter((a) => a.decision === "approved").length || 0,
    [verification]
  );

  if (loading || (isAdminOrSeller && fundingLoading)) {
    return (
      <div className="flex justify-center items-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Admin/Seller view - Wallet Funding Management
  if (isAdminOrSeller) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Wallet Funding Management</h1>
          <p className="text-muted-foreground">Review and approve wallet funding requests from buyers.</p>
        </div>

        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          {fundingLoading ? (
            <div className="p-10 flex justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border/50">
                    <th className="text-left p-4 font-semibold">Buyer</th>
                    <th className="text-left p-4 font-semibold">Request Details</th>
                    <th className="text-left p-4 font-semibold">Requested Amount</th>
                    <th className="text-left p-4 font-semibold">Status</th>
                    <th className="text-left p-4 font-semibold">Approvals</th>
                    <th className="text-right p-4 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {fundingItems.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center p-8 text-muted-foreground">
                        No funding requests found
                      </td>
                    </tr>
                  ) : (
                    fundingItems.map((item) => {
                      const hasRoleDecision = item.approvals.some((a) => a.role === currentRole);
                      const isFinal = item.fundingStatus === "approved" || item.fundingStatus === "rejected";
                      const approvedCount = item.approvals.filter(a => a.decision === "approved").length;
                      const rejectedCount = item.approvals.filter(a => a.decision === "rejected").length;

                      return (
                        <tr key={item._id} className="border-b border-border/50">
                          <td className="p-4">
                            <div>
                              <div className="flex items-center gap-2">
                                <Users className="h-4 w-4 text-muted-foreground" />
                                <p className="font-medium">{item.user?.name}</p>
                              </div>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-xs text-muted-foreground">{item.user?.email}</span>
                              </div>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant="outline" className="text-xs">{item.user?.role}</Badge>
                              </div>
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2 text-sm">
                                <span className="font-medium">Full Name:</span>
                                <span>{item.fundingRequest?.fullName}</span>
                              </div>
                              <div className="flex items-center gap-2 text-sm">
                                <span className="font-medium">Phone:</span>
                                <span>{item.fundingRequest?.phone}</span>
                              </div>
                              <div className="flex items-center gap-2 text-sm">
                                <span className="font-medium">Email:</span>
                                <span>{item.fundingRequest?.email}</span>
                              </div>
                              <div className="flex items-center gap-2 text-sm">
                                <span className="font-medium">Location:</span>
                                <span>{item.fundingRequest?.location}</span>
                              </div>
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <DollarSign className="h-4 w-4 text-primary" />
                                <span className="text-lg font-bold text-primary">
                                  ${item.fundingRequest?.walletAmount?.toLocaleString()}
                                </span>
                              </div>
                              <div className="text-xs text-muted-foreground">
                                Escrow: ${item.fundingRequest?.escrowAmount?.toLocaleString()}
                              </div>
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="space-y-1">
                              <Badge 
                                variant={
                                  item.fundingStatus === "approved" ? "default" : 
                                  item.fundingStatus === "rejected" ? "destructive" : 
                                  "outline"
                                }
                              >
                                {item.fundingStatus}
                              </Badge>
                              {item.fundingStatus === "pending" && (
                                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                  <Clock className="h-3 w-3" />
                                  <span>{approvedCount} approved, {rejectedCount} rejected</span>
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="p-4">
                            {item.approvals.length === 0 ? (
                              <span className="text-muted-foreground italic">No decisions yet</span>
                            ) : (
                              <div className="space-y-1">
                                {item.approvals.map((approval, index) => (
                                  <div key={index} className="flex items-center gap-2 text-sm">
                                    <Badge 
                                      variant={approval.decision === "approved" ? "default" : "destructive"}
                                      className="text-xs"
                                    >
                                      {approval.role}: {approval.decision}
                                    </Badge>
                                    <span className="text-xs text-muted-foreground">
                                      by {approval.decidedBy.name}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </td>
                          <td className="p-4 text-right">
                            <div className="flex justify-end gap-2">
                              {item.fundingStatus === "rejected" ? (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="gap-1"
                                  disabled={submittingId === item.user._id}
                                  onClick={() => handleFundingDecision(item.user._id, "approved")}
                                >
                                  {submittingId === item.user._id ? (
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                  ) : (
                                    <CheckCircleIcon className="h-3 w-3" />
                                  )}
                                  Re-approve
                                </Button>
                              ) : (
                                <>
                                  <Button
                                    size="sm"
                                    className="gap-1"
                                    disabled={isFinal || hasRoleDecision || submittingId === item.user._id}
                                    onClick={() => handleFundingDecision(item.user._id, "approved")}
                                  >
                                    {submittingId === item.user._id ? (
                                      <Loader2 className="h-3 w-3 animate-spin" />
                                    ) : (
                                      <CheckCircleIcon className="h-3 w-3" />
                                    )}
                                    Approve
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    className="gap-1"
                                    disabled={isFinal || hasRoleDecision || submittingId === item.user._id}
                                    onClick={() => handleFundingDecision(item.user._id, "rejected")}
                                  >
                                    <XCircle className="h-3 w-3" />
                                    Reject
                                  </Button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Wallet Verification</h1>
        <p className="text-muted-foreground">Verify your bank statement to unlock bidding access.</p>
      </div>

      <Card className="p-6 space-y-4">
        <div className="flex items-center gap-3">
          <WalletIcon className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-semibold">Verification Status</h2>
        </div>

        {!verification && (
          <Alert>
            <Clock3 className="h-4 w-4" />
            <AlertDescription>Not submitted yet. Upload a statement to start wallet verification.</AlertDescription>
          </Alert>
        )}

        {verification && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Badge variant="outline">Status: {verification.status}</Badge>
              <Badge variant={verification.fraudStatus === "suspicious" ? "destructive" : verification.fraudStatus === "clean" ? "default" : "outline"}>
                AI: {verification.fraudStatus}
              </Badge>
              <Badge variant="secondary">Approvals: {approvedCount}/3</Badge>
            </div>

            {verification.fraudStatus === "suspicious" ? (
              <Alert className="border-destructive/50 bg-destructive/10">
                <ShieldAlert className="h-4 w-4 text-destructive" />
                <AlertDescription>
                  ⚠ Possible Fraud Detected{verification.fraudReason ? `: ${verification.fraudReason}` : ""}
                  {verification.fraudScore !== null && (
                    <span className="block text-sm mt-1">
                      Risk Score: {Math.round(verification.fraudScore * 100)}%
                    </span>
                  )}
                </AlertDescription>
              </Alert>
            ) : verification.fraudStatus === "clean" ? (
              <Alert className="border-secondary/50 bg-secondary/10">
                <CheckCircle2 className="h-4 w-4 text-secondary" />
                <AlertDescription>
                  ✅ AI Verified
                  {verification.fraudScore !== null && (
                    <span className="block text-sm mt-1">
                      Risk Score: {Math.round(verification.fraudScore * 100)}%
                    </span>
                  )}
                </AlertDescription>
              </Alert>
            ) : null}

            {wallet?.walletVerified && (
              <Alert className="border-primary/50 bg-primary/10">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                <AlertDescription>
                  Wallet approved. Max bidding limit: ${Number(wallet.maxBiddingAmount || 0).toLocaleString()}
                </AlertDescription>
              </Alert>
            )}

            {!wallet?.walletVerified && (
              <p className="text-sm text-muted-foreground">Please verify your wallet first before bidding.</p>
            )}
          </div>
        )}
      </Card>

      <Card className="p-6 space-y-4">
        <h2 className="text-xl font-semibold">Upload Bank Statement</h2>
        <p className="text-sm text-muted-foreground">Accepted formats: PDF, JPG, PNG</p>
        <div className="space-y-2">
          <Label htmlFor="bankStatement">Statement File</Label>
          <Input
            id="bankStatement"
            type="file"
            accept=".pdf,.jpg,.jpeg,.png"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
          />
          {file && <p className="text-xs text-muted-foreground">Selected: {file.name}</p>}
        </div>
        <Button onClick={handleSubmit} disabled={submitting} className="gap-2">
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
          Submit for Verification
        </Button>
      </Card>
    </div>
  );
}
