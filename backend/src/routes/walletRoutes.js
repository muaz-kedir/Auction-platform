const express = require("express");
const router = express.Router();

const {
getMyWallet,
deposit
} = require("../controllers/walletController");

const { protect: auth } = require("../middleware/authMiddleware");

router.get("/", auth, getMyWallet);
router.post("/deposit", auth, deposit);

module.exports = router;