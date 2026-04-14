const express = require("express");
const router = express.Router();

const {
requestWithdraw,
approveWithdraw
} = require("../controllers/withdrawController");

const { protect } = require("../middleware/authMiddleware");

router.post("/", protect, requestWithdraw);
router.put("/:id/approve", protect, approveWithdraw);

module.exports = router;