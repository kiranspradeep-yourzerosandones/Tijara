// backend/models/User.js
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Name is required"],
    trim: true,
    maxlength: [50, "Name cannot exceed 50 characters"]
  },

  phone: {
    type: String,
    required: [true, "Phone number is required"],
    unique: true,
    trim: true,
    match: [/^[6-9]\d{9}$/, "Please enter a valid 10-digit Indian phone number"]
  },

  email: {
    type: String,
    trim: true,
    lowercase: true,
    sparse: true,
    match: [/^\S+@\S+\.\S+$/, "Please enter a valid email address"]
  },

  password: {
    type: String,
    required: [true, "Password is required"],
    minlength: [6, "Password must be at least 6 characters"],
    select: false
  },

  isPhoneVerified: {
    type: Boolean,
    default: false
  },

  isEmailVerified: {
    type: Boolean,
    default: false
  },

  isActive: {
    type: Boolean,
    default: true
  },

  passwordResetToken: {
    type: String,
    select: false
  },
  
  passwordResetExpires: {
    type: Date,
    select: false
  },

  loginVerificationId: String,
  loginOtpExpires: Date,
  loginOtpAttempts: { 
    type: Number, 
    default: 0 
  },

  resetVerificationId: String,
  resetOtpExpires: Date,
  resetOtpAttempts: { 
    type: Number, 
    default: 0 
  },

  otpCycleFailures: { 
    type: Number, 
    default: 0 
  },
  
  otpLockedUntil: Date,

  businessName: { 
    type: String, 
    trim: true 
  },
  
  businessType: { 
    type: String, 
    trim: true 
  },
  
  gstNumber: { 
    type: String, 
    trim: true,
    uppercase: true,
    match: [/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/, "Please enter a valid GST number"]
  },

  creditLimit: { 
    type: Number, 
    default: 0,
    min: 0
  },
  
  totalCredit: { 
    type: Number, 
    default: 0,
    min: 0
  },
  
  pendingAmount: { 
    type: Number, 
    default: 0,
    min: 0
  },
  
  totalPaid: { 
    type: Number, 
    default: 0,
    min: 0
  },
  
  lastPaymentDate: Date,
  
  paymentTerms: { 
    type: Number, 
    default: 30,
    min: 0,
    max: 365
  },

  isCreditBlocked: { 
    type: Boolean, 
    default: false
  },
  
  creditBlockedReason: String,
  
  creditBlockedAt: Date,
  
  creditBlockedBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Admin"
  },

  profileImage: String,
  
  address: {
    line1: String,
    line2: String,
    city: String,
    state: String,
    pincode: {
      type: String,
      match: [/^[1-9][0-9]{5}$/, "Please enter a valid 6-digit pincode"]
    },
    country: { 
      type: String, 
      default: "India" 
    }
  },

  fcmToken: String,
  
  lastLoginAt: Date,
  
  adminNotes: { 
    type: String, 
    maxlength: 2000 
  },

  role: {
    type: String,
    enum: ["customer"],
    default: "customer"
  }

}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// ============================================================
// INDEXES
// ============================================================
userSchema.index({ isActive: 1 });
userSchema.index({ isCreditBlocked: 1 });
userSchema.index({ pendingAmount: 1 });
userSchema.index({ createdAt: -1 });

// ============================================================
// VIRTUALS
// ============================================================

userSchema.virtual('availableCredit').get(function() {
  if (this.isCreditBlocked) return 0;
  return Math.max(0, (this.creditLimit || 0) - (this.pendingAmount || 0));
});

userSchema.virtual('creditUtilization').get(function() {
  if (!this.creditLimit || this.creditLimit === 0) return 0;
  return Math.round(((this.pendingAmount || 0) / this.creditLimit) * 100);
});

userSchema.virtual('fullName').get(function() {
  return this.name;
});

// ============================================================
// PRE-SAVE HOOKS - ✅ FIXED
// ============================================================

/**
 * Hash password before saving
 */
userSchema.pre("save", async function() {
  if (!this.isModified("password")) {
    return;
  }

  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    console.log(`✅ Password hashed for user: ${this.phone}`);
  } catch (error) {
    console.error("❌ Password hashing error:", error);
    throw error;
  }
});

/**
 * Validate credit limit vs pending amount
 */
userSchema.pre("save", function() {
  if (this.isModified("pendingAmount") || this.isModified("creditLimit")) {
    if (this.pendingAmount > this.creditLimit && this.creditLimit > 0) {
      console.warn(`⚠️ Pending amount (${this.pendingAmount}) exceeds credit limit (${this.creditLimit}) for user: ${this.phone}`);
    }
  }
});

// ============================================================
// INSTANCE METHODS
// ============================================================

userSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    console.error("Password comparison error:", error);
    return false;
  }
};

userSchema.methods.generatePasswordResetToken = function() {
  const resetToken = crypto.randomBytes(32).toString('hex');
  
  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
  
  this.passwordResetExpires = Date.now() + 60 * 60 * 1000;
  
  return resetToken;
};

userSchema.methods.getPublicProfile = function() {
  return {
    id: this._id,
    name: this.name,
    phone: this.phone,
    email: this.email,
    isPhoneVerified: this.isPhoneVerified,
    isEmailVerified: this.isEmailVerified,
    isActive: this.isActive,
    
    businessName: this.businessName,
    businessType: this.businessType,
    gstNumber: this.gstNumber,
    
    creditLimit: this.creditLimit || 0,
    pendingAmount: this.pendingAmount || 0,
    totalPaid: this.totalPaid || 0,
    totalCredit: this.totalCredit || 0,
    availableCredit: this.availableCredit,
    creditUtilization: this.creditUtilization,
    isCreditBlocked: this.isCreditBlocked || false,
    creditBlockedReason: this.creditBlockedReason,
    paymentTerms: this.paymentTerms || 30,
    lastPaymentDate: this.lastPaymentDate,
    
    profileImage: this.profileImage,
    address: this.address,
    
    lastLoginAt: this.lastLoginAt,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
    
    role: this.role || "customer"
  };
};

userSchema.methods.getCreditSummary = function() {
  return {
    creditLimit: this.creditLimit || 0,
    pendingAmount: this.pendingAmount || 0,
    totalPaid: this.totalPaid || 0,
    totalCredit: this.totalCredit || 0,
    availableCredit: this.availableCredit,
    creditUtilization: this.creditUtilization,
    isCreditBlocked: this.isCreditBlocked || false,
    creditBlockedReason: this.creditBlockedReason,
    creditBlockedAt: this.creditBlockedAt,
    paymentTerms: this.paymentTerms || 30,
    lastPaymentDate: this.lastPaymentDate
  };
};

userSchema.methods.clearLoginOtp = function() {
  this.loginVerificationId = undefined;
  this.loginOtpExpires = undefined;
  this.loginOtpAttempts = 0;
};

userSchema.methods.clearResetOtp = function() {
  this.resetVerificationId = undefined;
  this.resetOtpExpires = undefined;
  this.resetOtpAttempts = 0;
};

userSchema.methods.clearPasswordReset = function() {
  this.passwordResetToken = undefined;
  this.passwordResetExpires = undefined;
};

userSchema.methods.canPlaceOrder = function(orderAmount) {
  if (!this.isActive) {
    return { 
      allowed: false, 
      reason: "Your account is deactivated. Please contact support." 
    };
  }

  if (this.isCreditBlocked) {
    return { 
      allowed: false, 
      reason: this.creditBlockedReason || "Your credit is blocked. Please contact support." 
    };
  }

  if (orderAmount > this.availableCredit) {
    return { 
      allowed: false, 
      reason: `Insufficient credit. Available: ₹${this.availableCredit}, Required: ₹${orderAmount}` 
    };
  }

  return { allowed: true };
};

userSchema.methods.addToPending = async function(amount) {
  this.pendingAmount = (this.pendingAmount || 0) + amount;
  this.totalCredit = (this.totalCredit || 0) + amount;
  return this.save();
};

userSchema.methods.recordPayment = async function(amount) {
  this.pendingAmount = Math.max(0, (this.pendingAmount || 0) - amount);
  this.totalPaid = (this.totalPaid || 0) + amount;
  this.lastPaymentDate = new Date();
  return this.save();
};

userSchema.methods.isOtpLocked = function() {
  if (!this.otpLockedUntil) return { locked: false };
  
  const now = new Date();
  const lockedUntil = new Date(this.otpLockedUntil);
  
  if (lockedUntil > now) {
    const minutesRemaining = Math.ceil((lockedUntil - now) / 60000);
    return { 
      locked: true, 
      minutesRemaining 
    };
  }
  
  return { locked: false };
};

// ============================================================
// STATIC METHODS
// ============================================================

userSchema.statics.verifyPasswordResetToken = async function(token) {
  const hashedToken = crypto
    .createHash('sha256')
    .update(token)
    .digest('hex');

  return this.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() }
  }).select('+passwordResetToken +passwordResetExpires');
};

userSchema.statics.findUsersWithPendingCredit = function() {
  return this.find({
    isActive: true,
    pendingAmount: { $gt: 0 }
  }).select('name phone businessName pendingAmount creditLimit');
};

userSchema.statics.findOverdueUsers = function(days = 30) {
  const overdueDate = new Date();
  overdueDate.setDate(overdueDate.getDate() - days);
  
  return this.find({
    isActive: true,
    pendingAmount: { $gt: 0 },
    lastPaymentDate: { $lt: overdueDate }
  }).select('name phone businessName pendingAmount lastPaymentDate paymentTerms');
};

userSchema.statics.getCreditStats = async function() {
  const stats = await this.aggregate([
    {
      $match: { isActive: true }
    },
    {
      $group: {
        _id: null,
        totalUsers: { $sum: 1 },
        totalCreditLimit: { $sum: "$creditLimit" },
        totalPendingAmount: { $sum: "$pendingAmount" },
        totalPaid: { $sum: "$totalPaid" },
        usersWithPending: {
          $sum: { $cond: [{ $gt: ["$pendingAmount", 0] }, 1, 0] }
        },
        blockedUsers: {
          $sum: { $cond: ["$isCreditBlocked", 1, 0] }
        }
      }
    }
  ]);

  return stats[0] || {
    totalUsers: 0,
    totalCreditLimit: 0,
    totalPendingAmount: 0,
    totalPaid: 0,
    usersWithPending: 0,
    blockedUsers: 0
  };
};

module.exports = mongoose.model("User", userSchema);