const express = require("express");
const router = express.Router();

const {
  createAuction,
  getAuctions,
  getAuctionById,
  approveAuction,
  rejectAuction,
  getPendingAuctions,
  updateAuction,
  deleteAuction
} = require("../controllers/auctionController");

const { protect: auth } = require("../middleware/authMiddleware");
const { auctionUpload } = require("../middleware/cloudinaryUpload");

// Public routes
router.get("/", getAuctions);
router.get("/:id", getAuctionById);

// Protected routes - Create auction
router.post(
  "/",
  auth,
  (req, res, next) => {
    // Use any() to accept both files and regular form fields
    const upload = auctionUpload.any();
    upload(req, res, (err) => {
      if (err) {
        console.error("Multer error:", err.message);
        return res.status(400).json({ error: err.message });
      }
      // Move files to req.files if they exist
      if (req.files && req.files.length > 0) {
        req.files = req.files.filter(f => f.fieldname === "images");
      }
      next();
    });
  },
  createAuction
);

// Super Admin only routes - Auction Approval
router.get("/admin/pending", auth, getPendingAuctions);
router.put("/:id/approve", auth, approveAuction);
router.put("/:id/reject", auth, rejectAuction);

// Update and Delete auction (Seller can update/delete their own, Admin/Super Admin can update/delete any)
router.put("/:id", auth, (req, res, next) => {
  const upload = auctionUpload.any();
  upload(req, res, (err) => {
    if (err) {
      console.error("Multer error:", err.message);
      return res.status(400).json({ error: err.message });
    }
    if (req.files && req.files.length > 0) {
      req.files = req.files.filter(f => f.fieldname === "images");
    }
    next();
  });
}, updateAuction);

router.delete("/:id", auth, deleteAuction);

module.exports = router;