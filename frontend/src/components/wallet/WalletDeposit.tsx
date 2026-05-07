import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Badge } from "../ui/badge";
import { toast } from "sonner";
import { api } from "../../services/api";
import {
  Wallet,
  CreditCard,
  Smartphone,
  ArrowRight,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ChevronLeft,
  History,
  RefreshCw,
} from "lucide-react";
import { useNavigate } from "react-router";
import { format } from "date-fns";

interface WalletDepositProps {
  currentBalance?: number;
  onDepositSuccess?: () => void;
}

interface PaymentHistoryItem {
  _id: string;
  tx_ref: string;
  amount: number;
  status: "pending" | "success" | "failed" | "cancelled";
  createdAt: string;
  verifiedAt?: string;
  failureReason?: string;
}

export function WalletDeposit({ currentBalance = 0, onDepositSuccess }: WalletDepositProps) {
  const navigate = useNavigate();
  const [amount, setAmount] = useState<string>("");
  const [phone, setPhone] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<"form" | "processing" | "redirecting">("form");
  const [paymentHistory, setPaymentHistory] = useState<PaymentHistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  // Minimum deposit amount in ETB
  const MIN_DEPOSIT = 10;

  // Fetch payment history on mount
  useEffect(() => {
    if (showHistory) {
      fetchPaymentHistory();
    }
  }, [showHistory]);

  const fetchPaymentHistory = async () => {
    try {
      setHistoryLoading(true);
      const response = await api.payments.getHistory({ limit: 10 });
      setPaymentHistory(response.payments || []);
    } catch (error: any) {
      console.error("Failed to fetch payment history:", error);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleInitializePayment = async () => {
    const depositAmount = Number(amount);

    // Validation
    if (!depositAmount || depositAmount < MIN_DEPOSIT) {
      toast.error(`Minimum deposit amount is ${MIN_DEPOSIT} ETB`);
      return;
    }

    try {
      setLoading(true);
      setStep("processing");

      // Get current URL for return
      const returnUrl = `${window.location.origin}/payment/success`;

      // Initialize payment
      const response = await api.payments.initialize({
        amount: depositAmount,
        phone: phone || undefined,
        returnUrl,
      });

      toast.success("Redirecting to payment gateway...");

      // Store transaction reference in session storage for retrieval after redirect
      sessionStorage.setItem("pending_payment_tx_ref", response.tx_ref);
      sessionStorage.setItem("pending_payment_amount", String(depositAmount));

      setStep("redirecting");

      // Redirect to Chapa checkout
      if (response.checkout_url) {
        window.location.href = response.checkout_url;
      } else {
        throw new Error("No checkout URL received");
      }

    } catch (error: any) {
      console.error("Payment initialization failed:", error);
      toast.error(error.message || "Failed to initialize payment");
      setStep("form");
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "success":
        return (
          <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Success
          </Badge>
        );
      case "pending":
        return (
          <Badge variant="outline" className="text-yellow-600 border-yellow-300">
            <Loader2 className="w-3 h-3 mr-1 animate-spin" />
            Pending
          </Badge>
        );
      case "failed":
        return (
          <Badge variant="destructive">
            <AlertCircle className="w-3 h-3 mr-1" />
            Failed
          </Badge>
        );
      case "cancelled":
        return (
          <Badge variant="secondary">
            <AlertCircle className="w-3 h-3 mr-1" />
            Cancelled
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Form View
  if (step === "form") {
    return (
      <Card className="w-full max-w-md mx-auto border-border/50">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <Wallet className="w-6 h-6 text-primary" />
          </div>
          <CardTitle className="text-xl">Deposit to Wallet</CardTitle>
          <CardDescription>
            Add funds to your wallet using Chapa payment gateway
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Current Balance */}
          <div className="p-4 bg-muted/50 rounded-lg text-center">
            <p className="text-sm text-muted-foreground mb-1">Current Balance</p>
            <p className="text-3xl font-bold">{currentBalance.toLocaleString()} ETB</p>
          </div>

          {/* Amount Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Deposit Amount (ETB)</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">
                ETB
              </span>
              <Input
                type="number"
                placeholder={`Minimum ${MIN_DEPOSIT}`}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="pl-12 text-lg"
                min={MIN_DEPOSIT}
                disabled={loading}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Minimum deposit: {MIN_DEPOSIT} ETB
            </p>
          </div>

          {/* Phone Input (Optional) */}
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <Smartphone className="w-4 h-4" />
              Phone Number (Optional)
            </label>
            <Input
              type="tel"
              placeholder="e.g., 0912345678"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              disabled={loading}
            />
            <p className="text-xs text-muted-foreground">
              Used for SMS notifications from Chapa
            </p>
          </div>

          {/* Quick Amount Buttons */}
          <div className="grid grid-cols-3 gap-2">
            {[100, 500, 1000, 2000, 5000, 10000].map((quickAmount) => (
              <Button
                key={quickAmount}
                variant="outline"
                size="sm"
                onClick={() => setAmount(String(quickAmount))}
                disabled={loading}
                className={amount === String(quickAmount) ? "border-primary" : ""}
              >
                {quickAmount.toLocaleString()}
              </Button>
            ))}
          </div>

          {/* Pay Button */}
          <Button
            className="w-full"
            size="lg"
            onClick={handleInitializePayment}
            disabled={loading || !amount || Number(amount) < MIN_DEPOSIT}
          >n                {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <CreditCard className="w-4 h-4 mr-2" />
                Pay {amount ? `${Number(amount).toLocaleString()} ETB` : ""}
                <ArrowRight className="w-4 h-4 ml-2" />
              </>
            )}
          </Button>

          {/* Security Note */}
          <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-100 rounded-lg">
            <AlertCircle className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-blue-700">
              Your payment is securely processed by Chapa. Funds will be added to your wallet after successful verification.
            </p>
          </div>

          {/* Payment History Toggle */}
          <Button
            variant="ghost"
            size="sm"
            className="w-full"
            onClick={() => setShowHistory(!showHistory)}
          >
            <History className="w-4 h-4 mr-2" />
            {showHistory ? "Hide" : "Show"} Payment History
          </Button>

          {/* Payment History */}
          {showHistory && (
            <div className="border rounded-lg overflow-hidden">
              <div className="bg-muted/50 p-3 flex items-center justify-between">
                <span className="font-medium text-sm">Recent Deposits</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={fetchPaymentHistory}
                  disabled={historyLoading}
                >
                  <RefreshCw className={`w-4 h-4 ${historyLoading ? "animate-spin" : ""}`} />
                </Button>
              </div>
              <div className="max-h-48 overflow-y-auto">
                {historyLoading ? (
                  <div className="p-4 text-center">
                    <Loader2 className="w-5 h-5 animate-spin mx-auto text-muted-foreground" />
                  </div>
                ) : paymentHistory.length === 0 ? (
                  <p className="p-4 text-center text-sm text-muted-foreground">
                    No payment history found
                  </p>
                ) : (
                  <div className="divide-y">
                    {paymentHistory.map((payment) => (
                      <div key={payment._id} className="p-3 flex items-center justify-between">
                        <div>
                          <p className="font-medium">{payment.amount.toLocaleString()} ETB</p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(payment.createdAt), "MMM d, yyyy h:mm a")}
                          </p>
                        </div>
                        {getStatusBadge(payment.status)}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  // Processing View
  return (
    <Card className="w-full max-w-md mx-auto border-border/50">
      <CardContent className="p-8">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
            {step === "processing" ? (
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
            ) : (
              <ArrowRight className="w-8 h-8 text-primary" />
            )}
          </div>
          <h3 className="text-lg font-semibold">
            {step === "processing" ? "Processing Payment..." : "Redirecting to Chapa..."}
          </h3>
          <p className="text-muted-foreground">
            {step === "processing"
              ? "Please wait while we initialize your payment"
              : "You will be redirected to the secure payment page"}
          </p>
          {amount && (
            <p className="text-2xl font-bold">{Number(amount).toLocaleString()} ETB</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
