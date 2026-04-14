const User = require("../models/User");
const Auction = require("../models/Auction");
const Bid = require("../models/Bid");
const Wallet = require("../models/Wallet");
const Withdraw = require("../models/Withdraw");
const Dispute = require("../models/Dispute");
const Notification = require("../models/Notification");

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
