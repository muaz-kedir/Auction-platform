const express = require("express");
const router = express.Router();

const {
createDispute,
resolveDispute
} = require("../controllers/disputeController");

const auth = require("../middleware/authMiddleware");

router.post("/", auth, createDispute);
router.put("/:id/resolve", auth, resolveDispute);

module.exports = router;