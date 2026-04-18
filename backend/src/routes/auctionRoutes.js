const express = require("express");
const router = express.Router();

const {
createAuction,
getAuctions,
getAuctionById
} = require("../controllers/auctionController");

const { protect: auth } = require("../middleware/authMiddleware");
const { auctionUpload } = require("../middleware/cloudinaryUpload");

router.post(
"/",
auth,
auctionUpload.array("images", 5),
createAuction
);

router.get("/", getAuctions);

router.get("/:id", getAuctionById);

module.exports = router;