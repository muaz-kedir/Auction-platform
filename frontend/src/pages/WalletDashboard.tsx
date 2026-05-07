import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Badge } from "../components/ui/badge";
import { Alert, AlertDescription } from "../components/ui/alert";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "../components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../components/ui/tooltip";
import { Separator } from "../components/ui/separator";
import { ScrollArea } from "../components/ui/scroll-area";
import {
  Loader2,
  Wallet as WalletIcon,
  DollarSign,
  ArrowRightLeft,
  Plus,
  ArrowDownLeft,
  ArrowUpRight,
  History,
  Info,
  CreditCard,
  Smartphone,
  Building2,
  CheckCircle2,
  AlertCircle,
  Clock,
  TrendingUp,
  TrendingDown,
  Lock,
  Unlock,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import { api } from "../services/api";
import { useAuth } from "../hooks/useAuth";

// Types
interface WalletInfo {
  balance: number;
  heldBalance: number;
  available: number;
}

interface WalletData {
  primaryWallet: WalletInfo;
  secondaryWallet: WalletInfo;
  totalBalance: number;
  totalHeldBalance: number;
  totalAvailableBalance: number;
  walletVerified: boolean;
  maxBiddingAmount: number | null;
  fundingStatus: string;
}

interface Transaction {
  _id: string;
  amount: number;
  type: string;
  walletType: string | null;
  fromWalletType: string | null;
  toWalletType: string | null;
  paymentMethod: string | null;
  status: string;
  description: string;
  createdAt: string;
  auctionId?: { title: string; images: string[] } | null;
  reference?: string;
}

// Add Funds Modal Component - Chapa Integration
function AddFundsModal({
  isOpen,
  onClose,
  onSuccess,
  walletData,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  walletData: WalletData | null;
}) {
  const [amount, setAmount] = useState("");
  const [phone, setPhone] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    const numAmount = parseFloat(amount);
    if (!numAmount || numAmount < 10) {
      toast.error("Minimum deposit amount is 10 ETB");
      return;
    }

    try {
      setIsSubmitting(true);
      
      // Initialize Chapa payment
      const returnUrl = `${window.location.origin}/payment/success`;
      const response = await api.payments.initialize({
        amount: numAmount,
        phone: phone || undefined,
        returnUrl,
      });
      
      // Store transaction reference
      sessionStorage.setItem("pending_payment_tx_ref", response.tx_ref);
      sessionStorage.setItem("pending_payment_amount", String(numAmount));
      
      toast.success("Redirecting to payment gateway...");
      
      // Redirect to Chapa checkout
      if (response.checkout_url) {
        window.location.href = response.checkout_url;
      } else {
        throw new Error("No checkout URL received");
      }
      setAmount("");
      onSuccess();
      onClose();
    } catch (error: any) {
      toast.error(error.message || "Failed to add funds");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5 text-primary" />
            Add Funds via Chapa
          </DialogTitle>
          <DialogDescription>
            Deposit money into your wallet using Chapa payment gateway
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Amount Input */}
          <div className="space-y-2">
            <Label htmlFor="amount">Amount (ETB)</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">
                ETB
              </span>
              <Input
                id="amount"
                type="number"
                placeholder="Minimum 10"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="pl-12"
                disabled={isSubmitting}
                min={10}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Minimum deposit: 10 ETB
            </p>
          </div>

          {/* Phone Number (Optional) */}
          <div className="space-y-2">
            <Label htmlFor="phone" className="flex items-center gap-2">
              <Smartphone className="h-4 w-4" />
              Phone Number (Optional)
            </Label>
            <Input
              id="phone"
              type="tel"
              placeholder="e.g., 0912345678"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              disabled={isSubmitting}
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
                disabled={isSubmitting}
                className={amount === String(quickAmount) ? "border-primary" : ""}
              >
                {quickAmount.toLocaleString()}
              </Button>
            ))}
          </div>

          {/* Security Note */}
          <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-100 rounded-lg">
            <AlertCircle className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-blue-700">
              Your payment is securely processed by Chapa. Funds will be added to your wallet after successful verification.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={isSubmitting || !amount || parseFloat(amount) < 10}
            className="bg-green-600 hover:bg-green-700"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <CreditCard className="h-4 w-4 mr-2" />
                Pay {amount ? `${parseFloat(amount).toLocaleString()} ETB` : ""}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Transfer Modal Component
function TransferModal({
  isOpen,
  onClose,
  onSuccess,
  walletData,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  walletData: WalletData | null;
}) {
  const [amount, setAmount] = useState("");
  const [fromWallet, setFromWallet] = useState<"primary" | "secondary">("primary");
  const [toWallet, setToWallet] = useState<"primary" | "secondary">("secondary");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const availableFrom = fromWallet === "primary"
    ? walletData?.primaryWallet?.available || 0
    : walletData?.secondaryWallet?.available || 0;

  const handleSwap = () => {
    setFromWallet(toWallet);
    setToWallet(fromWallet);
  };

  const handleSubmit = async () => {
    const numAmount = parseFloat(amount);
    if (!numAmount || numAmount <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    if (numAmount > availableFrom) {
      toast.error(`Insufficient available balance in ${fromWallet} wallet`);
      return;
    }

    try {
      setIsSubmitting(true);
      await api.wallet.transfer(numAmount, fromWallet, toWallet);
      toast.success("Transfer completed successfully");
      setAmount("");
      onSuccess();
      onClose();
    } catch (error: any) {
      toast.error(error.message || "Failed to transfer funds");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Auto-adjust when wallets are the same
  if (fromWallet === toWallet) {
    setToWallet(fromWallet === "primary" ? "secondary" : "primary");
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowRightLeft className="h-5 w-5 text-primary" />
            Transfer Funds
          </DialogTitle>
          <DialogDescription>
            Move money between your wallets
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* From Wallet */}
          <div className="space-y-2">
            <Label>From Wallet</Label>
            <Select value={fromWallet} onValueChange={(v: string) => setFromWallet(v as "primary" | "secondary")}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="primary">
                  <div className="flex items-center gap-2">
                    <WalletIcon className="h-4 w-4 text-primary" />
                    Primary Wallet
                    <span className="text-muted-foreground">
                      (${walletData?.primaryWallet?.available?.toLocaleString() || 0} available)
                    </span>
                  </div>
                </SelectItem>
                <SelectItem value="secondary">
                  <div className="flex items-center gap-2">
                    <WalletIcon className="h-4 w-4 text-secondary" />
                    Secondary Wallet
                    <span className="text-muted-foreground">
                      (${walletData?.secondaryWallet?.available?.toLocaleString() || 0} available)
                    </span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Swap Button */}
          <div className="flex justify-center">
            <Button variant="ghost" size="sm" onClick={handleSwap} className="rounded-full">
              <ArrowRightLeft className="h-4 w-4" />
            </Button>
          </div>

          {/* To Wallet */}
          <div className="space-y-2">
            <Label>To Wallet</Label>
            <Select value={toWallet} onValueChange={(v: string) => setToWallet(v as "primary" | "secondary")}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="primary">
                  <div className="flex items-center gap-2">
                    <WalletIcon className="h-4 w-4 text-primary" />
                    Primary Wallet
                  </div>
                </SelectItem>
                <SelectItem value="secondary">
                  <div className="flex items-center gap-2">
                    <WalletIcon className="h-4 w-4 text-secondary" />
                    Secondary Wallet
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Amount */}
          <div className="space-y-2">
            <Label htmlFor="transfer-amount">Amount ($)</Label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="transfer-amount"
                type="number"
                placeholder="Enter amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="pl-9"
                disabled={isSubmitting}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Available: ${availableFrom.toLocaleString()}
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting || !amount}>
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <ArrowRightLeft className="h-4 w-4 mr-2" />
                Transfer
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Transaction History Component
function TransactionHistory({ transactions, loading }: { transactions: Transaction[]; loading: boolean }) {
  const getTransactionIcon = (type: string) => {
    switch (type) {
      case "wallet_deposit":
        return <ArrowDownLeft className="h-4 w-4 text-green-500" />;
      case "wallet_withdraw":
        return <ArrowUpRight className="h-4 w-4 text-red-500" />;
      case "wallet_transfer":
        return <ArrowRightLeft className="h-4 w-4 text-blue-500" />;
      case "bid_placement":
        return <Lock className="h-4 w-4 text-orange-500" />;
      case "bid_return":
      case "refund":
        return <Unlock className="h-4 w-4 text-green-500" />;
      case "payment":
        return <DollarSign className="h-4 w-4 text-purple-500" />;
      default:
        return <History className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getTransactionColor = (type: string) => {
    switch (type) {
      case "wallet_deposit":
      case "bid_return":
      case "refund":
        return "text-green-600";
      case "wallet_withdraw":
      case "bid_placement":
      case "payment":
        return "text-red-600";
      case "wallet_transfer":
        return "text-blue-600";
      default:
        return "text-muted-foreground";
    }
  };

  const formatAmount = (type: string, amount: number) => {
    const prefix = ["wallet_deposit", "bid_return", "refund"].includes(type) ? "+" : "-";
    return `${prefix}$${amount.toLocaleString()}`;
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <History className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p>No transactions yet</p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-[400px]">
      <div className="space-y-3">
        {transactions.map((tx) => (
          <div
            key={tx._id}
            className="flex items-center justify-between p-3 rounded-lg border border-border/50 hover:bg-muted/50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-muted">
                {getTransactionIcon(tx.type)}
              </div>
              <div>
                <p className="font-medium text-sm">{tx.description}</p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>{new Date(tx.createdAt).toLocaleDateString()}</span>
                  {tx.walletType && (
                    <>
                      <span>•</span>
                      <Badge variant="outline" className="text-xs capitalize">
                        {tx.walletType}
                      </Badge>
                    </>
                  )}
                  {tx.fromWalletType && tx.toWalletType && (
                    <>
                      <span>•</span>
                      <span className="capitalize">{tx.fromWalletType} → {tx.toWalletType}</span>
                    </>
                  )}
                </div>
              </div>
            </div>
            <span className={`font-semibold ${getTransactionColor(tx.type)}`}>
              {formatAmount(tx.type, tx.amount)}
            </span>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}

// Main Wallet Dashboard Component
export function WalletDashboard() {
  const { user } = useAuth();
  const [walletData, setWalletData] = useState<WalletData | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [transactionsLoading, setTransactionsLoading] = useState(true);

  // Modal states
  const [addFundsOpen, setAddFundsOpen] = useState(false);
  const [transferOpen, setTransferOpen] = useState(false);

  const isBuyer = user?.role === "buyer";

  const fetchWalletData = async () => {
    try {
      setLoading(true);
      const data = await api.wallet.getSummary();
      setWalletData({
        primaryWallet: data.primaryWallet,
        secondaryWallet: data.secondaryWallet,
        totalBalance: data.totalBalance,
        totalHeldBalance: data.totalHeld,
        totalAvailableBalance: data.totalAvailable,
        walletVerified: data.walletVerified,
        maxBiddingAmount: data.maxBiddingAmount,
        fundingStatus: data.fundingStatus,
      });
    } catch (error: any) {
      toast.error(error.message || "Failed to load wallet data");
    } finally {
      setLoading(false);
    }
  };

  const fetchTransactions = async () => {
    try {
      setTransactionsLoading(true);
      const data = await api.wallet.getTransactions();
      setTransactions(data.transactions || []);
    } catch (error: any) {
      toast.error(error.message || "Failed to load transactions");
    } finally {
      setTransactionsLoading(false);
    }
  };

  useEffect(() => {
    fetchWalletData();
    fetchTransactions();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold mb-2">My Wallets</h1>
          <p className="text-muted-foreground">
            Manage your funds across multiple wallets for flexible bidding
          </p>
        </div>

        {/* Wallet Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Primary Wallet Card */}
          <Card className="relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <WalletIcon className="h-24 w-24 text-primary" />
            </div>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <WalletIcon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Primary Wallet</CardTitle>
                    <CardDescription>Main usable balance</CardDescription>
                  </div>
                </div>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Held balance is money reserved for active bids</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Available Balance */}
              <div>
                <p className="text-sm text-muted-foreground">Available Balance</p>
                <p className="text-3xl font-bold">
                  ${walletData?.primaryWallet?.available?.toLocaleString() || 0}
                </p>
              </div>

              {/* Held Balance */}
              <div className="flex items-center gap-2 text-sm">
                <Lock className="h-4 w-4 text-orange-500" />
                <span className="text-muted-foreground">Held for bids:</span>
                <span className="font-medium">
                  ${walletData?.primaryWallet?.heldBalance?.toLocaleString() || 0}
                </span>
              </div>

              {/* Progress Bar */}
              <div className="space-y-1">
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all"
                    style={{
                      width: `${(walletData?.primaryWallet?.balance || 0) > 0
                        ? ((walletData?.primaryWallet?.heldBalance || 0) / (walletData?.primaryWallet?.balance || 1)) * 100
                        : 0}%`
                    }}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Total: ${walletData?.primaryWallet?.balance?.toLocaleString() || 0}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setAddFundsOpen(true);
                  }}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Funds
                </Button>
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setTransferOpen(true)}
                >
                  <ArrowRightLeft className="h-4 w-4 mr-2" />
                  Transfer
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Secondary Wallet Card */}
          <Card className="relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <WalletIcon className="h-24 w-24 text-secondary" />
            </div>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-secondary/10">
                    <WalletIcon className="h-5 w-5 text-secondary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Secondary Wallet</CardTitle>
                    <CardDescription>Additional or reserved funds</CardDescription>
                  </div>
                </div>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Held balance is money reserved for active bids</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Available Balance */}
              <div>
                <p className="text-sm text-muted-foreground">Available Balance</p>
                <p className="text-3xl font-bold">
                  ${walletData?.secondaryWallet?.available?.toLocaleString() || 0}
                </p>
              </div>

              {/* Held Balance */}
              <div className="flex items-center gap-2 text-sm">
                <Lock className="h-4 w-4 text-orange-500" />
                <span className="text-muted-foreground">Held for bids:</span>
                <span className="font-medium">
                  ${walletData?.secondaryWallet?.heldBalance?.toLocaleString() || 0}
                </span>
              </div>

              {/* Progress Bar */}
              <div className="space-y-1">
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full bg-secondary transition-all"
                    style={{
                      width: `${(walletData?.secondaryWallet?.balance || 0) > 0
                        ? ((walletData?.secondaryWallet?.heldBalance || 0) / (walletData?.secondaryWallet?.balance || 1)) * 100
                        : 0}%`
                    }}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Total: ${walletData?.secondaryWallet?.balance?.toLocaleString() || 0}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setAddFundsOpen(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Funds
                </Button>
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setTransferOpen(true)}
                >
                  <ArrowRightLeft className="h-4 w-4 mr-2" />
                  Transfer
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Total Balance</p>
              <p className="text-2xl font-bold">${walletData?.totalBalance?.toLocaleString() || 0}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Total Available</p>
              <p className="text-2xl font-bold text-green-600">
                ${walletData?.totalAvailableBalance?.toLocaleString() || 0}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Held for Bids</p>
              <p className="text-2xl font-bold text-orange-500">
                ${walletData?.totalHeldBalance?.toLocaleString() || 0}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Max Bid Limit</p>
              <p className="text-2xl font-bold">
                ${walletData?.maxBiddingAmount?.toLocaleString() || "N/A"}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Transaction History */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Transaction History
            </CardTitle>
            <CardDescription>View all your wallet activities</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="all" className="w-full">
              <TabsList className="mb-4">
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="deposits">Deposits</TabsTrigger>
                <TabsTrigger value="transfers">Transfers</TabsTrigger>
                <TabsTrigger value="bids">Bids</TabsTrigger>
              </TabsList>
              <TabsContent value="all">
                <TransactionHistory transactions={transactions} loading={transactionsLoading} />
              </TabsContent>
              <TabsContent value="deposits">
                <TransactionHistory
                  transactions={transactions.filter(t => t.type === "wallet_deposit")}
                  loading={transactionsLoading}
                />
              </TabsContent>
              <TabsContent value="transfers">
                <TransactionHistory
                  transactions={transactions.filter(t => t.type === "wallet_transfer")}
                  loading={transactionsLoading}
                />
              </TabsContent>
              <TabsContent value="bids">
                <TransactionHistory
                  transactions={transactions.filter(t => ["bid_placement", "bid_return"].includes(t.type))}
                  loading={transactionsLoading}
                />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Modals */}
        <AddFundsModal
          isOpen={addFundsOpen}
          onClose={() => setAddFundsOpen(false)}
          onSuccess={() => {
            fetchWalletData();
            fetchTransactions();
          }}
          walletData={walletData}
        />

        <TransferModal
          isOpen={transferOpen}
          onClose={() => setTransferOpen(false)}
          onSuccess={() => {
            fetchWalletData();
            fetchTransactions();
          }}
          walletData={walletData}
        />
      </div>
    </TooltipProvider>
  );
}

export default WalletDashboard;
