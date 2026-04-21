import { useEffect, useMemo, useState } from "react";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Badge } from "../components/ui/badge";
import { Alert, AlertDescription } from "../components/ui/alert";
import { Loader2, Upload, ShieldAlert, CheckCircle2, Clock3, Wallet as WalletIcon } from "lucide-react";
import { toast } from "sonner";
import { api } from "../services/api";
import { useAuth } from "../contexts/AuthContext";

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

export function Wallet() {
  const { user } = useAuth();
  const [verification, setVerification] = useState<WalletVerification | null>(null);
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  const isBuyer = user?.role === "buyer";

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

  useEffect(() => {
    fetchWalletState();
  }, []);

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

  const approvedCount = useMemo(
    () => verification?.approvals?.filter((a) => a.decision === "approved").length || 0,
    [verification]
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isBuyer) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Wallet</h1>
        <Card className="p-6">
          <p className="text-muted-foreground">
            Wallet verification workflow is required for buyer accounts. Your current role is `{user?.role}`.
          </p>
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
