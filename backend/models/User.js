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
    sparse: true,  // Allow null but unique when present
    match: [/^\S+@\S+\.\S+$/, "Please enter a valid email address"]
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

  isEmailVerified: {
    type: Boolean,
    default: false
  },

  isActive: {
    type: Boolean,
    default: true
  },

  // ========== PASSWORD RESET (Email) ==========
  passwordResetToken: {
    type: String,
    select: false
  },
  passwordResetExpires: {
    type: Date,
    select: false
  },

  // ========== OTP Fields (Message Central - Phone) ==========
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
  creditLimit: {
    type: Number,
    default: 0
  },

  totalCredit: {
    type: Number,
    default: 0
  },

  pendingAmount: {
    type: Number,
    default: 0
  },

  totalPaid: {
    type: Number,
    default: 0
  },

  lastPaymentDate: {
    type: Date
  },

  paymentTerms: {
    type: Number,
    default: 30
  },

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
  profileImage: {
    type: String
  },

  address: {
    line1: String,
    line2: String,
    city: String,
    state: String,
    pincode: String,
    country: { type: String, default: "India" }
  },

  fcmToken: {
    type: String
  },

  lastLoginAt: {
    type: Date
  },

  // ========== Admin Notes ==========
  adminNotes: {
    type: String,
    maxlength: 2000
  }

}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
userSchema.index({ phone: 1 }, { unique: true });
userSchema.index({ email: 1 }, { sparse: true });
userSchema.index({ role: 1 });
userSchema.index({ isCreditBlocked: 1 });
userSchema.index({ isActive: 1 });

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

// Virtual for full address
userSchema.virtual('fullAddress').get(function() {
  if (!this.address) return null;
  const parts = [
    this.address.line1,
    this.address.line2,
    this.address.city,
    this.address.state,
    this.address.pincode
  ].filter(Boolean);
  return parts.join(', ');
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

// Generate password reset token
userSchema.methods.generatePasswordResetToken = function() {
  // Generate random token
  const resetToken = crypto.randomBytes(32).toString('hex');

  // Hash token and save to database
  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  // Set expiry (1 hour)
  this.passwordResetExpires = Date.now() + 60 * 60 * 1000;

  // Return unhashed token (to send via email)
  return resetToken;
};

// Verify password reset token
userSchema.statics.verifyPasswordResetToken = async function(token) {
  const hashedToken = crypto
    .createHash('sha256')
    .update(token)
    .digest('hex');

  const user = await this.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() }
  }).select('+passwordResetToken +passwordResetExpires');

  return user;
};

// Get public profile
userSchema.methods.getPublicProfile = function() {
  return {
    id: this._id,
    name: this.name,
    phone: this.phone,
    email: this.email,
    role: this.role,
    isPhoneVerified: this.isPhoneVerified,
    isEmailVerified: this.isEmailVerified,
    businessName: this.businessName,
    businessType: this.businessType,
    gstNumber: this.gstNumber,
    profileImage: this.profileImage,
    address: this.address,
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

// Clear password reset fields
userSchema.methods.clearPasswordReset = function() {
  this.passwordResetToken = undefined;
  this.passwordResetExpires = undefined;
};

module.exports = mongoose.model("User", userSchema); ``