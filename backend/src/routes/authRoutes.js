const express = require("express");
const router = express.Router();

const {
register,
login,
updateFcmToken
} = require("../controllers/authController");

router.post("/register", register);
router.post("/login", login);
router.post("/fcm-token", updateFcmToken);

module.exports = router;