const express = require("express");
const router = express.Router();

const {
  requestWithdraw,
  approveWithdraw
} = require("../controllers/withdrawController");

const {
  initializePayment,
  handleWebhook,
  verifyPayment,
  getPaymentHistory,
  getPaymentById,
} = require("../controllers/paymentController");

const { protect: auth } = require("../middleware/authMiddleware");

// ==================== WITHDRAWAL ROUTES ====================
router.post("/withdraw", auth, requestWithdraw);
router.put("/withdraw/:id/approve", auth, approveWithdraw);

// ==================== CHAPA PAYMENT ROUTES ====================

// Initialize payment (deposit to wallet)
router.post("/initialize", auth, initializePayment);

// Get payment history
router.get("/history", auth, getPaymentHistory);

// Get single payment details
router.get("/:id", auth, getPaymentById);

// Verify payment (manual verification endpoint)
router.get("/verify/:tx_ref", auth, verifyPayment);

// Webhook endpoint (public - called by Chapa)
// Note: This doesn't use auth middleware as it's called by Chapa
router.post("/webhook", handleWebhook);

module.exports = router;