const express = require("express");
const router = express.Router();

const {
  getMyWallet,
  deposit,
  submitFundingRequest,
  getFundingStatus,
  canBid,
  placeBidWithWallet,
  refundBid
} = require("../controllers/walletController");
const {
  submitWalletVerification,
  getMyWalletVerification,
} = require("../controllers/walletVerificationController");

const { protect: auth } = require("../middleware/authMiddleware");
const { walletVerificationUpload } = require("../middleware/walletVerificationUpload");

router.get("/", auth, getMyWallet);
router.post("/deposit", auth, deposit);
router.get("/verification/my", auth, getMyWalletVerification);
router.post(
  "/verification/submit",
  auth,
  walletVerificationUpload.single("bankStatement"),
  submitWalletVerification
);

// Wallet Funding System Routes
router.post("/funding/submit", auth, submitFundingRequest);
router.get("/funding/status", auth, getFundingStatus);
router.get("/can-bid", auth, canBid);
router.post("/bid", auth, placeBidWithWallet);
router.post("/refund", auth, refundBid);

module.exports = router;