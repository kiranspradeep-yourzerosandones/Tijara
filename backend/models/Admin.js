// backend/models/Admin.js
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");

const adminSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Name is required"],
    trim: true,
    maxlength: [50, "Name cannot exceed 50 characters"]
  },

  email: {
    type: String,
    required: [true, "Email is required"],
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, "Please enter a valid email address"]
  },

  phone: {
    type: String,
    trim: true,
    sparse: true,
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
    enum: ["admin", "superadmin", "manager"],
    default: "admin"
  },

  isActive: {
    type: Boolean,
    default: true
  },

  permissions: {
    manageProducts: { type: Boolean, default: true },
    manageOrders: { type: Boolean, default: true },
    manageCustomers: { type: Boolean, default: true },
    managePayments: { type: Boolean, default: true },
    manageAdmins: { type: Boolean, default: false },
    viewReports: { type: Boolean, default: true }
  },

  profileImage: String,
  lastLoginAt: Date,
  notes: { type: String, maxlength: 1000 },

  passwordResetToken: String,
  passwordResetExpires: Date,
  passwordChangedAt: Date,

  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Admin"
  }

}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// ============================================================
// INDEXES
// ============================================================
adminSchema.index({ passwordResetToken: 1 });

// ============================================================
// PRE-SAVE HOOK - Hash Password
// ============================================================
adminSchema.pre("save", async function() {
  if (!this.isModified("password")) {
    return;
  }

  if (this.password.startsWith("$2a$") || this.password.startsWith("$2b$")) {
    console.log("Password already hashed, skipping...");
    return;
  }

  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    console.log("Password hashed successfully for:", this.email);
  } catch (error) {
    console.error("Error hashing password:", error);
    throw error;
  }
});

// ============================================================
// METHODS
// ============================================================

adminSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    console.error("Password comparison error:", error);
    return false;
  }
};

adminSchema.methods.getPublicProfile = function() {
  return {
    id: this._id,
    name: this.name,
    email: this.email,
    phone: this.phone,
    role: this.role,
    permissions: this.role === "superadmin" ? {
      manageProducts: true,
      manageOrders: true,
      manageCustomers: true,
      managePayments: true,
      manageAdmins: true,
      viewReports: true
    } : this.permissions,
    profileImage: this.profileImage,
    isActive: this.isActive,
    lastLoginAt: this.lastLoginAt,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt
  };
};

adminSchema.methods.hasPermission = function(permission) {
  if (this.role === "superadmin") return true;
  return this.permissions && this.permissions[permission] === true;
};

adminSchema.methods.changedPasswordAfter = function(JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10);
    return JWTTimestamp < changedTimestamp;
  }
  return false;
};

adminSchema.methods.createPasswordResetToken = function() {
  const resetToken = crypto.randomBytes(32).toString("hex");
  
  this.passwordResetToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");
  
  this.passwordResetExpires = Date.now() + 15 * 60 * 1000;
  
  console.log("Reset token generated for:", this.email);
  
  return resetToken;
};

module.exports = mongoose.model("Admin", adminSchema);