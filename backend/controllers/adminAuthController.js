// Dbackend\controllers\adminAuthController.js
const User = require("../models/User");
const { generateToken } = require("../utils/jwtUtils");

// @desc    Admin Login
// @route   POST /api/admin/login
// @access  Public
exports.adminLogin = async (req, res) => {
  try {
    const { phone, password } = req.body;

    console.log("\n" + "=".repeat(60));
    console.log("🔐 ADMIN LOGIN ATTEMPT");
    console.log("=".repeat(60));
    console.log("📱 Phone:", phone);
    console.log("🔑 Password received:", password ? "YES" : "NO");
    console.log("🔑 Password length:", password ? password.length : 0);
    console.log("🔑 Password value:", password); // ⚠️ Remove this in production!
    console.log("=".repeat(60));

    if (!phone || !password) {
      console.log("❌ FAIL: Missing credentials");
      return res.status(400).json({
        success: false,
        message: "Phone and password required"
      });
    }

    // Find user
    console.log("🔍 Searching for user with phone:", phone);
    const user = await User.findOne({ phone }).select("+password");
    
    if (!user) {
      console.log("❌ FAIL: User not found");
      return res.status(401).json({
        success: false,
        message: "Invalid credentials"
      });
    }

    console.log("✅ User found:");
    console.log("   ID:", user._id);
    console.log("   Name:", user.name);
    console.log("   Phone:", user.phone);
    console.log("   Role:", user.role);
    console.log("   Active:", user.isActive);
    console.log("   Has password:", !!user.password);
    console.log("   Password hash:", user.password?.substring(0, 20) + "...");

    if (user.role !== "admin") {
      console.log("❌ FAIL: Not admin (role:", user.role + ")");
      return res.status(401).json({
        success: false,
        message: "Admin access only"
      });
    }

    if (!user.isActive) {
      console.log("❌ FAIL: Account deactivated");
      return res.status(401).json({
        success: false,
        message: "Account deactivated"
      });
    }

    console.log("\n🔐 Comparing passwords...");
    console.log("   Input password:", password);
    console.log("   Stored hash:", user.password?.substring(0, 30) + "...");
    
    const isMatch = await user.comparePassword(password);
    
    console.log("   Result:", isMatch ? "✅ MATCH" : "❌ NO MATCH");

    if (!isMatch) {
      console.log("❌ FAIL: Password mismatch");
      return res.status(401).json({
        success: false,
        message: "Invalid credentials"
      });
    }

    const token = generateToken(user._id, user.role);
    console.log("✅ SUCCESS: Token generated");
    console.log("=".repeat(60) + "\n");

    res.json({
      success: true,
      message: "Login successful",
      data: {
        user: {
          id: user._id,
          name: user.name,
          phone: user.phone,
          email: user.email,
          role: user.role
        },
        token
      }
    });

  } catch (error) {
    console.error("❌ LOGIN ERROR:", error);
    console.error("   Stack:", error.stack);
    res.status(500).json({
      success: false,
      message: "Login failed"
    });
  }
};
// @desc    Get all users (Admin)
// @route   GET /api/admin/users
// @access  Private/Admin
exports.getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 20, search, role } = req.query;

    const query = {};

    // Filter by role
    if (role) {
      query.role = role;
    }

    // Search by name or phone
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } },
        { businessName: { $regex: search, $options: "i" } }
      ];
    }

    const users = await User.find(query)
      .select("-password")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await User.countDocuments(query);

    res.status(200).json({
      success: true,
      data: {
        users,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / limit),
          total
        }
      }
    });

  } catch (error) {
    console.error("Get Users Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get users",
      error: error.message
    });
  }
};

// @desc    Get single user (Admin)
// @route   GET /api/admin/users/:id
// @access  Private/Admin
exports.getUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    res.status(200).json({
      success: true,
      data: { user }
    });

  } catch (error) {
    console.error("Get User Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get user",
      error: error.message
    });
  }
};

// @desc    Update user status (Admin)
// @route   PUT /api/admin/users/:id/status
// @access  Private/Admin
exports.updateUserStatus = async (req, res) => {
  try {
    const { isActive } = req.body;

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isActive },
      { new: true }
    ).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    res.status(200).json({
      success: true,
      message: `User ${isActive ? "activated" : "deactivated"} successfully`,
      data: { user }
    });

  } catch (error) {
    console.error("Update User Status Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update user status",
      error: error.message
    });
  }
};

// @desc    Create admin user
// @route   POST /api/admin/create-admin
// @access  Private/Admin
exports.createAdmin = async (req, res) => {
  try {
    const { name, phone, password, email } = req.body;

    if (!name || !phone || !password) {
      return res.status(400).json({
        success: false,
        message: "Name, phone, and password are required"
      });
    }

    // Check if phone already exists
    const existingUser = await User.findOne({ phone });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "Phone number already registered"
      });
    }

    const admin = await User.create({
      name,
      phone,
      password,
      email,
      role: "admin",
      isPhoneVerified: true
    });

    res.status(201).json({
      success: true,
      message: "Admin created successfully",
      data: {
        user: admin.getPublicProfile()
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