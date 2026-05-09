import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Card } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Label } from "../components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Separator } from "../components/ui/separator";
import { CountdownTimer } from "../components/auction/CountdownTimer";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import { RecentActivity } from "../components/auction/RecentActivity";
import { WinnerCelebration } from "../components/celebration/WinnerCelebration";
import { EscrowStatus } from "../components/escrow";
import { BidWalletSelector } from "../components/wallet/BidWalletSelector";
import { InsufficientBalanceModal } from "../components/wallet/InsufficientBalanceModal";
import { useAuctionSocket, useSocket } from "../hooks/useSocket";
import {
  Heart,
  Share2,
  TrendingUp,
  Shield,
  Package,
  MapPin,
  Users,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  Gavel,
  Loader2,
  ArrowLeft,
  Upload,
  DollarSign,
  Wallet,
  Clock,
  XCircle,
  CreditCard,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import { api } from "../services/api";
import { useAuth } from "../hooks/useAuth";
import { getImageUrl } from "../utils/imageUtils";

interface Auction {
  _id: string;
  title: string;
  description: string;
  images: string[];
  currentBid: number;
  startingBid: number;
  endTime: string;
  status: string;
  seller: {
    _id: string;
    name: string;
    email: string;
    profileImage?: string;
  };
  category?: {
    _id: string;
    name: string;
  };
  createdAt: string;
}

type WalletStatus = "not_submitted" | "pending" | "approved" | "rejected";
type FundingStatus = "not_created" | "pending" | "approved" | "rejected";

interface FundingFormData {
  fullName: string;
  phone: string;
  email: string;
  location: string;
  walletAmount: string;
}

export function AuctionDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [auction, setAuction] = useState<Auction | null>(null);
  const [loadingAuction, setLoadingAuction] = useState(true);
  const [loadingWallet, setLoadingWallet] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [bidAmount, setBidAmount] = useState("");
  const [isFavorite, setIsFavorite] = useState(false);
  const [placingBid, setPlacingBid] = useState(false);
  const [walletStatus, setWalletStatus] = useState<WalletStatus>("not_submitted");
  const [fundingStatus, setFundingStatus] = useState<FundingStatus>("not_created");
  const [statementFile, setStatementFile] = useState<File | null>(null);
  const [submittingVerification, setSubmittingVerification] = useState(false);
  const { user, isLoading: authLoading } = useAuth();
  const isBuyer = user?.role === "buyer";

  // Wallet funding form state
  const [fundingForm, setFundingForm] = useState<FundingFormData>({
    fullName: "",
    phone: "",
    email: user?.email || "",
    location: "",
    walletAmount: "",
  });
  const [submittingFunding, setSubmittingFunding] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"manual" | "chapa">("manual");
  const [chapaProcessing, setChapaProcessing] = useState(false);

  // Wallet balance info - Multi-wallet support
  const [walletInfo, setWalletInfo] = useState({
    maxBiddingAmount: 0,
    remainingBalance: 0,
    totalUsedAmount: 0,
    primaryBalance: 0,
    secondaryBalance: 0,
    primaryHeld: 0,
    secondaryHeld: 0,
  });

  // Selected wallet for bidding
  const [selectedBidWallet, setSelectedBidWallet] = useState<"primary" | "secondary">("primary");

  // Insufficient balance modal state
  const [showInsufficientBalance, setShowInsufficientBalance] = useState(false);
  const [insufficientBalanceInfo, setInsufficientBalanceInfo] = useState({
    requiredAmount: 0,
    availableBalance: 0,
    shortfall: 0,
  });

  // Transfer modal state for quick transfer
  const [showQuickTransfer, setShowQuickTransfer] = useState(false);
  const [transferAmount, setTransferAmount] = useState("");

  // Real-time bidding state
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  
  // Winner celebration state
  const [winnerInfo, setWinnerInfo] = useState<{
    winnerId: string;
    winnerName: string;
    winningBid: number;
  } | null>(null);
  const [showWinnerCelebration, setShowWinnerCelebration] = useState(false);
  const [isCurrentUserWinner, setIsCurrentUserWinner] = useState(false);
  
  // Use refs to avoid recreating callback
  const auctionRef = useRef(auction);
  const userRef = useRef(user);
  
  useEffect(() => {
    auctionRef.current = auction;
    userRef.current = user;
  }, [auction, user]);

  useEffect(() => {
    let mounted = true;
    const initializePage = async () => {
      if (!id) {
        if (mounted) setLoadingWallet(false);
        return;
      }

      // Wait for auth to finish loading
      if (authLoading) {
        return;
      }

      // Auth is done, now handle based on user type
      if (!isBuyer) {
        // Not a buyer (seller/admin) - just load auction
        if (mounted) setLoadingWallet(false);
        await fetchAuction();
        return;
      }

      // User is a buyer
      if (user) {
        // Logged in buyer - load auction AND check wallet status in parallel
        // This prevents slow loading when wallet checks take time
        await Promise.all([
          fetchAuction(),
          fetchWalletStatus()
        ]);
      } else {
        // Not logged in - just load auction
        if (mounted) setLoadingWallet(false);
        await fetchAuction();
      }
    };

    initializePage();

    return () => {
      mounted = false;
    };
  }, [id, isBuyer, user, authLoading]);

  useEffect(() => {
    if (!isBuyer || fundingStatus !== "pending") return;

    const interval = setInterval(() => {
      fetchFundingStatus(false);
    }, 7000);

    return () => clearInterval(interval);
  }, [isBuyer, fundingStatus]);

  // Check for winner when auction status changes to ENDED
  useEffect(() => {
    if (auction?.status === "ENDED") {
      checkWinnerStatus();
    }
  }, [auction?.status, auction?._id]);

  // Real-time socket handler for bid updates
  const handleBidUpdate = useCallback((data: any) => {
    console.log('📥 Bid update received:', data);
    console.log('📥 Current auction:', auctionRef.current?._id);
    console.log('📥 Data auctionId:', data.auctionId);
    console.log('📥 Current user from ref:', userRef.current?._id);
    console.log('📥 Bidder ID:', data.bidder?._id);

    const currentAuction = auctionRef.current;
    // Get user from localStorage as fallback to ensure we have the correct user
    const storedUser = localStorage.getItem('user');
    const parsedUser = storedUser ? JSON.parse(storedUser) : null;
    // Prefer ref but fallback to localStorage
    const currentUser = userRef.current || parsedUser;

    console.log('📥 Current user (with fallback):', currentUser?._id);

    if (currentAuction && data.auctionId === currentAuction._id) {
      console.log('✅ Auction ID matches - processing update');

      // Update current bid
      setAuction(prev => prev ? { ...prev, currentBid: data.currentBid } : null);

      // Add to recent activity
      if (data.activity) {
        // Convert IDs to strings for comparison (handles ObjectId vs string mismatch)
        const bidderId = String(data.bidder?._id || '');
        const currentUserId = String(currentUser?._id || '');
        const isOwnBid = bidderId === currentUserId && bidderId !== '' && currentUserId !== '';
        console.log('🎯 Bidder ID (string):', bidderId);
        console.log('🎯 Current User ID (string):', currentUserId);
        console.log('🎯 Is own bid:', isOwnBid);

        // Check if current user was outbid
        const wasOutbid = data.previousBidder && currentUser?.name === data.previousBidder;
        console.log('🎯 Was outbid:', wasOutbid);

        // Determine activity type and message
        let activityType: 'bid' | 'outbid' = 'bid';
        let activityMessage: string;

        if (isOwnBid) {
          if (data.previousBidder && data.previousBidder !== currentUser?.name) {
            activityType = 'outbid';
            activityMessage = `You outbid ${data.previousBidder}`;
          } else {
            activityMessage = 'You placed a bid';
          }
        } else {
          if (wasOutbid) {
            activityType = 'outbid';
            activityMessage = `${data.activity.bidderName} outbid you`;
          } else if (data.previousBidder) {
            activityType = 'outbid';
            activityMessage = `${data.activity.bidderName} outbid ${data.previousBidder}`;
          } else {
            activityMessage = `${data.activity.bidderName} placed a bid`;
          }
        }

        const newActivity = {
          id: `${data.auctionId}-${Date.now()}`,
          type: activityType,
          message: activityMessage,
          amount: data.activity.amount,
          time: data.activity.time,
          bidderName: data.activity.bidderName,
          isOwn: isOwnBid,
          isNew: true
        };

        console.log('📝 Adding activity:', newActivity);

        setRecentActivity(prev => {
          console.log('📝 Previous activities:', prev);

          // Check for duplicate - same bidder and similar amount/time (within 5 seconds)
          const isDuplicate = prev.some(a =>
            a.bidderName === newActivity.bidderName &&
            a.amount === newActivity.amount &&
            Math.abs(new Date(a.time).getTime() - new Date(newActivity.time).getTime()) < 5000
          );

          if (isDuplicate) {
            console.log('📝 Duplicate activity detected, skipping');
            // Just mark existing as not new, don't add duplicate
            return prev.map(a => ({ ...a, isNew: false }));
          }

          // Check for optimistic update to replace (same user, similar amount, marked as own)
          const hasOptimistic = prev.some(a =>
            a.isOwn &&
            a.amount === newActivity.amount &&
            Math.abs(new Date(a.time).getTime() - new Date(newActivity.time).getTime()) < 5000
          );

          if (hasOptimistic) {
            console.log('📝 Replacing optimistic update with confirmed');
            // Replace the optimistic activity with the confirmed one
            return prev.map(a =>
              (a.isOwn && a.amount === newActivity.amount &&
               Math.abs(new Date(a.time).getTime() - new Date(newActivity.time).getTime()) < 5000)
                ? { ...newActivity, isNew: false }
                : { ...a, isNew: false }
            ).slice(0, 10);
          }

          // Add new activity at the top
          const updated = prev.map(a => ({ ...a, isNew: false }));
          const result = [newActivity, ...updated].slice(0, 10);
          console.log('📝 New activities:', result);
          return result;
        });

        // Notification for other users
        if (!isOwnBid) {
          if (wasOutbid) {
            toast.warning(`${data.bidder.name} outbid you with $${data.currentBid.toLocaleString()}!`);
          } else {
            toast.info(`${data.bidder.name} placed a bid of $${data.currentBid.toLocaleString()}`);
          }
        }
      }
    } else {
      console.log('❌ Auction ID mismatch - ignoring update');
    }
  }, []); // No dependencies - uses refs instead

  // Real-time socket handler for winner announcements
  const handleWinnerAnnouncement = useCallback((data: any) => {
    console.log('🏆 Winner announcement received:', data);
    
    const currentAuction = auctionRef.current;
    const currentUser = userRef.current;
    
    if (currentAuction && data.auctionId === currentAuction._id) {
      console.log('✅ Winner announcement matches current auction');
      
      // Update auction status
      setAuction(prev => prev ? { ...prev, status: "ENDED" } : null);
      
      // Set winner info
      setWinnerInfo({
        winnerId: data.winnerId,
        winnerName: data.winnerName,
        winningBid: data.winningBid,
      });
      
      // Check if current user is the winner
      const currentUserId = currentUser?._id;
      const isWinner = currentUserId === data.winnerId;
      setIsCurrentUserWinner(isWinner);
      
      // Show celebration if current user is the winner
      if (isWinner) {
        console.log('🎉 Current user is the winner! Showing celebration...');
        setShowWinnerCelebration(true);
        toast.success(`🎉 Congratulations! You won "${data.auctionTitle}" with $${data.winningBid.toLocaleString()}!`);
      } else {
        // Show notification for other users
        toast.info(`${data.winnerName} won the auction "${data.auctionTitle}" with $${data.winningBid.toLocaleString()}`);
      }
    }
  }, []);

  // Connect to socket for real-time updates
  console.log('🔌 Setting up auction socket for auction:', auction?._id);
  useAuctionSocket(auction?._id, handleBidUpdate);
  
  // Listen for winner announcements
  const socket = useSocket();
  useEffect(() => {
    if (!socket) return;
    
    socket.on("winnerAnnounced", handleWinnerAnnouncement);
    
    return () => {
      socket.off("winnerAnnounced", handleWinnerAnnouncement);
    };
  }, [socket, handleWinnerAnnouncement]);

  const fetchAuction = async () => {
    try {
      setLoadingAuction(true);
      const data = await api.auctions.getById(id!);
      setAuction(data);
      // Load bid history after auction is fetched
      await fetchBidHistory(id!);
    } catch (error: any) {
      console.error("Failed to fetch auction:", error);
      toast.error("Failed to load auction details");
    } finally {
      setLoadingAuction(false);
    }
  };

  const fetchBidHistory = async (auctionId: string) => {
    try {
      const bids = await api.bids.getAuctionBids(auctionId);
      console.log('📊 Loaded bid history:', bids);

      // Get user from localStorage for reliable ID comparison
      const storedUser = localStorage.getItem('user');
      const parsedUser = storedUser ? JSON.parse(storedUser) : null;
      const currentUserId = user?._id || parsedUser?._id;
      console.log('📊 Current user ID for bid history:', currentUserId);

      // Convert bids to activities
      const activities = bids.map((bid: any) => {
        const bidderId = String(bid.bidder?._id || '');
        const userId = String(currentUserId || '');
        const isOwnBid = bidderId === userId && bidderId !== '' && userId !== '';
        console.log('📊 Bid:', bid.bidder?.name, 'Bidder ID:', bidderId, 'User ID:', userId, 'Is Own:', isOwnBid);
        return {
          id: bid._id,
          type: 'bid' as const,
          message: isOwnBid ? 'You placed a bid' : `${bid.bidder?.name || 'Someone'} placed a bid`,
          amount: bid.amount,
          time: bid.createdAt,
          bidderName: bid.bidder?.name || 'Someone',
          isOwn: isOwnBid,
          isNew: false
        };
      });

      setRecentActivity(activities);
    } catch (error) {
      console.error('Failed to load bid history:', error);
      // Don't show error toast - the auction can still work without history
    }
  };

  // Check if current user is the winner
  const checkWinnerStatus = async () => {
    if (!id || !auction || auction.status !== "ENDED") return;
    
    try {
      const winnerData = await api.auctions.getWinner(id);
      console.log('🏆 Winner data:', winnerData);
      
      if (winnerData.hasWinner && winnerData.winner) {
        setWinnerInfo({
          winnerId: winnerData.winner._id,
          winnerName: winnerData.winner.name,
          winningBid: winnerData.winningBid,
        });
        
        // Check if current user is the winner
        const currentUserId = user?._id;
        const isWinner = currentUserId === winnerData.winner._id;
        setIsCurrentUserWinner(isWinner);
        
        if (isWinner) {
          console.log('🎉 Current user is the winner! Showing celebration...');
          setShowWinnerCelebration(true);
        }
      }
    } catch (error) {
      console.error('Failed to check winner status:', error);
    }
  };

  const fetchWalletStatus = async (showLoader = true) => {
    try {
      if (showLoader) setLoadingWallet(true);
      const status = await api.wallet.getVerificationStatus();

      if (status?.verification?.status === "approved" || status?.canBid) {
        setWalletStatus("approved");
        // Now check funding status
        await fetchFundingStatus(showLoader);
      } else if (status?.verification?.status === "pending" || status?.verification?.status === "ai_checking") {
        setWalletStatus("pending");
      } else if (status?.verification?.status === "rejected") {
        setWalletStatus("rejected");
      } else {
        setWalletStatus("not_submitted");
      }
    } catch (error: any) {
      setWalletStatus("not_submitted");
      if (showLoader) {
        toast.error(error?.message || "Failed to check wallet verification status");
      }
    } finally {
      if (showLoader) setLoadingWallet(false);
    }
  };

  const fetchFundingStatus = async (showLoader = true) => {
    try {
      const status = await api.wallet.getFundingStatus();
      setFundingStatus(status.fundingStatus);
      setWalletInfo({
        maxBiddingAmount: status.maxBiddingAmount || 0,
        remainingBalance: status.remainingBalance || 0,
        totalUsedAmount: status.totalUsedAmount || 0,
        primaryBalance: status.primaryBalance || 0,
        secondaryBalance: status.secondaryBalance || 0,
        primaryHeld: status.primaryHeld || 0,
        secondaryHeld: status.secondaryHeld || 0,
      });

      if (status.fundingStatus === "approved" && status.canBid) {
        await fetchAuction();
      }
    } catch (error: any) {
      if (showLoader) {
        toast.error(error?.message || "Failed to check funding status");
      }
    }
  };

  const submitWalletVerification = async () => {
    if (!statementFile) {
      toast.error("Please upload a PDF, JPG, or PNG statement");
      return;
    }

    try {
      setSubmittingVerification(true);
      const formData = new FormData();
      formData.append("bankStatement", statementFile);
      await api.wallet.submitVerification(formData);
      toast.success("Verification submitted. Pending admin approval.");
      setStatementFile(null);
      await fetchWalletStatus();
    } catch (error: any) {
      toast.error(error?.message || "Failed to submit wallet verification");
    } finally {
      setSubmittingVerification(false);
    }
  };

  const handleFundingFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFundingForm(prev => ({ ...prev, [name]: value }));
  };

  const submitFundingRequest = async () => {
    const { fullName, phone, email, location, walletAmount } = fundingForm;

    if (!fullName || !phone || !email || !location || !walletAmount) {
      toast.error("Please fill in all fields");
      return;
    }

    const amount = parseFloat(walletAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    try {
      setSubmittingFunding(true);
      await api.wallet.submitFundingRequest({
        fullName,
        phone,
        email,
        location,
        walletAmount: amount,
      });
      toast.success("Funding request submitted. Pending admin approval.");
      await fetchFundingStatus();
    } catch (error: any) {
      toast.error(error?.message || "Failed to submit funding request");
    } finally {
      setSubmittingFunding(false);
    }
  };

  // Chapa instant payment handler
  const handleChapaPayment = async () => {
    const { walletAmount, phone } = fundingForm;
    
    const amount = parseFloat(walletAmount);
    if (isNaN(amount) || amount < 10) {
      toast.error("Minimum deposit amount is 10 ETB");
      return;
    }

    try {
      setChapaProcessing(true);
      
      // Initialize Chapa payment
      const returnUrl = `${window.location.origin}/payment/success`;
      const response = await api.payments.initialize({
        amount,
        phone: phone || undefined,
        returnUrl,
      });
      
      // Store transaction reference
      sessionStorage.setItem("pending_payment_tx_ref", response.tx_ref);
      sessionStorage.setItem("pending_payment_amount", String(amount));
      
      toast.success("Redirecting to Chapa payment gateway...");
      
      // Redirect to Chapa checkout
      if (response.checkout_url) {
        window.location.href = response.checkout_url;
      } else {
        throw new Error("No checkout URL received");
      }
    } catch (error: any) {
      toast.error(error?.message || "Failed to initialize payment");
      setChapaProcessing(false);
    }
  };

  const calculateTimeLeft = (endTime: string) => {
    const end = new Date(endTime).getTime();
    const now = new Date().getTime();
    const diff = end - now;

    if (diff <= 0) return "Ended";

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const handlePlaceBid = async () => {
    if (!auction) return;

    const amount = parseFloat(bidAmount);
    const minBid = auction.currentBid + 10;

    if (!amount || amount < minBid) {
      toast.error(`Bid amount must be at least $${minBid.toLocaleString()}`);
      return;
    }

    // Check balance in selected wallet
    const selectedWalletBalance = selectedBidWallet === "primary"
      ? walletInfo.primaryBalance - walletInfo.primaryHeld
      : walletInfo.secondaryBalance - walletInfo.secondaryHeld;

    if (amount > selectedWalletBalance) {
      // Show insufficient balance modal
      const otherWalletBalance = selectedBidWallet === "primary"
        ? walletInfo.secondaryBalance - walletInfo.secondaryHeld
        : walletInfo.primaryBalance - walletInfo.primaryHeld;

      setInsufficientBalanceInfo({
        requiredAmount: amount,
        availableBalance: selectedWalletBalance,
        shortfall: amount - selectedWalletBalance,
      });
      setShowInsufficientBalance(true);
      return;
    }

    try {
      setPlacingBid(true);

      // Optimistic update
      setAuction(prev => prev ? { ...prev, currentBid: amount } : null);

      // Add to activity optimistically
      const newActivity = {
        id: `${auction._id}-${Date.now()}`,
        type: 'bid' as const,
        message: `You placed a bid`,
        amount: amount,
        time: new Date().toISOString(),
        bidderName: user?.name || 'You',
        isOwn: true,
        isNew: true
      };

      setRecentActivity(prev => {
        const updated = prev.map(a => ({ ...a, isNew: false }));
        return [newActivity, ...updated].slice(0, 10);
      });

      // Place bid through wallet system with selected wallet
      await api.wallet.placeBidWithWallet(auction._id, amount, selectedBidWallet);
      toast.success("Bid placed successfully!", {
        description: `Your bid of $${amount.toLocaleString()} has been placed from your ${selectedBidWallet} wallet.`,
      });
      setBidAmount("");
      // Update wallet info
      await fetchFundingStatus(false);
    } catch (error: any) {
      console.error("Failed to place bid:", error);
      toast.error(error.message || "Failed to place bid");
      // Revert optimistic update on error
      fetchAuction();
    } finally {
      setPlacingBid(false);
    }
  };

  // Handle quick transfer from insufficient balance modal
  const handleQuickTransfer = async () => {
    const amount = insufficientBalanceInfo.shortfall;
    const fromWallet = selectedBidWallet === "primary" ? "secondary" : "primary";
    const toWallet = selectedBidWallet;

    try {
      await api.wallet.transfer(amount, fromWallet, toWallet);
      toast.success(`$${amount.toLocaleString()} transferred from ${fromWallet} to ${toWallet} wallet`);
      setShowInsufficientBalance(false);
      setShowQuickTransfer(false);
      // Refresh wallet info
      await fetchFundingStatus(false);
    } catch (error: any) {
      toast.error(error.message || "Failed to transfer funds");
    }
  };

  // Handle adding funds inline (no navigation)
  const handleAddFunds = async (amount: number, paymentMethod: string) => {
    await api.wallet.deposit(amount, selectedBidWallet, paymentMethod);
    // Refresh wallet info after deposit
    await fetchFundingStatus(false);
  };

  // Show loading spinner only when actually loading
  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (loadingWallet || (walletStatus === "approved" && fundingStatus === "approved" && loadingAuction)) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Show wallet verification UI if not verified
  if (isBuyer && walletStatus !== "approved") {
    const isPending = walletStatus === "pending";
    const isRejected = walletStatus === "rejected";

    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <Card className="w-full max-w-xl p-8 border-border/50 bg-card/60 backdrop-blur-sm">
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold">Verify Your Wallet to Continue</h2>
              <p className="text-muted-foreground">
                You need an approved wallet verification before viewing this auction and placing bids.
              </p>
            </div>

            {walletStatus === "not_submitted" && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="wallet-file">Upload Bank Statement (PDF, JPG, PNG)</Label>
                  <Input
                    id="wallet-file"
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => setStatementFile(e.target.files?.[0] || null)}
                    disabled={submittingVerification}
                  />
                </div>
                <Button className="w-full gap-2" onClick={submitWalletVerification} disabled={submittingVerification}>
                  {submittingVerification ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                  Submit for Verification
                </Button>
              </div>
            )}

            {isPending && (
              <div className="rounded-lg border border-border bg-muted/30 p-6 text-center space-y-2">
                <div className="flex justify-center">
                  <Badge variant="outline" className="animate-pulse px-3 py-1">
                    AI Analysis in Progress
                  </Badge>
                </div>
                <p className="font-semibold text-lg">👉 Pending Admin Approval</p>
                <p className="text-sm text-muted-foreground">
                  Your bank statement has been submitted and is being analyzed. 
                  Auction details and bidding will unlock automatically once verified.
                </p>
              </div>
            )}

            {isRejected && (
              <div className="space-y-4">
                <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-center">
                  <p className="font-medium text-destructive">Your document was rejected. Please upload again.</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="wallet-file-reupload">Re-upload Bank Statement</Label>
                  <Input
                    id="wallet-file-reupload"
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => setStatementFile(e.target.files?.[0] || null)}
                    disabled={submittingVerification}
                  />
                </div>
                <Button className="w-full gap-2" onClick={submitWalletVerification} disabled={submittingVerification}>
                  {submittingVerification ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                  Re-submit Verification
                </Button>
              </div>
            )}
          </div>
        </Card>
      </div>
    );
  }

  // Show wallet funding UI if verified but not funded
  if (isBuyer && walletStatus === "approved" && fundingStatus !== "approved") {
    const isPending = fundingStatus === "pending";
    const isRejected = fundingStatus === "rejected";

    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <Card className="w-full max-w-2xl p-8 border-border/50 bg-card/60 backdrop-blur-sm">
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <div className="flex justify-center mb-4">
                <Wallet className="h-12 w-12 text-primary" />
              </div>
              <h2 className="text-2xl font-bold">Fund Your Wallet to Start Bidding</h2>
              <p className="text-muted-foreground">
                Set your maximum bidding amount. This amount will be held in escrow and used to limit your bids.
              </p>
            </div>

            {fundingStatus === "not_created" && (
              <div className="space-y-4">
                {/* Payment Method Selector */}
                <div className="space-y-2">
                  <Label>Select Payment Method</Label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setPaymentMethod("manual")}
                      disabled={submittingFunding || chapaProcessing}
                      className={`p-3 rounded-lg border text-left transition-all ${
                        paymentMethod === "manual"
                          ? "border-primary bg-primary/10"
                          : "border-border hover:border-primary/50"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <RefreshCw className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">Manual Request</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Admin approval required
                      </p>
                    </button>
                    <button
                      onClick={() => setPaymentMethod("chapa")}
                      disabled={submittingFunding || chapaProcessing}
                      className={`p-3 rounded-lg border text-left transition-all ${
                        paymentMethod === "chapa"
                          ? "border-green-500 bg-green-50"
                          : "border-border hover:border-green-500/50"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <CreditCard className="h-4 w-4 text-green-600" />
                        <span className="font-medium text-green-700">Instant Pay</span>
                      </div>
                      <p className="text-xs text-green-600 mt-1">
                        Pay with Chapa (immediate)
                      </p>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Full Name</Label>
                    <Input
                      id="fullName"
                      name="fullName"
                      placeholder="Enter your full name"
                      value={fundingForm.fullName}
                      onChange={handleFundingFormChange}
                      disabled={submittingFunding}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      name="phone"
                      placeholder="Enter your phone number"
                      value={fundingForm.phone}
                      onChange={handleFundingFormChange}
                      disabled={submittingFunding}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="Enter your email"
                      value={fundingForm.email}
                      onChange={handleFundingFormChange}
                      disabled={submittingFunding}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="location">Location</Label>
                    <Input
                      id="location"
                      name="location"
                      placeholder="Enter your location"
                      value={fundingForm.location}
                      onChange={handleFundingFormChange}
                      disabled={submittingFunding}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="walletAmount">Maximum Bidding Amount ($)</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="walletAmount"
                      name="walletAmount"
                      type="number"
                      placeholder="Enter maximum amount you want to use for bidding"
                      value={fundingForm.walletAmount}
                      onChange={handleFundingFormChange}
                      className="pl-9"
                      disabled={submittingFunding}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    This amount will be held in escrow and will limit your maximum bidding power.
                  </p>
                </div>
                <Button
                  className={`w-full gap-2 ${paymentMethod === "chapa" ? "bg-green-600 hover:bg-green-700" : ""}`}
                  onClick={paymentMethod === "chapa" ? handleChapaPayment : submitFundingRequest}
                  disabled={submittingFunding || chapaProcessing}
                >
                  {submittingFunding || chapaProcessing ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : paymentMethod === "chapa" ? (
                    <CreditCard className="h-4 w-4" />
                  ) : (
                    <Wallet className="h-4 w-4" />
                  )}
                  {paymentMethod === "chapa" ? "Pay with Chapa" : "Submit Funding Request"}
                </Button>
              </div>
            )}

            {isPending && (
              <div className="space-y-4">
                <div className="rounded-lg border border-border bg-muted/30 p-6 text-center space-y-4">
                  <div className="flex justify-center">
                    <Badge variant="outline" className="animate-pulse px-3 py-1">
                      <Clock className="h-3 w-3 mr-1" />
                      Under Review
                    </Badge>
                  </div>
                  <p className="font-semibold text-lg">👉 Your wallet funding is under review</p>
                  <p className="text-sm text-muted-foreground">
                    Admins are reviewing your funding request. Once approved, you'll be able to place bids up to your requested amount.
                  </p>
                  <div className="bg-card rounded-lg p-4 border border-border/50">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Requested Amount:</span>
                      <span className="text-xl font-bold text-primary">
                        ${parseFloat(fundingForm.walletAmount || "0").toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {isRejected && (
              <div className="space-y-4">
                <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-center">
                  <XCircle className="h-8 w-8 text-destructive mx-auto mb-2" />
                  <p className="font-medium text-destructive">Your funding request was rejected.</p>
                  <p className="text-sm text-muted-foreground mt-1">Please submit a new funding request.</p>
                </div>
                <div className="space-y-4">
                  {/* Payment Method Selector */}
                  <div className="space-y-2">
                    <Label>Select Payment Method</Label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => setPaymentMethod("manual")}
                        disabled={submittingFunding || chapaProcessing}
                        className={`p-3 rounded-lg border text-left transition-all ${
                          paymentMethod === "manual"
                            ? "border-primary bg-primary/10"
                            : "border-border hover:border-primary/50"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <RefreshCw className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">Manual Request</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          Admin approval required
                        </p>
                      </button>
                      <button
                        onClick={() => setPaymentMethod("chapa")}
                        disabled={submittingFunding || chapaProcessing}
                        className={`p-3 rounded-lg border text-left transition-all ${
                          paymentMethod === "chapa"
                            ? "border-green-500 bg-green-50"
                            : "border-border hover:border-green-500/50"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <CreditCard className="h-4 w-4 text-green-600" />
                          <span className="font-medium text-green-700">Instant Pay</span>
                        </div>
                        <p className="text-xs text-green-600 mt-1">
                          Pay with Chapa (immediate)
                        </p>
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="fullName-re">Full Name</Label>
                      <Input
                        id="fullName-re"
                        name="fullName"
                        placeholder="Enter your full name"
                        value={fundingForm.fullName}
                        onChange={handleFundingFormChange}
                        disabled={submittingFunding}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone-re">Phone Number</Label>
                      <Input
                        id="phone-re"
                        name="phone"
                        placeholder="Enter your phone number"
                        value={fundingForm.phone}
                        onChange={handleFundingFormChange}
                        disabled={submittingFunding}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email-re">Email Address</Label>
                      <Input
                        id="email-re"
                        name="email"
                        type="email"
                        placeholder="Enter your email"
                        value={fundingForm.email}
                        onChange={handleFundingFormChange}
                        disabled={submittingFunding}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="location-re">Location</Label>
                      <Input
                        id="location-re"
                        name="location"
                        placeholder="Enter your location"
                        value={fundingForm.location}
                        onChange={handleFundingFormChange}
                        disabled={submittingFunding}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="walletAmount-re">Maximum Bidding Amount ($)</Label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="walletAmount-re"
                        name="walletAmount"
                        type="number"
                        placeholder="Enter maximum amount"
                        value={fundingForm.walletAmount}
                        onChange={handleFundingFormChange}
                        className="pl-9"
                        disabled={submittingFunding}
                      />
                    </div>
                  </div>
                  <Button
                    className={`w-full gap-2 ${paymentMethod === "chapa" ? "bg-green-600 hover:bg-green-700" : ""}`}
                    onClick={paymentMethod === "chapa" ? handleChapaPayment : submitFundingRequest}
                    disabled={submittingFunding || chapaProcessing}
                  >
                    {submittingFunding || chapaProcessing ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : paymentMethod === "chapa" ? (
                      <CreditCard className="h-4 w-4" />
                    ) : (
                      <Wallet className="h-4 w-4" />
                    )}
                    {paymentMethod === "chapa" ? "Pay with Chapa" : "Re-submit Funding Request"}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>
    );
  }

  if (!auction) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <h2 className="text-2xl font-bold mb-2">Auction not found</h2>
        <p className="text-muted-foreground mb-6">The auction you're looking for doesn't exist.</p>
        <Button onClick={() => navigate("/")}>Back to Home</Button>
      </div>
    );
  }

  const endTime = new Date(auction.endTime);
  const minBid = auction.currentBid + 10;
  
  // Process images using standardized utility
  const processedImages = auction.images && auction.images.length > 0 
    ? auction.images.map(img => getImageUrl(img))
    : ["https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?w=800&h=600&fit=crop"];
  
  const isActive = auction.status === "ACTIVE";

  return (
    <div className="space-y-8">
      {/* Back Button */}
      <Button
        variant="ghost"
        className="gap-2"
        onClick={() => navigate("/")}
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Auctions
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column - Images (5 columns) */}
        <div className="lg:col-span-5 space-y-4">
          <Card className="overflow-hidden border-border/50 bg-card/50 backdrop-blur-sm">
            <div className="relative aspect-[4/3] bg-muted">
              <ImageWithFallback
                src={processedImages[selectedImage]}
                alt={auction.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute top-4 left-4 flex gap-2">
                {isActive && (
                  <Badge className="bg-destructive/90 backdrop-blur-sm border-0 animate-pulse">
                    <span className="relative flex h-2 w-2 mr-1.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                    </span>
                    LIVE
                  </Badge>
                )}
                <Badge className="bg-primary/90 backdrop-blur-sm border-0">
                  <Sparkles className="h-3 w-3 mr-1" />
                  Verified
                </Badge>
              </div>
              <div className="absolute top-4 right-4 flex gap-2">
                <Button
                  size="icon"
                  variant="secondary"
                  className="backdrop-blur-sm bg-black/50 hover:bg-black/70"
                  onClick={() => setIsFavorite(!isFavorite)}
                >
                  <Heart className={`h-4 w-4 ${isFavorite ? "fill-red-500 text-red-500" : ""}`} />
                </Button>
                <Button
                  size="icon"
                  variant="secondary"
                  className="backdrop-blur-sm bg-black/50 hover:bg-black/70"
                  onClick={() => {
                    navigator.clipboard.writeText(window.location.href);
                    toast.success("Link copied to clipboard!");
                  }}
                >
                  <Share2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
            {processedImages.length > 1 && (
              <div className="p-4 flex gap-2 overflow-x-auto">
                {processedImages.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={`relative flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                      selectedImage === index
                        ? "border-primary"
                        : "border-transparent hover:border-muted-foreground/50"
                    }`}
                  >
                    <ImageWithFallback src={image} alt={`Thumbnail ${index + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </Card>

          {/* Tabs - Description, Shipping, etc. */}
          <Card className="p-6 border-border/50 bg-card/50 backdrop-blur-sm">
            <Tabs defaultValue="description">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="description">Description</TabsTrigger>
                <TabsTrigger value="shipping">Shipping & Safety</TabsTrigger>
              </TabsList>
              <TabsContent value="description" className="space-y-4 pt-4">
                <div>
                  <h3 className="font-semibold mb-2">About This Item</h3>
                  <p className="text-muted-foreground whitespace-pre-wrap">
                    {auction.description}
                  </p>
                </div>
                <Separator />
                <div>
                  <h3 className="font-semibold mb-2">Details</h3>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex justify-between">
                      <span>Category:</span>
                      <span className="text-foreground">{auction.category?.name || "Uncategorized"}</span>
                    </li>
                    <li className="flex justify-between">
                      <span>Starting Bid:</span>
                      <span className="text-foreground">${auction.startingBid.toLocaleString()}</span>
                    </li>
                    <li className="flex justify-between">
                      <span>Status:</span>
                      <Badge variant={isActive ? "default" : "secondary"}>{auction.status}</Badge>
                    </li>
                    <li className="flex justify-between">
                      <span>Listed:</span>
                      <span className="text-foreground">{new Date(auction.createdAt).toLocaleDateString()}</span>
                    </li>
                  </ul>
                </div>
              </TabsContent>
              <TabsContent value="shipping" className="space-y-4 pt-4">
                <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50">
                  <Package className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-medium mb-1">Secure Shipping</h4>
                    <p className="text-sm text-muted-foreground">
                      Insured delivery with tracking. Ships within 2 business days after payment.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50">
                  <Shield className="h-5 w-5 text-secondary flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-medium mb-1">Buyer Protection</h4>
                    <p className="text-sm text-muted-foreground">
                      Full escrow protection. Payment released only after you confirm receipt.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50">
                  <MapPin className="h-5 w-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-medium mb-1">Authenticity Guaranteed</h4>
                    <p className="text-sm text-muted-foreground">
                      30-day money-back guarantee if item is not as described.
                    </p>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </Card>
        </div>

        {/* Middle Column - Bidding (4 columns) */}
        <div className="lg:col-span-4 space-y-4">
          {/* Countdown */}
          <Card className="p-6 border-border/50 bg-card/50 backdrop-blur-sm">
            <div className="space-y-4">
              <div>
                <h1 className="text-2xl font-bold mb-2">{auction.title}</h1>
                {auction.category && (
                  <Badge variant="secondary">{auction.category.name}</Badge>
                )}
              </div>

              <Separator />

              <div>
                <p className="text-sm text-muted-foreground mb-2">Time Remaining</p>
                <CountdownTimer endTime={endTime} />
              </div>

              <Separator />

              <div className="space-y-3">
                <div className="flex items-baseline justify-between">
                  <span className="text-sm text-muted-foreground">Current Bid</span>
                  <span className="text-3xl font-bold text-primary">${auction.currentBid.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <Users className="h-3.5 w-3.5" />
                    Bidding active
                  </span>
                  <span className="text-secondary flex items-center gap-1">
                    <TrendingUp className="h-3.5 w-3.5" />
                    {isActive ? "Live" : "Ended"}
                  </span>
                </div>
              </div>

              {isActive && (
                <>
                  <Separator />

                  {/* Multi-Wallet Info Display */}
                  {isBuyer && fundingStatus === "approved" && (
                    <div className="space-y-4">
                      {/* Wallet Selector */}
                      <BidWalletSelector
                        primaryWallet={{
                          balance: walletInfo.primaryBalance,
                          heldBalance: walletInfo.primaryHeld,
                          available: walletInfo.primaryBalance - walletInfo.primaryHeld,
                        }}
                        secondaryWallet={{
                          balance: walletInfo.secondaryBalance,
                          heldBalance: walletInfo.secondaryHeld,
                          available: walletInfo.secondaryBalance - walletInfo.secondaryHeld,
                        }}
                        selectedWallet={selectedBidWallet}
                        onSelect={setSelectedBidWallet}
                        requiredAmount={bidAmount ? parseFloat(bidAmount) : undefined}
                      />

                      {/* Total Wallet Summary */}
                      <div className="p-3 rounded-lg bg-muted/50 border border-border/50">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Total Available Across Wallets:</span>
                          <span className="font-semibold text-green-600">
                            ${(walletInfo.primaryBalance - walletInfo.primaryHeld + walletInfo.secondaryBalance - walletInfo.secondaryHeld).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium">Your Bid</label>
                      <span className="text-xs text-muted-foreground">
                        Min: ${minBid.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        placeholder={`${minBid.toLocaleString()}`}
                        value={bidAmount}
                        onChange={(e) => setBidAmount(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handlePlaceBid();
                          }
                        }}
                        className="flex-1"
                        disabled={placingBid}
                      />
                      <Button type="button" onClick={handlePlaceBid} className="gap-2" disabled={placingBid}>
                        {placingBid ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Gavel className="h-4 w-4" />
                        )}
                        Bid
                      </Button>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => setBidAmount(String(minBid))}
                        disabled={placingBid}
                      >
                        ${minBid.toLocaleString()}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => setBidAmount(String(minBid + 100))}
                        disabled={placingBid}
                      >
                        ${(minBid + 100).toLocaleString()}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => setBidAmount(String(minBid + 250))}
                        disabled={placingBid}
                      >
                        ${(minBid + 250).toLocaleString()}
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-start gap-2 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                    <AlertCircle className="h-4 w-4 text-blue-500 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-muted-foreground">
                      By placing a bid, you agree to the auction terms and commit to purchase if you win.
                    </p>
                  </div>
                </>
              )}
            </div>
          </Card>

          {/* Seller Info */}
          <Card className="p-6 border-border/50 bg-card/50 backdrop-blur-sm">
            <h3 className="font-semibold mb-4">Seller Information</h3>
            <div className="flex items-start gap-3 mb-4">
              <Avatar className="h-12 w-12">
                <AvatarImage src={auction.seller.profileImage || `https://api.dicebear.com/7.x/avataaars/svg?seed=${auction.seller.name}`} />
                <AvatarFallback>{auction.seller.name.charAt(0).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-medium">{auction.seller.name}</p>
                  <Badge variant="outline" className="text-xs bg-secondary/10 text-secondary border-secondary/20">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Verified
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">Trusted Seller</p>
              </div>
            </div>
          </Card>

          {/* Escrow Status - Show for ended auctions */}
          {auction?.status === "ENDED" && (
            <div className="space-y-4">
              <EscrowStatus 
                auctionId={auction._id} 
                auctionStatus={auction.status} 
              />
              {(user?._id === auction.seller._id || isCurrentUserWinner) && (
                <Button 
                  variant="outline" 
                  className="w-full border-destructive/30 text-destructive hover:bg-destructive/10"
                  onClick={() => navigate(`/dashboard/disputes/create/${auction._id}`)}
                >
                  <AlertCircle className="h-4 w-4 mr-2" />
                  Report Issue / Open Dispute
                </Button>
              )}
            </div>
          )}

          {/* Trust & Safety */}
          <Card className="p-6 border-border/50 bg-card/50 backdrop-blur-sm">
            <h3 className="font-semibold mb-4">Trust & Safety</h3>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Shield className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium">Escrow Protection</p>
                  <p className="text-xs text-muted-foreground">Your payment is held securely</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="h-8 w-8 rounded-full bg-secondary/10 flex items-center justify-center flex-shrink-0">
                  <Sparkles className="h-4 w-4 text-secondary" />
                </div>
                <div>
                  <p className="text-sm font-medium">AI Fraud Detection</p>
                  <p className="text-xs text-muted-foreground">Automated verification system</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="h-8 w-8 rounded-full bg-yellow-500/10 flex items-center justify-center flex-shrink-0">
                  <CheckCircle2 className="h-4 w-4 text-yellow-500" />
                </div>
                <div>
                  <p className="text-sm font-medium">Authenticity Guaranteed</p>
                  <p className="text-xs text-muted-foreground">30-day money-back guarantee</p>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Right Column - Recent Activity (3 columns) */}
        <div className="lg:col-span-3 space-y-4">
          <RecentActivity activities={recentActivity} />
        </div>
      </div>

      {/* Winner Celebration Modal */}
      <WinnerCelebration
        isOpen={showWinnerCelebration}
        onClose={() => setShowWinnerCelebration(false)}
        winnerName={winnerInfo?.winnerName || ""}
        auctionTitle={auction?.title || ""}
        winningBid={winnerInfo?.winningBid || 0}
        isCurrentUser={isCurrentUserWinner}
      />

      {/* Insufficient Balance Modal */}
      <InsufficientBalanceModal
        isOpen={showInsufficientBalance}
        onClose={() => setShowInsufficientBalance(false)}
        requiredAmount={insufficientBalanceInfo.requiredAmount}
        availableBalance={insufficientBalanceInfo.availableBalance}
        shortfall={insufficientBalanceInfo.shortfall}
        selectedWallet={selectedBidWallet}
        otherWalletBalance={
          selectedBidWallet === "primary"
            ? walletInfo.secondaryBalance - walletInfo.secondaryHeld
            : walletInfo.primaryBalance - walletInfo.primaryHeld
        }
        onTransfer={handleQuickTransfer}
        onAddFunds={handleAddFunds}
      />
    </div>
  );
}