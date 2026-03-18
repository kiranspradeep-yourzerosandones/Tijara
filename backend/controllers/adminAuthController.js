const Admin = require("../models/Admin");
const { generateToken } = require("../utils/jwtUtils");

// @desc    Admin Login
// @route   POST /api/admin/login
// @access  Public
exports.adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body; // ✅ Changed from phone to email

    console.log("📧 Admin login attempt for:", email);
    console.log("🔑 Password received:", password ? "Yes" : "No");

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password required"
      });
    }

    // Find admin by email with password
    const admin = await Admin.findOne({ email: email.toLowerCase() }).select("+password");
    console.log("👤 Admin found:", admin ? "Yes" : "No");
    
    if (!admin) {
      console.log("❌ No admin found with email:", email);
      return res.status(401).json({
        success: false,
        message: "Invalid credentials"
      });
    }

    console.log("👤 Admin details:", {
      id: admin._id,
      name: admin.name,
      email: admin.email,
      role: admin.role,
      isActive: admin.isActive,
      hasPassword: !!admin.password
    });

    if (!admin.isActive) {
      console.log("❌ Admin account deactivated");
      return res.status(401).json({
        success: false,
        message: "Account deactivated"
      });
    }

    // Check password
    console.log("🔍 Comparing passwords...");
    const isMatch = await admin.comparePassword(password);
    console.log("✅ Password match:", isMatch);

    if (!isMatch) {
      console.log("❌ Password mismatch");
      return res.status(401).json({
        success: false,
        message: "Invalid credentials"
      });
    }

    // Update last login
    admin.lastLoginAt = new Date();
    await admin.save();

    const token = generateToken(admin._id, "admin");

    console.log("🎉 Admin login successful:", admin.email);

    res.json({
      success: true,
      message: "Login successful",
      data: {
        admin: admin.getPublicProfile(),
        token
      }
    });

  } catch (error) {
    console.error("❌ Admin Login Error:", error);
    res.status(500).json({
      success: false,
      message: "Login failed",
      error: error.message
    });
  }
};

// @desc    Get current admin profile
// @route   GET /api/admin/me
// @access  Private/Admin
exports.getMe = async (req, res) => {
  try {
    const admin = await Admin.findById(req.user._id);

    res.status(200).json({
      success: true,
      data: {
        admin: admin.getPublicProfile()
      }
    });

  } catch (error) {
    console.error("Get Admin Profile Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get profile",
      error: process.env.NODE_ENV === "development" ? error.message : undefined
    });
  }
};

// @desc    Create admin user (superadmin only)
// @route   POST /api/admin/create-admin
// @access  Private/SuperAdmin
exports.createAdmin = async (req, res) => {
  try {
    const { name, email, password, phone, role, permissions } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Name, email, and password are required"
      });
    }

    // Check if email already exists
    const existingAdmin = await Admin.findOne({ email: email.toLowerCase() });

    if (existingAdmin) {
      return res.status(400).json({
        success: false,
        message: "Email already registered"
      });
    }

    const admin = await Admin.create({
      name,
      email: email.toLowerCase(),
      password,
      phone,
      role: role || "admin",
      permissions: permissions || {},
      createdBy: req.user._id
    });

    res.status(201).json({
      success: true,
      message: "Admin created successfully",
      data: {
        admin: admin.getPublicProfile()
      }
    });

  } catch (error) {
    console.error("Create Admin Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create admin",
      error: error.message
    });
  }
};

// @desc    Create admin user (superadmin only)
// @route   POST /api/admin/create-admin
// @access  Private/SuperAdmin
exports.createAdmin = async (req, res) => {
  try {
    const { name, phone, password, email, role, permissions } = req.body;

    if (!name || !phone || !password) {
      return res.status(400).json({
        success: false,
        message: "Name, phone, and password are required"
      });
    }

    // Check if phone already exists
    const existingAdmin = await Admin.findOne({ phone });

    if (existingAdmin) {
      return res.status(400).json({
        success: false,
        message: "Phone number already registered"
      });
    }

    const admin = await Admin.create({
      name,
      phone,
      password,
      email,
      role: role || "admin",
      permissions: permissions || {},
      createdBy: req.user._id
    });

    res.status(201).json({
      success: true,
      message: "Admin created successfully",
      data: {
        admin: admin.getPublicProfile()
      }
    });

  } catch (error) {
    console.error("Create Admin Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create admin",
      error: error.message
    });
  }
};

module.exports = exports;