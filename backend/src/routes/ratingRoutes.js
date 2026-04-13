const express = require("express");
const router = express.Router();

const {
addRating,
getSellerRatings
} = require("../controllers/ratingController");

const auth = require("../middleware/authMiddleware");

router.post("/", auth, addRating);
router.get("/:id", getSellerRatings);

module.exports = router;