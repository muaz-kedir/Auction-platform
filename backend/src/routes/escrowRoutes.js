const express = require("express");
const router = express.Router();

const {
  // Escrow status and info
  getEscrowStatus,
  getMyTransactions,
  getEscrowTransactions,
  getEscrowAuctions,
  
  // Escrow actions (admin)
  holdFunds,
  releaseFunds,
  refundFunds,
  refundBuyer,
  
  // Seller actions
  markDelivered,
  shipItem,
  
  // Buyer actions
  confirmDelivery,
  openDispute,
} = require("../controllers/escrowController");

const { protect, adminOnly } = require("../middleware/authMiddleware");

// ==================== PUBLIC/AUTHENTICATED ROUTES ====================

// Get escrow status for a specific auction (buyer, seller, or admin)
router.get("/status/:id", protect, getEscrowStatus);

// Get current user's escrow transactions
router.get("/my-transactions", protect, getMyTransactions);

// ==================== SELLER ROUTES ====================

// Mark item as delivered (seller)
router.post("/deliver/:id", protect, markDelivered);

// Mark item as shipped (seller)
router.post("/ship/:id", protect, shipItem);

// ==================== BUYER ROUTES ====================

// Confirm delivery (buyer)
router.post("/confirm/:id", protect, confirmDelivery);

// Open dispute (buyer or seller)
router.post("/dispute/:id", protect, openDispute);

// ==================== ADMIN ROUTES ====================

// Get all escrow transactions (admin only)
router.get("/transactions", protect, adminOnly, getEscrowTransactions);

// Get all auctions with escrow status (admin only)
router.get("/auctions", protect, adminOnly, getEscrowAuctions);

// Hold funds in escrow (admin only - manual trigger)
router.post("/hold/:id", protect, adminOnly, holdFunds);

// Release funds to seller (admin only)
router.post("/release/:id", protect, adminOnly, releaseFunds);

// Refund funds to buyer (admin only)
router.post("/refund/:id", protect, adminOnly, refundFunds);

// Legacy refund endpoint
router.post("/refund-legacy/:id", protect, adminOnly, refundBuyer);

module.exports = router;