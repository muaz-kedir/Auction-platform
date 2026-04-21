import { useEffect, useMemo, useState } from "react";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Input } from "../components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import { Alert, AlertDescription } from "../components/ui/alert";
import { CheckCircle2, Loader2, ShieldAlert, XCircle } from "lucide-react";
import { toast } from "sonner";
import { api } from "../services/api";
import { useAuth } from "../contexts/AuthContext";

interface Approval {
  role: "super_admin" | "admin" | "seller";
  decision: "approved" | "rejected";
  maxBiddingAmount: number | null;
}

interface WalletVerificationItem {
  _id: string;
  user: { _id: string; name: string; email: string; role: string };
  fileUrl: string;
  fileName: string;
  status: "pending" | "ai_checking" | "approved" | "rejected";
  fraudStatus: "unchecked" | "clean" | "suspicious" | "unknown";
  fraudReason?: string;
  fraudScore: number | null;
  approvals: Approval[];
  suggestedMaxBiddingAmount: number | null;
  maxBiddingAmount: number | null;
}

export function WalletVerificationManagement() {
  const { user } = useAuth();
  const [items, setItems] = useState<WalletVerificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [maxBidInputs, setMaxBidInputs] = useState<Record<string, string>>({});
  const [submittingId, setSubmittingId] = useState<string | null>(null);

  const currentRole = user?.role as "super_admin" | "admin" | "seller" | undefined;

  const fetchItems = async () => {
    try {
      setLoading(true);
      const data = await api.admin.getWalletVerifications();
      setItems(data.verifications || []);
    } catch (error: any) {
      toast.error(error.message || "Failed to load verifications");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const decide = async (id: string, decision: "approved" | "rejected") => {
    try {
      setSubmittingId(id);
      const rawValue = maxBidInputs[id];
      const parsedLimit = rawValue ? Number(rawValue) : undefined;
      await api.admin.submitWalletVerificationDecision(id, {
        decision,
        maxBiddingAmount: parsedLimit && parsedLimit > 0 ? parsedLimit : undefined,
      });
      toast.success("Decision submitted");
      await fetchItems();
    } catch (error: any) {
      toast.error(error.message || "Failed to submit decision");
    } finally {
      setSubmittingId(null);
    }
  };

  const isRoleAllowed = useMemo(
    () => currentRole === "super_admin" || currentRole === "admin" || currentRole === "seller",
    [currentRole]
  );

  if (!isRoleAllowed) {
    return (
      <Card className="p-6">
        <Alert className="border-destructive/50 bg-destructive/10">
          <ShieldAlert className="h-4 w-4 text-destructive" />
          <AlertDescription>You are not authorized to access wallet verification approvals.</AlertDescription>
        </Alert>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Wallet Verification Approvals</h1>
        <p className="text-muted-foreground">Review submitted statements and apply 2-of-3 approval workflow.</p>
      </div>

      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        {loading ? (
          <div className="p-10 flex justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Buyer</TableHead>
                <TableHead>File</TableHead>
                <TableHead>AI Fraud</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Approvals</TableHead>
                <TableHead>Max Bid</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground">
                    No verification requests found
                  </TableCell>
                </TableRow>
              ) : (
                items.map((item) => {
                  const hasRoleDecision = item.approvals.some((a) => a.role === currentRole);
                  const isFinal = item.status === "approved" || item.status === "rejected";
                  const fileHref = item.fileUrl.startsWith("http")
                    ? item.fileUrl
                    : `${import.meta.env.VITE_API_URL || "http://localhost:5000"}${item.fileUrl}`;
                  return (
                    <TableRow key={item._id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{item.user?.name}</p>
                          <p className="text-xs text-muted-foreground">{item.user?.email}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <a href={fileHref} target="_blank" rel="noreferrer" className="text-primary hover:underline">
                          {item.fileName}
                        </a>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {item.fraudStatus === "suspicious" ? (
                            <Badge variant="destructive" className="gap-1 flex justify-center py-1">
                              <ShieldAlert className="h-3 w-3" />
                              ⚠️ Possible Fraud Detected
                            </Badge>
                          ) : item.fraudStatus === "clean" ? (
                            <Badge className="bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 border-emerald-500/20 gap-1 flex justify-center py-1">
                              <CheckCircle2 className="h-3 w-3" />
                              ✅ Document looks valid
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="gap-1 flex justify-center py-1 italic opacity-60">
                              Status unknown
                            </Badge>
                          )}
                          {item.fraudScore !== null && item.fraudScore !== undefined && (
                            <div className="text-xs text-center">
                              <span className={item.fraudScore > 0.5 ? "text-destructive font-semibold" : "text-muted-foreground"}>
                                Risk: {Math.round(item.fraudScore * 100)}%
                              </span>
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={item.status === "approved" ? "default" : item.status === "rejected" ? "destructive" : "outline"}>
                          {item.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {item.approvals.length === 0 ? "-" : item.approvals.map((a) => `${a.role}:${a.decision}`).join(", ")}
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          placeholder={`${item.suggestedMaxBiddingAmount || 0}`}
                          value={maxBidInputs[item._id] || ""}
                          onChange={(e) => setMaxBidInputs((prev) => ({ ...prev, [item._id]: e.target.value }))}
                          disabled={isFinal || hasRoleDecision}
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            className="gap-1"
                            disabled={isFinal || hasRoleDecision || submittingId === item._id}
                            onClick={() => decide(item._id, "approved")}
                          >
                            {submittingId === item._id ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle2 className="h-3 w-3" />}
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            className="gap-1"
                            disabled={isFinal || hasRoleDecision || submittingId === item._id}
                            onClick={() => decide(item._id, "rejected")}
                          >
                            <XCircle className="h-3 w-3" />
                            Reject
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  );
}
