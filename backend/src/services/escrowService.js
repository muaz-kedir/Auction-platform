const Auction = require("../models/Auction");
const Wallet = require("../models/Wallet");
const Transaction = require("../models/Transaction");
const User = require("../models/User");
const Bid = require("../models/Bid");
const Dispute = require("../models/Dispute");

/**
 * Escrow Service - Handles all escrow-related operations
 * 
 * Flow:
 * 1. Auction ends → winner selected
 * 2. Funds held in escrow (buyer's available balance → locked)
 * 3. Seller delivers item
 * 4. Admin releases funds → seller gets paid
 * 5. OR Admin refunds → buyer gets money back
 */

class EscrowService {
  /**
   * Hold funds in escrow when auction ends
   * Called automatically when auction ends and winner is selected
   */
  static async holdFunds(auctionId) {
    const session = await Auction.startSession();
    
    try {
      return await session.withTransaction(async () => {
        // Get auction with winner
        const auction = await Auction.findById(auctionId)
          .populate("winner")
          .populate("seller")
          .session(session);

        if (!auction) {
          throw new Error("Auction not found");
        }

        if (!auction.winner) {
          throw new Error("No winner selected for this auction");
        }

        if (auction.escrowStatus !== "none" && auction.escrowStatus !== "awaiting_payment") {
          throw new Error("Escrow already processed for this auction");
        }

        // Get winning bid amount
        const winningBid = auction.winningBid || auction.currentBid;
        
        if (winningBid <= 0) {
          throw new Error("Invalid winning bid amount");
        }

        // Get winner's wallet
        const winnerWallet = await Wallet.findOne({ user: auction.winner._id }).session(session);
        
        if (!winnerWallet) {
          // Mark auction as payment failed - no wallet
          auction.escrowStatus = "payment_failed";
          auction.paymentStatus = "failed";
          await auction.save({ session });
          
          throw new Error("Winner has no wallet");
        }

        // Check if winner has sufficient available balance
        const availableBalance = winnerWallet.balance - winnerWallet.heldBalance;
        
        if (availableBalance < winningBid) {
          // Mark auction as payment failed - insufficient funds
          auction.escrowStatus = "payment_failed";
          auction.paymentStatus = "failed";
          await auction.save({ session });
          
          throw new Error(`Insufficient balance. Available: ${availableBalance}, Required: ${winningBid}`);
        }

        // Lock funds: Move from available balance to held balance
        winnerWallet.balance -= winningBid;
        winnerWallet.heldBalance += winningBid;
        await winnerWallet.save({ session });

        // Create escrow hold transaction
        const transaction = await Transaction.create([{
          userId: auction.winner._id,
          auctionId: auction._id,
          amount: winningBid,
          type: "escrow_hold",
          status: "completed",
          from: "wallet",
          to: "escrow",
          description: `Funds held in escrow for auction: ${auction.title}`,
          buyerId: auction.winner._id,
          sellerId: auction.seller._id,
          metadata: {
            auctionTitle: auction.title,
            previousBalance: availableBalance + winningBid,
            newBalance: availableBalance,
            heldAmount: winningBid,
          },
        }], { session });

        // Update auction with escrow info
        auction.escrowStatus = "payment_secured";
        auction.paymentStatus = "held";
        auction.escrowHoldAt = new Date();
        auction.escrowTransactionId = transaction[0]._id;
        await auction.save({ session });

        console.log(`✅ Escrow hold completed for auction ${auctionId}. Amount: ${winningBid}`);

        return {
          success: true,
          auction: auction,
          transaction: transaction[0],
          amount: winningBid,
        };
      });
    } catch (error) {
      console.error("❌ Escrow hold failed:", error.message);
      throw error;
    } finally {
      session.endSession();
    }
  }

  /**
   * Release funds to seller (admin only)
   * Called when admin approves the transaction
   */
  static async releaseFunds(auctionId, adminId, disputeId = null) {
    const session = await Auction.startSession();
    
    try {
      return await session.withTransaction(async () => {
        // Get auction
        const auction = await Auction.findById(auctionId)
          .populate("winner")
          .populate("seller")
          .session(session);

        if (!auction) {
          throw new Error("Auction not found");
        }

        if (auction.escrowStatus !== "payment_secured" && auction.escrowStatus !== "delivered") {
          throw new Error("Cannot release funds. Invalid escrow status: " + auction.escrowStatus);
        }

        const winningBid = auction.winningBid || auction.currentBid;

        // Get wallets
        const winnerWallet = await Wallet.findOne({ user: auction.winner._id }).session(session);
        const sellerWallet = await Wallet.findOne({ user: auction.seller._id }).session(session);

        if (!winnerWallet || !sellerWallet) {
          throw new Error("Wallet not found for buyer or seller");
        }

        // Verify funds are held
        if (winnerWallet.heldBalance < winningBid) {
          throw new Error("Insufficient held balance in winner's wallet");
        }

        // Release funds from escrow
        winnerWallet.heldBalance -= winningBid;
        await winnerWallet.save({ session });

        // Add funds to seller's wallet
        sellerWallet.balance += winningBid;
        sellerWallet.totalEarnings = (sellerWallet.totalEarnings || 0) + winningBid;
        await sellerWallet.save({ session });

        // Create release transaction for seller
        const transaction = await Transaction.create([{
          userId: auction.seller._id,
          auctionId: auction._id,
          amount: winningBid,
          type: "escrow_release",
          status: "completed",
          from: "escrow",
          to: "wallet",
          description: `Payment received for auction: ${auction.title}${disputeId ? " (Dispute Resolved)" : ""}`,
          buyerId: auction.winner._id,
          sellerId: auction.seller._id,
          processedBy: adminId,
          metadata: {
            auctionTitle: auction.title,
            releasedBy: "admin",
            disputeId: disputeId,
            previousSellerBalance: sellerWallet.balance - winningBid,
            newSellerBalance: sellerWallet.balance,
          },
        }], { session });

        // Update auction
        auction.escrowStatus = "released";
        auction.paymentStatus = "released";
        auction.releasedAt = new Date();
        auction.releaseTransactionId = transaction[0]._id;
        
        // Handle dispute if provided
        if (disputeId) {
          const dispute = await Dispute.findById(disputeId).session(session);
          if (dispute) {
            dispute.status = "RESOLVED";
            dispute.resolutionAction = "release";
            dispute.resolvedBy = adminId;
            dispute.resolvedAt = new Date();
            await dispute.save({ session });
          }
        }
        
        await auction.save({ session });

        console.log(`✅ Escrow release completed for auction ${auctionId}. Seller paid: ${winningBid}`);

        return {
          success: true,
          auction: auction,
          transaction: transaction[0],
          amount: winningBid,
        };
      });
    } catch (error) {
      console.error("❌ Escrow release failed:", error.message);
      throw error;
    } finally {
      session.endSession();
    }
  }

  /**
   * Refund funds to buyer (admin only - for disputes)
   */
  static async refundFunds(auctionId, adminId, reason = "", disputeId = null) {
    const session = await Auction.startSession();
    
    try {
      return await session.withTransaction(async () => {
        // Get auction
        const auction = await Auction.findById(auctionId)
          .populate("winner")
          .populate("seller")
          .session(session);

        if (!auction) {
          throw new Error("Auction not found");
        }

        if (auction.escrowStatus !== "payment_secured" && 
            auction.escrowStatus !== "delivered" &&
            auction.escrowStatus !== "awaiting_payment") {
          throw new Error("Cannot refund. Invalid escrow status: " + auction.escrowStatus);
        }

        const winningBid = auction.winningBid || auction.currentBid;

        // Get winner's wallet
        const winnerWallet = await Wallet.findOne({ user: auction.winner._id }).session(session);

        if (!winnerWallet) {
          throw new Error("Winner's wallet not found");
        }

        // If funds are held, release them back to buyer
        if (winnerWallet.heldBalance >= winningBid) {
          winnerWallet.heldBalance -= winningBid;
          winnerWallet.balance += winningBid;
          await winnerWallet.save({ session });
        }

        // Create refund transaction
        const transaction = await Transaction.create([{
          userId: auction.winner._id,
          auctionId: auction._id,
          amount: winningBid,
          type: "escrow_refund",
          status: "completed",
          from: "escrow",
          to: "wallet",
          description: `Refund for auction: ${auction.title}${reason ? ` - Reason: ${reason}` : ""}${disputeId ? " (Dispute Resolved)" : ""}`,
          buyerId: auction.winner._id,
          sellerId: auction.seller._id,
          processedBy: adminId,
          metadata: {
            auctionTitle: auction.title,
            refundReason: reason,
            refundedBy: "admin",
            disputeId: disputeId,
          },
        }], { session });

        // Update auction
        auction.escrowStatus = "refunded";
        auction.paymentStatus = "refunded";
        auction.refundedAt = new Date();
        auction.releaseTransactionId = transaction[0]._id;
        
        // Handle dispute if provided
        if (disputeId) {
          const dispute = await Dispute.findById(disputeId).session(session);
          if (dispute) {
            dispute.status = "RESOLVED";
            dispute.resolutionAction = "refund";
            dispute.resolvedBy = adminId;
            dispute.resolvedAt = new Date();
            await dispute.save({ session });
          }
        }
        
        await auction.save({ session });

        console.log(`✅ Escrow refund completed for auction ${auctionId}. Amount refunded: ${winningBid}`);

        return {
          success: true,
          auction: auction,
          transaction: transaction[0],
          amount: winningBid,
          reason: reason,
        };
      });
    } catch (error) {
      console.error("❌ Escrow refund failed:", error.message);
      throw error;
    } finally {
      session.endSession();
    }
  }

  /**
   * Mark item as delivered by seller
   */
  static async markDelivered(auctionId, sellerId) {
    const auction = await Auction.findById(auctionId);
    
    if (!auction) {
      throw new Error("Auction not found");
    }

    if (auction.seller.toString() !== sellerId.toString()) {
      throw new Error("Only the seller can mark as delivered");
    }

    if (auction.escrowStatus !== "payment_secured") {
      throw new Error("Cannot mark as delivered. Payment not secured in escrow");
    }

    auction.deliveryStatus = "delivered";
    auction.escrowStatus = "delivered";
    auction.deliveredAt = new Date();
    await auction.save();

    console.log(`✅ Auction ${auctionId} marked as delivered by seller`);

    return {
      success: true,
      auction: auction,
    };
  }

  /**
   * Open a dispute
   */
  static async openDispute(auctionId, userId, data) {
    const auction = await Auction.findById(auctionId);
    
    if (!auction) {
      throw new Error("Auction not found");
    }

    // Only buyer or seller can open dispute
    const isBuyer = auction.winner && auction.winner.toString() === userId.toString();
    const isSeller = auction.seller.toString() === userId.toString();
    
    if (!isBuyer && !isSeller) {
      throw new Error("Only buyer or seller can open a dispute");
    }

    if (auction.escrowStatus !== "payment_secured" && auction.escrowStatus !== "delivered") {
      throw new Error("Cannot open dispute. Invalid escrow status");
    }

    // Create Dispute document
    const dispute = await Dispute.create({
      auction: auctionId,
      buyer: auction.winner,
      seller: auction.seller,
      creator: userId,
      reason: data.reason,
      description: data.description,
      evidence: data.evidence || [],
      status: "OPEN",
    });

    // Update Auction
    auction.dispute = dispute._id;
    await auction.save();

    console.log(`⚠️ Dispute opened for auction ${auctionId} by ${isBuyer ? "buyer" : "seller"}`);

    return {
      success: true,
      auction: auction,
      dispute: dispute,
      isBuyer: isBuyer,
    };
  }

  /**
   * Get escrow status for an auction
   */
  static async getEscrowStatus(auctionId) {
    const auction = await Auction.findById(auctionId)
      .populate("winner", "name email")
      .populate("seller", "name email")
      .populate("escrowTransactionId")
      .populate("releaseTransactionId")
      .populate("dispute");

    if (!auction) {
      throw new Error("Auction not found");
    }

    return {
      auctionId: auction._id,
      title: auction.title,
      status: auction.status,
      escrowStatus: auction.escrowStatus,
      paymentStatus: auction.paymentStatus,
      deliveryStatus: auction.deliveryStatus,
      winningBid: auction.winningBid || auction.currentBid,
      winner: auction.winner,
      seller: auction.seller,
      dispute: auction.dispute,
      escrowHoldAt: auction.escrowHoldAt,
      deliveredAt: auction.deliveredAt,
      releasedAt: auction.releasedAt,
      refundedAt: auction.refundedAt,
      escrowTransaction: auction.escrowTransactionId,
      releaseTransaction: auction.releaseTransactionId,
    };
  }

  /**
   * Get all escrow transactions
   */
  static async getEscrowTransactions(filters = {}) {
    const query = { type: { $in: ["escrow_hold", "escrow_release", "escrow_refund"] } };
    
    if (filters.status) {
      query.status = filters.status;
    }
    
    if (filters.auctionId) {
      query.auctionId = filters.auctionId;
    }
    
    if (filters.userId) {
      query.$or = [{ buyerId: filters.userId }, { sellerId: filters.userId }, { userId: filters.userId }];
    }

    const transactions = await Transaction.find(query)
      .populate("userId", "name email")
      .populate("auctionId", "title images")
      .populate("buyerId", "name email")
      .populate("sellerId", "name email")
      .populate("processedBy", "name role")
      .sort({ createdAt: -1 });

    return transactions;
  }

  /**
   * Process auction end and automatically hold funds
   * Called by the auction ending scheduler/socket
   */
  static async processAuctionEnd(auctionId) {
    try {
      const auction = await Auction.findById(auctionId)
        .populate("winner")
        .populate("seller");

      if (!auction) {
        console.error(`Auction ${auctionId} not found for escrow processing`);
        return { success: false, error: "Auction not found" };
      }

      if (!auction.winner) {
        console.log(`No winner for auction ${auctionId}, skipping escrow`);
        return { success: false, error: "No winner" };
      }

      // Get highest bid
      const highestBid = await Bid.findOne({ auction: auctionId })
        .sort({ amount: -1 })
        .populate("bidder");

      if (!highestBid) {
        console.log(`No bids found for auction ${auctionId}`);
        return { success: false, error: "No bids" };
      }

      // Update auction with winning bid amount
      auction.winningBid = highestBid.amount;
      auction.winner = highestBid.bidder._id;
      auction.status = "ENDED";
      auction.escrowStatus = "awaiting_payment";
      await auction.save();

      console.log(`🏆 Auction ${auctionId} ended. Winner: ${highestBid.bidder.name}, Bid: ${highestBid.amount}`);

      // Try to hold funds
      try {
        const result = await this.holdFunds(auctionId);
        return result;
      } catch (error) {
        console.error(`Failed to hold funds for auction ${auctionId}:`, error.message);
        
        // Auction is already marked as payment_failed in holdFunds
        return { 
          success: false, 
          error: error.message,
          auction: auction,
          paymentFailed: true,
        };
      }
    } catch (error) {
      console.error(`Error processing auction end for ${auctionId}:`, error.message);
      return { success: false, error: error.message };
    }
  }
}

module.exports = EscrowService;
