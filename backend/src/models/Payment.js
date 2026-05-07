const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    tx_ref: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      default: "ETB",
      enum: ["ETB", "USD"],
    },
    status: {
      type: String,
      enum: ["pending", "success", "failed", "cancelled"],
      default: "pending",
      index: true,
    },
    method: {
      type: String,
      default: "chapa",
      enum: ["chapa", "stripe", "manual"],
    },
    // Chapa specific fields
    chapaReference: {
      type: String,
      default: null,
    },
    chapaResponse: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    // Customer details (snapshot at payment time)
    customerEmail: {
      type: String,
      required: true,
    },
    customerName: {
      type: String,
      required: true,
    },
    customerPhone: {
      type: String,
      default: null,
    },
    // Callback/Redirect tracking
    callbackUrl: {
      type: String,
      required: true,
    },
    returnUrl: {
      type: String,
      required: true,
    },
    // Verification tracking
    verifiedAt: {
      type: Date,
      default: null,
    },
    verificationResponse: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    // Failure tracking
    failureReason: {
      type: String,
      default: null,
    },
    // IP and user agent for security
    ipAddress: {
      type: String,
      default: null,
    },
    userAgent: {
      type: String,
      default: null,
    },
    // Metadata
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient queries
paymentSchema.index({ createdAt: -1 });
paymentSchema.index({ userId: 1, status: 1 });
paymentSchema.index({ userId: 1, createdAt: -1 });

// Static method to generate unique transaction reference
paymentSchema.statics.generateTxRef = function (userId) {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  const userPart = userId.toString().slice(-6);
  return `AUC_${userPart}_${timestamp}_${random}`;
};

// Instance method to verify if payment can be processed (prevent double processing)
paymentSchema.methods.canProcess = function () {
  return this.status === "pending" && !this.verifiedAt;
};

// Instance method to mark as success
paymentSchema.methods.markSuccess = async function (verificationData, session = null) {
  this.status = "success";
  this.verifiedAt = new Date();
  this.verificationResponse = verificationData;
  
  const options = session ? { session } : {};
  return this.save(options);
};

// Instance method to mark as failed
paymentSchema.methods.markFailed = async function (reason, session = null) {
  this.status = "failed";
  this.failureReason = reason;
  
  const options = session ? { session } : {};
  return this.save(options);
};

// Pre-save hook to ensure data consistency
paymentSchema.pre("save", function (next) {
  // Ensure amount is always positive
  if (this.amount < 0) {
    this.amount = Math.abs(this.amount);
  }
  
  // If status changed to success, ensure verifiedAt is set
  if (this.status === "success" && !this.verifiedAt) {
    this.verifiedAt = new Date();
  }
  
  next();
});

const Payment = mongoose.model("Payment", paymentSchema);

module.exports = Payment;
