// backend/scripts/seedAdmin.js
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
require("dotenv").config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/tijara")
  .then(() => console.log("Connected to MongoDB"))
  .catch(err => {
    console.error("MongoDB connection error:", err);
    process.exit(1);
  });

// Define Admin Schema inline to avoid caching issues
const adminSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  phone: { type: String, trim: true },
  password: { type: String, required: true, select: false },
  role: { type: String, enum: ["admin", "superadmin", "manager"], default: "admin" },
  isActive: { type: Boolean, default: true },
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
  passwordResetToken: String,
  passwordResetExpires: Date,
  passwordChangedAt: Date,
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "Admin" }
}, { timestamps: true });

// Pre-save hook for password hashing
adminSchema.pre("save", async function() {
  if (!this.isModified("password")) return;
  
  // Skip if already hashed
  if (this.password.startsWith("$2a$") || this.password.startsWith("$2b$")) {
    return;
  }
  
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
});

// Use existing model or create new
const Admin = mongoose.models.Admin || mongoose.model("Admin", adminSchema);

// Admin credentials
const adminData = {
  name: "Kiran Pradeep",
  email: "kiranspradeep2002@gmail.com",
  password: "Qwerty@123", // Will be hashed by pre-save hook
  role: "superadmin",
  isActive: true,
  permissions: {
    manageProducts: true,
    manageOrders: true,
    manageCustomers: true,
    managePayments: true,
    manageAdmins: true,
    viewReports: true
  }
};

async function seedAdmin() {
  try {
    // Delete existing admins (optional)
    const deleted = await Admin.deleteMany({});
    console.log(`\nDeleted ${deleted.deletedCount} existing admin(s)`);

    // Create new admin using .save() to trigger pre-save hook
    const admin = new Admin(adminData);
    await admin.save();

    // Verify the password was hashed
    const savedAdmin = await Admin.findById(admin._id).select("+password");
    const isHashed = savedAdmin.password.startsWith("$2a$") || savedAdmin.password.startsWith("$2b$");

    console.log("\n========================================");
    console.log("ADMIN CREATED SUCCESSFULLY");
    console.log("========================================");
    console.log("ID:", savedAdmin._id);
    console.log("Name:", savedAdmin.name);
    console.log("Email:", savedAdmin.email);
    console.log("Role:", savedAdmin.role);
    console.log("----------------------------------------");
    console.log("LOGIN CREDENTIALS:");
    console.log("Email:", adminData.email);
    console.log("Password:", adminData.password);
    console.log("----------------------------------------");
    console.log("Password Hashed:", isHashed ? "YES" : "NO");
    console.log("Hash:", savedAdmin.password.substring(0, 20) + "...");
    console.log("========================================\n");

    // Test password comparison
    const isMatch = await bcrypt.compare(adminData.password, savedAdmin.password);
    console.log("Password verification test:", isMatch ? "PASSED" : "FAILED");

    process.exit(0);
  } catch (error) {
    console.error("\nError creating admin:", error);
    process.exit(1);
  }
}

seedAdmin();