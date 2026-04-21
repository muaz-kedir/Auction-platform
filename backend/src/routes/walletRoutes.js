const express = require("express");
const router = express.Router();

const {
getMyWallet,
deposit
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

module.exports = router;