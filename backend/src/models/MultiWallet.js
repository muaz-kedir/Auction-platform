const mongoose = require("mongoose");

const walletFundingSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true },
    phone: { type: String, required: true },
    email: { type: String, required: true },
    location: { type: String, required: true },
    walletAmount: { type: Number, required: true },
    escrowAmount: { type: Number, required: true },
  },
  { _id: false }
);

const approvalSchema = new mongoose.Schema(
  {
    role: { type: String, enum: ["super_admin", "admin", "seller"], required: true },
    decision: { type: String, enum: ["approved", "rejected"], required: true },
    decidedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    decidedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

// Sub-wallet schema for Primary and Secondary wallets
const subWalletSchema = new mongoose.Schema(
  {
    balance: { type: Number, default: 0, min: 0 },
    heldBalance: { type: Number, default: 0, min: 0 },
  },
  { _id: false }
);

const multiWalletSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      unique: true,
      required: true,
    },

    // Primary Wallet - Main usable balance
    primaryWallet: {
      type: subWalletSchema,
      default: () => ({ balance: 0, heldBalance: 0 }),
    },

    // Secondary Wallet - Additional or reserved funds
    secondaryWallet: {
      type: subWalletSchema,
      default: () => ({ balance: 0, heldBalance: 0 }),
    },

    // Total earnings across all wallets
    totalEarnings: {
      type: Number,
      default: 0,
    },

    walletVerified: {
      type: Boolean,
      default: false,
    },

    maxBiddingAmount: {
      type: Number,
      default: null,
    },

    // Wallet Funding System Fields
    fundingStatus: {
      type: String,
      enum: ["not_created", "pending", "approved", "rejected"],
      default: "not_created",
    },

    fundingRequest: {
      type: walletFundingSchema,
      default: null,
    },

    approvals: {
      type: [approvalSchema],
      default: [],
    },

    // Legacy fields for backward compatibility
    balance: {
      type: Number,
      default: 0,
    },

    heldBalance: {
      type: Number,
      default: 0,
    },

    remainingBalance: {
      type: Number,
      default: 0,
    },

    totalUsedAmount: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

// Virtual for total balance across all wallets
multiWalletSchema.virtual("totalBalance").get(function () {
  const primary = this.primaryWallet?.balance || 0;
  const secondary = this.secondaryWallet?.balance || 0;
  return primary + secondary;
});

// Virtual for total held balance across all wallets
multiWalletSchema.virtual("totalHeldBalance").get(function () {
  const primary = this.primaryWallet?.heldBalance || 0;
  const secondary = this.secondaryWallet?.heldBalance || 0;
  return primary + secondary;
});

// Virtual for total available balance (balance - held)
multiWalletSchema.virtual("totalAvailableBalance").get(function () {
  const primary = (this.primaryWallet?.balance || 0) - (this.primaryWallet?.heldBalance || 0);
  const secondary = (this.secondaryWallet?.balance || 0) - (this.secondaryWallet?.heldBalance || 0);
  return primary + secondary;
});

// Method to get wallet by type
multiWalletSchema.methods.getWallet = function (type) {
  if (type === "secondary") return this.secondaryWallet;
  return this.primaryWallet;
};

// Method to check if sufficient balance exists in a specific wallet
multiWalletSchema.methods.hasSufficientBalance = function (type, amount) {
  const wallet = this.getWallet(type);
  const available = (wallet?.balance || 0) - (wallet?.heldBalance || 0);
  return available >= amount;
};

// Method to get available balance for a specific wallet
multiWalletSchema.methods.getAvailableBalance = function (type) {
  const wallet = this.getWallet(type);
  return (wallet?.balance || 0) - (wallet?.heldBalance || 0);
};

// Method to hold funds in a specific wallet
multiWalletSchema.methods.holdFunds = async function (type, amount) {
  const wallet = this.getWallet(type);
  const available = (wallet.balance || 0) - (wallet.heldBalance || 0);

  if (available < amount) {
    throw new Error(`Insufficient balance in ${type} wallet`);
  }

  wallet.heldBalance = (wallet.heldBalance || 0) + amount;
  return this.save();
};

// Method to release held funds in a specific wallet
multiWalletSchema.methods.releaseHeldFunds = async function (type, amount) {
  const wallet = this.getWallet(type);

  if ((wallet.heldBalance || 0) < amount) {
    throw new Error(`Insufficient held balance in ${type} wallet`);
  }

  wallet.heldBalance = (wallet.heldBalance || 0) - amount;
  return this.save();
};

// Method to deduct held funds (when user wins auction)
multiWalletSchema.methods.deductHeldFunds = async function (type, amount) {
  const wallet = this.getWallet(type);

  if ((wallet.heldBalance || 0) < amount) {
    throw new Error(`Insufficient held balance in ${type} wallet`);
  }

  if ((wallet.balance || 0) < amount) {
    throw new Error(`Insufficient balance in ${type} wallet`);
  }

  wallet.heldBalance = (wallet.heldBalance || 0) - amount;
  wallet.balance = (wallet.balance || 0) - amount;
  return this.save();
};

// Method to add funds to a specific wallet
multiWalletSchema.methods.addFunds = async function (type, amount) {
  const wallet = this.getWallet(type);
  wallet.balance = (wallet.balance || 0) + amount;
  return this.save();
};

// Method to transfer between wallets
multiWalletSchema.methods.transfer = async function (fromType, toType, amount) {
  const fromWallet = this.getWallet(fromType);
  const toWallet = this.getWallet(toType);

  const availableFrom = (fromWallet.balance || 0) - (fromWallet.heldBalance || 0);

  if (availableFrom < amount) {
    throw new Error(`Insufficient available balance in ${fromType} wallet`);
  }

  fromWallet.balance = (fromWallet.balance || 0) - amount;
  toWallet.balance = (toWallet.balance || 0) + amount;

  return this.save();
};

// Pre-save middleware to sync legacy fields with new wallet structure
multiWalletSchema.pre("save", function (next) {
  // Sync legacy fields for backward compatibility
  this.balance = this.totalBalance;
  this.heldBalance = this.totalHeldBalance;
  this.remainingBalance = this.totalAvailableBalance;
  next();
});

module.exports = mongoose.model("MultiWallet", multiWalletSchema);
