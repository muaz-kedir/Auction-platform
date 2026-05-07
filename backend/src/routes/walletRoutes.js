const express = require("express");
const router = express.Router();

const {
  getMyWallet,
  deposit,
  transfer,
  getTransactionHistory,
  submitFundingRequest,
  getFundingStatus,
  canBid,
  placeBidWithWallet,
  getWalletSummary,
  processAuctionWin,
  refundLostAuction,
} = require("../controllers/multiWalletController");

const {
  submitWalletVerification,
  getMyWalletVerification,
} = require("../controllers/walletVerificationController");

const { protect: auth } = require("../middleware/authMiddleware");
const { walletVerificationUpload } = require("../middleware/walletVerificationUpload");

// Wallet overview and balance
router.get("/", auth, getMyWallet);
router.get("/summary", auth, getWalletSummary);

// Deposits and transfers
router.post("/deposit", auth, deposit);
router.post("/transfer", auth, transfer);

// Transaction history
router.get("/transactions", auth, getTransactionHistory);

// Wallet verification
router.get("/verification/my", auth, getMyWalletVerification);
router.post(
  "/verification/submit",
  auth,
  walletVerificationUpload.single("bankStatement"),
  submitWalletVerification
);

// Wallet Funding System
router.post("/funding/submit", auth, submitFundingRequest);
router.get("/funding/status", auth, getFundingStatus);

// Bidding
router.get("/can-bid", auth, canBid);
router.post("/bid", auth, placeBidWithWallet);

// Auction results
router.post("/process-win", auth, processAuctionWin);
router.post("/refund-lost", auth, refundLostAuction);

module.exports = router;