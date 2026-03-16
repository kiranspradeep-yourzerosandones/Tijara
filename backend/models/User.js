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

  // Password Reset (Email)
  passwordResetToken: {
    type: String,
    select: false
  },
  passwordResetExpires: {
    type: Date,
    select: false
  },

  // OTP Fields
  loginVerificationId: String,
  loginOtpExpires: Date,
  loginOtpAttempts: { type: Number, default: 0 },

  resetVerificationId: String,
  resetOtpExpires: Date,
  resetOtpAttempts: { type: Number, default: 0 },

  otpCycleFailures: { type: Number, default: 0 },
  otpLockedUntil: Date,

  // Business Details
  businessName: { type: String, trim: true },
  businessType: { type: String, trim: true },
  gstNumber: { type: String, trim: true },

  // Credit & Payment
  creditLimit: { type: Number, default: 0 },
  totalCredit: { type: Number, default: 0 },
  pendingAmount: { type: Number, default: 0 },
  totalPaid: { type: Number, default: 0 },
  lastPaymentDate: Date,
  paymentTerms: { type: Number, default: 30 },
  isCreditBlocked: { type: Boolean, default: false },
  creditBlockedReason: String,
  creditBlockedAt: Date,
  creditBlockedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

  // Profile
  profileImage: String,
  address: {
    line1: String,
    line2: String,
    city: String,
    state: String,
    pincode: String,
    country: { type: String, default: "India" }
  },

  fcmToken: String,
  lastLoginAt: Date,
  adminNotes: { type: String, maxlength: 2000 }

}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// ============================================================
// INDEXES (remove duplicates - only define here)
// ============================================================
// Note: 'unique: true' in schema already creates index, so we don't need to add again

// ============================================================
// VIRTUALS
// ============================================================
userSchema.virtual('availableCredit').get(function() {
  if (this.isCreditBlocked) return 0;
  return Math.max(0, this.creditLimit - this.pendingAmount);
});

userSchema.virtual('creditUtilization').get(function() {
  if (this.creditLimit === 0) return 0;
  return Math.round((this.pendingAmount / this.creditLimit) * 100);
});

// ============================================================
// PRE-SAVE HOOK - Hash Password (FIXED)
// ============================================================
userSchema.pre("save", async function(next) {
  // Only hash if password is modified
  if (!this.isModified("password")) {
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    return next();  // ✅ Add return here
  } catch (error) {
    return next(error);  // ✅ Add return here
  }
});

// ============================================================
// METHODS
// ============================================================

// Compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Generate password reset token
userSchema.methods.generatePasswordResetToken = function() {
  const resetToken = crypto.randomBytes(32).toString('hex');
  
  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
  
  this.passwordResetExpires = Date.now() + 60 * 60 * 1000; // 1 hour
  
  return resetToken;
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
    isActive: this.isActive,
    businessName: this.businessName,
    businessType: this.businessType,
    gstNumber: this.gstNumber,
    creditLimit: this.creditLimit,
    pendingAmount: this.pendingAmount,
    availableCredit: this.availableCredit,
    isCreditBlocked: this.isCreditBlocked,
    paymentTerms: this.paymentTerms,
    createdAt: this.createdAt
  };
};

// Clear OTP helpers
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

// ============================================================
// STATICS
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

module.exports = mongoose.model("User", userSchema);