const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

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

  password: {
    type: String,
    required: [true, "Password is required"],
    minlength: [6, "Password must be at least 6 characters"],
    select: false
  },

  role: {
    type: String,
    enum: ["customer", "admin"],
    default: "customer"
  },

  isPhoneVerified: {
    type: Boolean,
    default: false
  },

  isActive: {
    type: Boolean,
    default: true
  },

  // ========== OTP Fields (Message Central) ==========
  
  registrationVerificationId: {
    type: String,
    default: null
  },
  registrationOtpExpires: {
    type: Date,
    default: null
  },
  registrationOtpAttempts: {
    type: Number,
    default: 0
  },

  loginVerificationId: {
    type: String,
    default: null
  },
  loginOtpExpires: {
    type: Date,
    default: null
  },
  loginOtpAttempts: {
    type: Number,
    default: 0
  },

  resetVerificationId: {
    type: String,
    default: null
  },
  resetOtpExpires: {
    type: Date,
    default: null
  },
  resetOtpAttempts: {
    type: Number,
    default: 0
  },

  otpCycleFailures: {
    type: Number,
    default: 0
  },
  otpLockedUntil: {
    type: Date,
    default: null
  },

  // ========== Business Details (B2B) ==========
  
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
    trim: true
  },

  // ========== CREDIT & PAYMENT TRACKING ==========
  
  // Credit limit assigned by admin
  creditLimit: {
    type: Number,
    default: 0
  },

  // Total credit used (lifetime orders value)
  totalCredit: {
    type: Number,
    default: 0
  },

  // Current pending/outstanding amount
  pendingAmount: {
    type: Number,
    default: 0
  },

  // Total amount paid (lifetime)
  totalPaid: {
    type: Number,
    default: 0
  },

  // Last payment date
  lastPaymentDate: {
    type: Date
  },

  // Payment terms (in days)
  paymentTerms: {
    type: Number,
    default: 30
  },

  // Is credit blocked
  isCreditBlocked: {
    type: Boolean,
    default: false
  },

  creditBlockedReason: String,
  creditBlockedAt: Date,
  creditBlockedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },

  // ========== Profile ==========
  
  email: {
    type: String,
    trim: true,
    lowercase: true
  },

  profileImage: {
    type: String
  },

  fcmToken: {
    type: String
  },

  lastLoginAt: {
    type: Date
  }

}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
userSchema.index({ phone: 1 });
userSchema.index({ role: 1 });
userSchema.index({ isCreditBlocked: 1 });

// Virtual for available credit
userSchema.virtual('availableCredit').get(function() {
  if (this.isCreditBlocked) return 0;
  return Math.max(0, this.creditLimit - this.pendingAmount);
});

// Virtual for credit utilization percentage
userSchema.virtual('creditUtilization').get(function() {
  if (this.creditLimit === 0) return 0;
  return Math.round((this.pendingAmount / this.creditLimit) * 100);
});

// Hash password before saving
userSchema.pre("save", async function(next) {
  if (!this.isModified("password")) {
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Get public profile
userSchema.methods.getPublicProfile = function() {
  return {
    id: this._id,
    name: this.name,
    phone: this.phone,
    role: this.role,
    isPhoneVerified: this.isPhoneVerified,
    businessName: this.businessName,
    businessType: this.businessType,
    email: this.email,
    profileImage: this.profileImage,
    creditLimit: this.creditLimit,
    totalCredit: this.totalCredit,
    pendingAmount: this.pendingAmount,
    totalPaid: this.totalPaid,
    availableCredit: this.availableCredit,
    creditUtilization: this.creditUtilization,
    isCreditBlocked: this.isCreditBlocked,
    paymentTerms: this.paymentTerms,
    lastPaymentDate: this.lastPaymentDate,
    createdAt: this.createdAt
  };
};

// Get credit summary
userSchema.methods.getCreditSummary = function() {
  return {
    creditLimit: this.creditLimit,
    pendingAmount: this.pendingAmount,
    availableCredit: this.availableCredit,
    creditUtilization: this.creditUtilization,
    totalPaid: this.totalPaid,
    isCreditBlocked: this.isCreditBlocked,
    paymentTerms: this.paymentTerms,
    lastPaymentDate: this.lastPaymentDate
  };
};

// Clear OTP fields helpers
userSchema.methods.clearRegistrationOtp = function() {
  this.registrationVerificationId = null;
  this.registrationOtpExpires = null;
  this.registrationOtpAttempts = 0;
};

userSchema.methods.clearLoginOtp = function() {
  this.loginVerificationId = null;
  this.loginOtpExpires = null;
  this.loginOtpAttempts = 0;
};

userSchema.methods.clearResetOtp = function() {
  this.resetVerificationId = null;
  this.resetOtpExpires = null;
  this.resetOtpAttempts = 0;
};

module.exports = mongoose.model("User", userSchema);