const User = require("../models/User");
const Auction = require("../models/Auction");
const Bid = require("../models/Bid");
const Wallet = require("../models/Wallet");
const Withdraw = require("../models/Withdraw");
const Dispute = require("../models/Dispute");
const Notification = require("../models/Notification");
const Category = require("../models/Category");

// Get Dashboard Stats
exports.getDashboardStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalAuctions = await Auction.countDocuments();
    const activeAuctions = await Auction.countDocuments({ status: "ACTIVE" });
    const pendingWithdrawals = await Withdraw.countDocuments({ status: "PENDING" });
    const openDisputes = await Dispute.countDocuments({ status: "OPEN" });
    
    // Calculate total revenue (sum of all wallet transactions)
    const wallets = await Wallet.find();
    const totalRevenue = wallets.reduce((sum, wallet) => {
      const deposits = wallet.transactions
        .filter(t => t.type === "DEPOSIT")
        .reduce((s, t) => s + t.amount, 0);
      return sum + deposits;
    }, 0);

    res.json({
      totalUsers,
      totalAuctions,
      activeAuctions,
      totalRevenue,
      pendingWithdrawals,
      openDisputes
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get All Users (with pagination and search)
exports.getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = "", role = "" } = req.query;
    
    const query = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } }
      ];
    }
    if (role) {
      query.role = role;
    }

    const users = await User.find(query)
      .select("-password")
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const count = await User.countDocuments(query);

    // Get wallet balance for each user
    const usersWithWallet = await Promise.all(
      users.map(async (user) => {
        const wallet = await Wallet.findOne({ user: user._id });
        return {
          ...user.toObject(),
          walletBalance: wallet ? wallet.balance : 0
        };
      })
    );

    res.json({
      users: usersWithWallet,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      total: count
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update User Status (Ban/Suspend/Activate)
exports.updateUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { isBanned, verified } = req.body;

    const user = await User.findByIdAndUpdate(
      id,
      { isBanned, verified },
      { new: true }
    ).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ message: "User status updated", user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update User (Full Update including role)
exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, role, isBanned, verified } = req.body;

    // Only super_admin can change roles
    if (role && req.user.role !== "super_admin") {
      return res.status(403).json({ message: "Only super admin can change user roles" });
    }

    // Prevent changing super_admin role unless you are super_admin
    const targetUser = await User.findById(id);
    if (!targetUser) {
      return res.status(404).json({ message: "User not found" });
    }

    if (targetUser.role === "super_admin" && req.user.role !== "super_admin") {
      return res.status(403).json({ message: "Cannot modify super admin" });
    }

    // Prevent admin from modifying other admins
    if (targetUser.role === "admin" && req.user.role === "admin") {
      return res.status(403).json({ message: "Admins cannot modify other admins" });
    }

    const updateData = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (role) updateData.role = role;
    if (typeof isBanned !== 'undefined') updateData.isBanned = isBanned;
    if (typeof verified !== 'undefined') updateData.verified = verified;

    const user = await User.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    ).select("-password");

    res.json({ message: "User updated successfully", user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Delete User
exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    
    const user = await User.findByIdAndDelete(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ message: "User deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get All Auctions (with filters)
exports.getAllAuctions = async (req, res) => {
  try {
    const { page = 1, limit = 10, status = "", search = "" } = req.query;
    
    const query = {};
    if (status) {
      query.status = status;
    }
    if (search) {
      query.title = { $regex: search, $options: "i" };
    }

    const auctions = await Auction.find(query)
      .populate("seller", "name email")
      .populate("category", "name")
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const count = await Auction.countDocuments(query);

    // Get bid count for each auction
    const auctionsWithBids = await Promise.all(
      auctions.map(async (auction) => {
        const bidCount = await Bid.countDocuments({ auction: auction._id });
        return {
          ...auction.toObject(),
          bidCount
        };
      })
    );

    res.json({
      auctions: auctionsWithBids,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      total: count
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Delete Auction
exports.deleteAuction = async (req, res) => {
  try {
    const { id } = req.params;
    
    const auction = await Auction.findByIdAndDelete(id);
    if (!auction) {
      return res.status(404).json({ message: "Auction not found" });
    }

    res.json({ message: "Auction deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get All Disputes
exports.getAllDisputes = async (req, res) => {
  try {
    const { page = 1, limit = 10, status = "" } = req.query;
    
    const query = {};
    if (status) {
      query.status = status;
    }

    const disputes = await Dispute.find(query)
      .populate("auction", "title")
      .populate("buyer", "name email")
      .populate("seller", "name email")
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const count = await Dispute.countDocuments(query);

    res.json({
      disputes,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      total: count
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get All Withdrawals
exports.getAllWithdrawals = async (req, res) => {
  try {
    const { page = 1, limit = 10, status = "" } = req.query;
    
    const query = {};
    if (status) {
      query.status = status;
    }

    const withdrawals = await Withdraw.find(query)
      .populate("user", "name email")
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const count = await Withdraw.countDocuments(query);

    res.json({
      withdrawals,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      total: count
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Create Admin User
exports.createAdmin = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // Only super_admin can create admins
    if (req.user.role !== "super_admin") {
      return res.status(403).json({ message: "Only super admin can create admins" });
    }

    // Check if role is admin or super_admin
    if (role !== "admin" && role !== "super_admin") {
      return res.status(400).json({ message: "Invalid role" });
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: "User already exists" });
    }

    const bcrypt = require("bcryptjs");
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role,
      verified: true
    });

    const userResponse = {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt
    };

    res.status(201).json({
      message: "Admin created successfully",
      user: userResponse
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Create Seller User (Super Admin only)
exports.createSeller = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Only super_admin can create sellers
    if (req.user.role !== "super_admin") {
      return res.status(403).json({ message: "Only super admin can create sellers" });
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: "User already exists" });
    }

    const bcrypt = require("bcryptjs");
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role: "seller",
      verified: true
    });

    const userResponse = {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt
    };

    res.status(201).json({
      message: "Seller created successfully",
      user: userResponse
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get All Admins
exports.getAllAdmins = async (req, res) => {
  try {
    const admins = await User.find({
      role: { $in: ["admin", "super_admin"] }
    }).select("-password").sort({ createdAt: -1 });

    res.json({ admins });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Submit auction for approval (Admin → Super Admin)
exports.submitAuctionForApproval = async (req, res) => {
  try {
    const { id } = req.params;

    const auction = await Auction.findById(id);
    if (!auction) {
      return res.status(404).json({ message: "Auction not found" });
    }

    if (auction.approvalStatus !== "PENDING") {
      return res.status(400).json({ message: "Auction already submitted or processed" });
    }

    auction.approvalStatus = "SUBMITTED";
    auction.reviewedBy = req.user._id;
    await auction.save();

    res.json({
      message: "Auction submitted for Super Admin approval",
      auction
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Approve auction (Super Admin only)
exports.approveAuction = async (req, res) => {
  try {
    const { id } = req.params;

    if (req.user.role !== "super_admin") {
      return res.status(403).json({ message: "Only Super Admin can approve auctions" });
    }

    const auction = await Auction.findById(id);
    if (!auction) {
      return res.status(404).json({ message: "Auction not found" });
    }

    auction.approvalStatus = "APPROVED";
    auction.status = "ACTIVE";
    auction.reviewedBy = req.user._id;
    await auction.save();

    res.json({
      message: "Auction approved successfully",
      auction
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Reject auction (Super Admin only)
exports.rejectAuction = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    if (req.user.role !== "super_admin") {
      return res.status(403).json({ message: "Only Super Admin can reject auctions" });
    }

    const auction = await Auction.findById(id);
    if (!auction) {
      return res.status(404).json({ message: "Auction not found" });
    }

    auction.approvalStatus = "REJECTED";
    auction.status = "REJECTED";
    auction.rejectionReason = reason;
    auction.reviewedBy = req.user._id;
    await auction.save();

    res.json({
      message: "Auction rejected",
      auction
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ==================== CATEGORY MANAGEMENT ====================

// Create Category (Super Admin only)
exports.createCategory = async (req, res) => {
  try {
    if (req.user.role !== "super_admin") {
      return res.status(403).json({ message: "Only super admin can create categories" });
    }

    const { name } = req.body;
    if (!name || name.trim() === "") {
      return res.status(400).json({ message: "Category name is required" });
    }

    const existingCategory = await Category.findOne({ name: name.trim() });
    if (existingCategory) {
      return res.status(400).json({ message: "Category already exists" });
    }

    const category = await Category.create({ name: name.trim() });
    res.status(201).json({
      message: "Category created successfully",
      category
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get All Categories
exports.getAllCategories = async (req, res) => {
  try {
    const categories = await Category.find().sort({ name: 1 });
    res.json({ categories });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update Category (Super Admin only)
exports.updateCategory = async (req, res) => {
  try {
    if (req.user.role !== "super_admin") {
      return res.status(403).json({ message: "Only super admin can update categories" });
    }

    const { id } = req.params;
    const { name } = req.body;

    if (!name || name.trim() === "") {
      return res.status(400).json({ message: "Category name is required" });
    }

    const existingCategory = await Category.findOne({ name: name.trim(), _id: { $ne: id } });
    if (existingCategory) {
      return res.status(400).json({ message: "Category name already exists" });
    }

    const category = await Category.findByIdAndUpdate(
      id,
      { name: name.trim() },
      { new: true }
    );

    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    res.json({
      message: "Category updated successfully",
      category
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Delete Category (Super Admin only)
exports.deleteCategory = async (req, res) => {
  try {
    if (req.user.role !== "super_admin") {
      return res.status(403).json({ message: "Only super admin can delete categories" });
    }

    const { id } = req.params;

    // Check if category is used in any auction
    const auctionCount = await Auction.countDocuments({ category: id });
    if (auctionCount > 0) {
      return res.status(400).json({ message: "Cannot delete category - it is used in auctions" });
    }

    const category = await Category.findByIdAndDelete(id);
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    res.json({ message: "Category deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

