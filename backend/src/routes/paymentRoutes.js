const express = require("express");
const router = express.Router();

const {
requestWithdraw,
approveWithdraw
} = require("../controllers/withdrawController");

const { protect: auth } = require("../middleware/authMiddleware");

router.post("/", auth, requestWithdraw);
router.put("/:id/approve", auth, approveWithdraw);

module.exports = router;