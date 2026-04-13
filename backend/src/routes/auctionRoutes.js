const express = require("express");
const router = express.Router();

const {
createAuction,
getAuctions,
getAuctionById
} = require("../controllers/auctionController");

const auth = require("../middleware/authMiddleware");
const upload = require("../middleware/upload");

router.post(
"/",
auth,
(req, res, next) => {
// If no files, skip upload middleware
if (!req.headers['content-type']?.includes('multipart/form-data')) {
return next();
}
upload.array("images", 5)(req, res, next);
},
createAuction
);

router.get("/", getAuctions);

router.get("/:id", getAuctionById);

module.exports = router;