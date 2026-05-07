import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { AlertCircle, ArrowRightLeft, Plus, CreditCard, Smartphone, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface InsufficientBalanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  requiredAmount: number;
  availableBalance: number;
  shortfall: number;
  selectedWallet: "primary" | "secondary";
  otherWalletBalance: number;
  onTransfer: () => void;
  onAddFunds: (amount: number, paymentMethod: string) => Promise<void>;
}

export function InsufficientBalanceModal({
  isOpen,
  onClose,
  requiredAmount,
  availableBalance,
  shortfall,
  selectedWallet,
  otherWalletBalance,
  onTransfer,
  onAddFunds,
}: InsufficientBalanceModalProps) {
  const [showAddFundsForm, setShowAddFundsForm] = useState(false);
  const [depositAmount, setDepositAmount] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<string>("card");
  const [isDepositing, setIsDepositing] = useState(false);
  const canTransferFromOther = otherWalletBalance >= shortfall;

  const handleDeposit = async () => {
    const amount = parseFloat(depositAmount);
    if (!amount || amount <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    setIsDepositing(true);
    try {
      await onAddFunds(amount, paymentMethod);
      toast.success(`$${amount.toLocaleString()} deposited successfully to your ${selectedWallet} wallet!`);
      setShowAddFundsForm(false);
      setDepositAmount("");
      onClose();
    } catch (error: any) {
      toast.error(error.message || "Failed to deposit funds");
    } finally {
      setIsDepositing(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertCircle className="h-5 w-5" />
            Insufficient Balance
          </DialogTitle>
          <DialogDescription>
            You don&apos;t have enough funds in your {selectedWallet} wallet to place this bid.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Balance Breakdown */}
          <div className="rounded-lg bg-muted p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Required Amount:</span>
              <span className="font-semibold">${requiredAmount.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Available in {selectedWallet}:</span>
              <span className="font-semibold">${availableBalance.toLocaleString()}</span>
            </div>
            <div className="border-t border-border pt-2 flex justify-between">
              <span className="text-destructive font-medium">Shortfall:</span>
              <span className="text-destructive font-bold">${shortfall.toLocaleString()}</span>
            </div>
          </div>

          {/* Options */}
          <div className="space-y-3">
            {/* Transfer Option */}
            {canTransferFromOther ? (
              <button
                onClick={onTransfer}
                className="w-full p-4 rounded-lg border border-primary/30 bg-primary/5 hover:bg-primary/10 transition-colors text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-primary/10">
                    <ArrowRightLeft className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">Transfer from Other Wallet</p>
                    <p className="text-sm text-muted-foreground">
                      You have ${otherWalletBalance.toLocaleString()} available in your{" "}
                      {selectedWallet === "primary" ? "secondary" : "primary"} wallet
                    </p>
                  </div>
                </div>
              </button>
            ) : otherWalletBalance > 0 ? (
              <div className="w-full p-4 rounded-lg border border-border bg-muted/50 text-left opacity-75">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-muted">
                    <ArrowRightLeft className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="font-medium text-muted-foreground">Transfer Not Possible</p>
                    <p className="text-sm text-muted-foreground">
                      Other wallet has ${otherWalletBalance.toLocaleString()}, but you need ${shortfall.toLocaleString()} more
                    </p>
                  </div>
                </div>
              </div>
            ) : null}

            {/* Add Funds Option */}
            {!showAddFundsForm ? (
              <button
                onClick={() => setShowAddFundsForm(true)}
                className="w-full p-4 rounded-lg border border-border hover:border-primary/50 hover:bg-muted/50 transition-colors text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-green-100">
                    <Plus className="h-5 w-5 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">Add Funds</p>
                    <p className="text-sm text-muted-foreground">
                      Deposit money into your {selectedWallet} wallet instantly
                    </p>
                  </div>
                </div>
              </button>
            ) : (
              <div className="p-4 rounded-lg border border-primary/30 bg-primary/5 space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <Plus className="h-4 w-4 text-primary" />
                  <span className="font-medium">Quick Deposit to {selectedWallet} wallet</span>
                </div>

                {/* Amount Input */}
                <div className="space-y-2">
                  <Label>Amount to Deposit</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                    <Input
                      type="number"
                      placeholder={`Min $${shortfall.toLocaleString()}`}
                      value={depositAmount}
                      onChange={(e) => setDepositAmount(e.target.value)}
                      className="pl-7"
                      min={shortfall}
                    />
                  </div>
                  <button
                    onClick={() => setDepositAmount(String(shortfall))}
                    className="text-xs text-primary hover:underline"
                  >
                    Set to required amount (${shortfall.toLocaleString()})
                  </button>
                </div>

                {/* Payment Method */}
                <div className="space-y-2">
                  <Label>Payment Method</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setPaymentMethod("card")}
                      className={`p-3 rounded-lg border flex items-center gap-2 transition-colors ${
                        paymentMethod === "card"
                          ? "border-primary bg-primary/10"
                          : "border-border hover:border-primary/50"
                      }`}
                    >
                      <CreditCard className="h-4 w-4" />
                      <span className="text-sm">Card</span>
                    </button>
                    <button
                      onClick={() => setPaymentMethod("mobile_money")}
                      className={`p-3 rounded-lg border flex items-center gap-2 transition-colors ${
                        paymentMethod === "mobile_money"
                          ? "border-primary bg-primary/10"
                          : "border-border hover:border-primary/50"
                      }`}
                    >
                      <Smartphone className="h-4 w-4" />
                      <span className="text-sm">Mobile Money</span>
                    </button>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowAddFundsForm(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleDeposit}
                    disabled={isDepositing || !depositAmount}
                    className="flex-1"
                  >
                    {isDepositing ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Processing...
                      </>
                    ) : (
                      <>Deposit Now</>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel Bid
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
