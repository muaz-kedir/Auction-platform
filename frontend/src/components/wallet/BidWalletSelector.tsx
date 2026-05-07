import { useState } from "react";
import { Card } from "../ui/card";
import { Wallet, CheckCircle2, AlertCircle } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../ui/tooltip";

interface WalletInfo {
  balance: number;
  heldBalance: number;
  available: number;
}

interface BidWalletSelectorProps {
  primaryWallet: WalletInfo;
  secondaryWallet: WalletInfo;
  selectedWallet: "primary" | "secondary";
  onSelect: (wallet: "primary" | "secondary") => void;
  requiredAmount?: number;
}

export function BidWalletSelector({
  primaryWallet,
  secondaryWallet,
  selectedWallet,
  onSelect,
  requiredAmount,
}: BidWalletSelectorProps) {
  const primarySufficient = requiredAmount ? primaryWallet.available >= requiredAmount : true;
  const secondarySufficient = requiredAmount ? secondaryWallet.available >= requiredAmount : true;

  return (
    <TooltipProvider>
      <div className="space-y-2">
        <p className="text-sm font-medium">Select Wallet for Bidding</p>
        <div className="grid grid-cols-2 gap-3">
          {/* Primary Wallet Option */}
          <button
            onClick={() => onSelect("primary")}
            disabled={!primarySufficient && requiredAmount !== undefined}
            className={`relative p-3 rounded-lg border text-left transition-all ${
              selectedWallet === "primary"
                ? "border-primary bg-primary/10"
                : primarySufficient
                ? "border-border hover:border-primary/50"
                : "border-border bg-muted/50 opacity-60 cursor-not-allowed"
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <Wallet className="h-4 w-4 text-primary" />
                <span className="font-medium">Primary</span>
              </div>
              {selectedWallet === "primary" && (
                <CheckCircle2 className="h-4 w-4 text-primary" />
              )}
              {!primarySufficient && requiredAmount !== undefined && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <AlertCircle className="h-4 w-4 text-destructive" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Insufficient balance (${primaryWallet.available.toLocaleString()} available)</p>
                  </TooltipContent>
                </Tooltip>
              )}
            </div>
            <div className="mt-2">
              <p className="text-lg font-semibold">
                ${primaryWallet.available.toLocaleString()}
              </p>
              <p className="text-xs text-muted-foreground">
                {primaryWallet.heldBalance > 0 && (
                  <span>${primaryWallet.heldBalance.toLocaleString()} held</span>
                )}
              </p>
            </div>
          </button>

          {/* Secondary Wallet Option */}
          <button
            onClick={() => onSelect("secondary")}
            disabled={!secondarySufficient && requiredAmount !== undefined}
            className={`relative p-3 rounded-lg border text-left transition-all ${
              selectedWallet === "secondary"
                ? "border-secondary bg-secondary/10"
                : secondarySufficient
                ? "border-border hover:border-secondary/50"
                : "border-border bg-muted/50 opacity-60 cursor-not-allowed"
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <Wallet className="h-4 w-4 text-secondary" />
                <span className="font-medium">Secondary</span>
              </div>
              {selectedWallet === "secondary" && (
                <CheckCircle2 className="h-4 w-4 text-secondary" />
              )}
              {!secondarySufficient && requiredAmount !== undefined && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <AlertCircle className="h-4 w-4 text-destructive" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Insufficient balance (${secondaryWallet.available.toLocaleString()} available)</p>
                  </TooltipContent>
                </Tooltip>
              )}
            </div>
            <div className="mt-2">
              <p className="text-lg font-semibold">
                ${secondaryWallet.available.toLocaleString()}
              </p>
              <p className="text-xs text-muted-foreground">
                {secondaryWallet.heldBalance > 0 && (
                  <span>${secondaryWallet.heldBalance.toLocaleString()} held</span>
                )}
              </p>
            </div>
          </button>
        </div>
      </div>
    </TooltipProvider>
  );
}
