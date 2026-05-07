import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { toast } from "sonner";
import { api } from "../services/api";
import {
  CheckCircle2,
  Loader2,
  Wallet,
  ArrowRight,
  AlertCircle,
  RefreshCw,
  XCircle,
  Home,
} from "lucide-react";

export function PaymentSuccess() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<"verifying" | "success" | "failed" | "pending">("verifying");
  const [paymentDetails, setPaymentDetails] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState<string>("");

  // Get tx_ref from URL query params
  const tx_ref = searchParams.get("tx_ref") || sessionStorage.getItem("pending_payment_tx_ref");
  const pendingAmount = sessionStorage.getItem("pending_payment_amount");

  useEffect(() => {
    if (tx_ref) {
      verifyPayment();
    } else {
      setStatus("failed");
      setErrorMessage("No transaction reference found");
    }
  }, [tx_ref]);

  const verifyPayment = async () => {
    try {
      setStatus("verifying");
      
      const response = await api.payments.verify(tx_ref as string);
      
      if (response.status === "success") {
        setStatus("success");
        setPaymentDetails(response);
        
        // Clear session storage
        sessionStorage.removeItem("pending_payment_tx_ref");
        sessionStorage.removeItem("pending_payment_amount");
        
        toast.success("Payment verified successfully!");
        
        // Refresh wallet balance if available
        if (response.walletBalance !== undefined) {
          // Dispatch custom event to notify other components
          window.dispatchEvent(new CustomEvent("wallet-updated", { 
            detail: { balance: response.walletBalance } 
          }));
        }
      } else if (response.status === "pending") {
        setStatus("pending");
        setPaymentDetails(response);
      } else {
        setStatus("failed");
        setErrorMessage(response.reason || response.message || "Payment verification failed");
      }
    } catch (error: any) {
      console.error("Payment verification failed:", error);
      setStatus("failed");
      setErrorMessage(error.message || "Failed to verify payment");
    }
  };

  const handleRetry = () => {
    verifyPayment();
  };

  const handleGoToWallet = () => {
    navigate("/wallet");
  };

  const handleGoHome = () => {
    navigate("/");
  };

  // Verifying State
  if (status === "verifying") {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center">
          <CardContent className="p-8">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Verifying Payment...</h2>
            <p className="text-muted-foreground">
              Please wait while we verify your transaction with Chapa
            </p>
            {tx_ref && (
              <p className="text-sm text-muted-foreground mt-4">
                Reference: <code className="bg-muted px-2 py-1 rounded">{tx_ref}</code>
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // Success State
  if (status === "success") {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-green-50 to-emerald-50">
        <Card className="w-full max-w-md border-green-200">
          <CardHeader className="text-center">
            <div className="mx-auto w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mb-4">
              <CheckCircle2 className="w-10 h-10 text-green-600" />
            </div>
            <CardTitle className="text-2xl text-green-700">Payment Successful!</CardTitle>
            <CardDescription className="text-green-600">
              Your wallet has been credited successfully
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* Amount Display */}
            <div className="p-4 bg-green-50 rounded-lg text-center">
              <p className="text-sm text-green-600 mb-1">Amount Added</p>
              <p className="text-4xl font-bold text-green-700">
                {paymentDetails?.amount?.toLocaleString() || Number(pendingAmount)?.toLocaleString() || "0"} ETB
              </p>
            </div>

            {/* Transaction Details */}
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Transaction Reference</span>
                <code className="bg-muted px-2 py-1 rounded text-xs">{tx_ref}</code>
              </div>
              {paymentDetails?.walletBalance !== undefined && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">New Balance</span>
                  <span className="font-medium">{paymentDetails.walletBalance.toLocaleString()} ETB</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status</span>
                <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  Completed
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Payment Method</span>
                <span className="font-medium">Chapa</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2 pt-4">
              <Button className="w-full" size="lg" onClick={handleGoToWallet}>
                <Wallet className="w-4 h-4 mr-2" />
                View Wallet
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
              <Button variant="outline" className="w-full" onClick={handleGoHome}>
                <Home className="w-4 h-4 mr-2" />
                Go to Home
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Failed State
  if (status === "failed") {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-red-50 to-orange-50">
        <Card className="w-full max-w-md border-red-200">
          <CardHeader className="text-center">
            <div className="mx-auto w-20 h-20 rounded-full bg-red-100 flex items-center justify-center mb-4">
              <XCircle className="w-10 h-10 text-red-600" />
            </div>
            <CardTitle className="text-2xl text-red-700">Payment Failed</CardTitle>
            <CardDescription className="text-red-600">
              We couldn&apos;t verify your payment
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* Error Message */}
            <div className="p-4 bg-red-50 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-red-700">Error</p>
                  <p className="text-sm text-red-600">{errorMessage}</p>
                </div>
              </div>
            </div>

            {tx_ref && (
              <p className="text-sm text-muted-foreground text-center">
                Reference: <code className="bg-muted px-2 py-1 rounded">{tx_ref}</code>
              </p>
            )}

            {/* Action Buttons */}
            <div className="space-y-2 pt-4">
              <Button className="w-full" size="lg" onClick={handleRetry} variant="outline">
                <RefreshCw className="w-4 h-4 mr-2" />
                Try Again
              </Button>
              <Button className="w-full" onClick={handleGoToWallet} variant="default">
                <Wallet className="w-4 h-4 mr-2" />
                Go to Wallet
              </Button>
              <Button variant="ghost" className="w-full" onClick={handleGoHome}>
                <Home className="w-4 h-4 mr-2" />
                Go to Home
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Pending State
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-yellow-50 to-amber-50">
      <Card className="w-full max-w-md border-yellow-200">
        <CardHeader className="text-center">
          <div className="mx-auto w-20 h-20 rounded-full bg-yellow-100 flex items-center justify-center mb-4">
            <Loader2 className="w-10 h-10 text-yellow-600 animate-spin" />
          </div>
          <CardTitle className="text-2xl text-yellow-700">Payment Pending</CardTitle>
          <CardDescription className="text-yellow-600">
            Your payment is still being processed
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="p-4 bg-yellow-50 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-yellow-700">Please Wait</p>
                <p className="text-sm text-yellow-600">
                  This may take a few minutes. You can check your wallet later to see if the payment was successful.
                </p>
              </div>
            </div>
          </div>

          {tx_ref && (
            <p className="text-sm text-muted-foreground text-center">
              Reference: <code className="bg-muted px-2 py-1 rounded">{tx_ref}</code>
            </p>
          )}

          {/* Action Buttons */}
          <div className="space-y-2 pt-4">
            <Button className="w-full" size="lg" onClick={handleRetry} variant="outline">
              <RefreshCw className="w-4 h-4 mr-2" />
              Check Status Again
            </Button>
            <Button className="w-full" onClick={handleGoToWallet} variant="default">
              <Wallet className="w-4 h-4 mr-2" />
              Go to Wallet
            </Button>
            <Button variant="ghost" className="w-full" onClick={handleGoHome}>
              <Home className="w-4 h-4 mr-2" />
              Go to Home
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
