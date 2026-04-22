const express = require("express");
const router = express.Router();
const adminController = require("../controllers/adminController");
const { protect } = require("../middleware/authMiddleware");
const { adminOnly, superAdminOnly, authorize } = require("../middleware/roleMiddleware");
const walletVerificationController = require("../controllers/walletVerificationController");
const walletFundingController = require("../controllers/walletFundingController");

// Dashboard Stats
router.get("/stats", protect, adminOnly, adminController.getDashboardStats);

// User Management
router.get("/users", protect, adminOnly, adminController.getAllUsers);
router.patch("/users/:id", protect, adminOnly, adminController.updateUserStatus);
router.put("/users/:id", protect, adminOnly, adminController.updateUser);
router.delete("/users/:id", protect, superAdminOnly, adminController.deleteUser);

// Auction Management
router.get("/auctions", protect, adminOnly, adminController.getAllAuctions);
router.delete("/auctions/:id", protect, adminOnly, adminController.deleteAuction);

// Dispute Management
router.get("/disputes", protect, adminOnly, adminController.getAllDisputes);

// Withdrawal Management
router.get("/withdrawals", protect, adminOnly, adminController.getAllWithdrawals);

// Admin Management
router.post("/admins", protect, superAdminOnly, adminController.createAdmin);
router.post("/sellers", protect, superAdminOnly, adminController.createSeller);
router.get("/admins", protect, adminOnly, adminController.getAllAdmins);

// Auction Approval Workflow
router.post("/auctions/:id/submit", protect, adminOnly, adminController.submitAuctionForApproval);
router.post("/auctions/:id/approve", protect, superAdminOnly, adminController.approveAuction);
router.post("/auctions/:id/reject", protect, superAdminOnly, adminController.rejectAuction);

// Category Management (Super Admin only)
router.post("/categories", protect, superAdminOnly, adminController.createCategory);
router.get("/categories", protect, adminOnly, adminController.getAllCategories);
router.put("/categories/:id", protect, superAdminOnly, adminController.updateCategory);
router.delete("/categories/:id", protect, superAdminOnly, adminController.deleteCategory);

// Wallet Verification Workflow (Super Admin, Admin, Seller)
router.get(
  "/wallet-verifications",
  protect,
  authorize("super_admin", "admin", "seller"),
  walletVerificationController.getAllWalletVerifications
);
router.post(
  "/wallet-verifications/:id/decision",
  protect,
  authorize("super_admin", "admin", "seller"),
  walletVerificationController.submitWalletVerificationDecision
);

// Wallet Funding Workflow (Super Admin, Admin, Seller)
router.get(
  "/wallet-funding-requests",
  protect,
  authorize("super_admin", "admin", "seller"),
  walletFundingController.getAllFundingRequests
);
router.get(
  "/wallet-funding-requests/:userId",
  protect,
  authorize("super_admin", "admin", "seller"),
  walletFundingController.getFundingRequest
);
router.post(
  "/wallet-funding-requests/:userId/decision",
  protect,
  authorize("super_admin", "admin", "seller"),
  walletFundingController.decideFundingRequest
);
router.post(
  "/wallet-funding-requests/:userId/reset",
  protect,
  authorize("super_admin", "admin", "seller"),
  walletFundingController.resetFundingRequest
);

module.exports = router;
