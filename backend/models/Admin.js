const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const adminSchema = new mongoose.Schema({
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
// PRE-SAVE HOOK - Hash Password (NO next() needed for async)
// ============================================================
adminSchema.pre("save", async function() {
  // Skip if password not modified
  if (!this.isModified("password")) {
    return;
  }

  // Hash password
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  console.log("✅ Password hashed for:", this.phone);
});

// ============================================================
// METHODS
// ============================================================

adminSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

adminSchema.methods.getPublicProfile = function() {
  return {
    id: this._id,
    name: this.name,
    phone: this.phone,
    email: this.email,
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
    createdAt: this.createdAt
  };
};

adminSchema.methods.hasPermission = function(permission) {
  if (this.role === "superadmin") return true;
  return this.permissions[permission] === true;
};

module.exports = mongoose.model("Admin", adminSchema);