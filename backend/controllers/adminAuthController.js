// backend/controllers/adminAuthController.js
const Admin = require("../models/Admin");
const { generateToken } = require("../utils/jwtUtils");
const crypto = require("crypto");
const emailService = require("../services/emailService");

// @desc    Admin Login
// @route   POST /api/admin/login
// @access  Public
exports.adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log("📧 Admin login attempt for:", email);

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password required"
      });
    }

    const admin = await Admin.findOne({ email: email.toLowerCase() }).select("+password");
    
    if (!admin) {
      console.log("❌ No admin found with email:", email);
      return res.status(401).json({
        success: false,
        message: "Invalid credentials"
      });
    }

    if (!admin.isActive) {
      console.log("❌ Admin account deactivated");
      return res.status(401).json({
        success: false,
        message: "Account deactivated. Contact super admin."
      });
    }

    const isMatch = await admin.comparePassword(password);

    if (!isMatch) {
      console.log("❌ Password mismatch");
      return res.status(401).json({
        success: false,
        message: "Invalid credentials"
      });
    }

    admin.lastLoginAt = new Date();
    await admin.save({ validateBeforeSave: false });

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

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: "Admin not found"
      });
    }

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

// @desc    Update admin profile
// @route   PUT /api/admin/profile
// @access  Private/Admin
exports.updateProfile = async (req, res) => {
  try {
    console.log("📝 Update profile request:", req.body);
    console.log("👤 User ID:", req.user._id);

    const { name, phone, profileImage } = req.body;

    // Find admin
    const admin = await Admin.findById(req.user._id);

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: "Admin not found"
      });
    }

    // Validation
    if (name !== undefined) {
      if (!name || name.trim().length === 0) {
        return res.status(400).json({
          success: false,
          message: "Name cannot be empty"
        });
      }
      if (name.length > 50) {
        return res.status(400).json({
          success: false,
          message: "Name cannot exceed 50 characters"
        });
      }
      admin.name = name.trim();
    }

    if (phone !== undefined) {
      // Allow empty phone (optional field)
      if (phone && phone.trim()) {
        const phoneRegex = /^[6-9]\d{9}$/;
        if (!phoneRegex.test(phone.trim())) {
          return res.status(400).json({
            success: false,
            message: "Please enter a valid 10-digit Indian phone number"
          });
        }
        admin.phone = phone.trim();
      } else {
        admin.phone = undefined; // Clear phone if empty
      }
    }

    if (profileImage !== undefined) {
      admin.profileImage = profileImage || undefined;
    }

    await admin.save();

    console.log("✅ Profile updated for:", admin.email);

    res.json({
      success: true,
      message: "Profile updated successfully",
      data: {
        admin: admin.getPublicProfile()
      }
    });

  } catch (error) {
    console.error("❌ Update Profile Error:", error);
    
    // Handle validation errors
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: messages.join(", ")
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to update profile",
      error: process.env.NODE_ENV === "development" ? error.message : undefined
    });
  }
};

// @desc    Change password (while logged in)
// @route   PUT /api/admin/change-password
// @access  Private/Admin
exports.changePassword = async (req, res) => {
  try {
    console.log("🔐 Change password request for user:", req.user._id);

    const { currentPassword, newPassword, confirmPassword } = req.body;

    // Validation
    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "All password fields are required"
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "New passwords do not match"
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters"
      });
    }

    if (currentPassword === newPassword) {
      return res.status(400).json({
        success: false,
        message: "New password must be different from current password"
      });
    }

    // Get admin with password
    const admin = await Admin.findById(req.user._id).select("+password");

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: "Admin not found"
      });
    }

    // Check current password
    const isMatch = await admin.comparePassword(currentPassword);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Current password is incorrect"
      });
    }

    // Update password (will be hashed by pre-save hook)
    admin.password = newPassword;
    admin.passwordChangedAt = Date.now();
    await admin.save();

    // Generate new token
    const token = generateToken(admin._id, "admin");

    console.log("✅ Password changed for:", admin.email);

    // Send confirmation email (optional, don't await)
    emailService.sendPasswordChangedEmail({
      email: admin.email,
      name: admin.name
    }).catch(err => console.error("Failed to send password changed email:", err));

    res.json({
      success: true,
      message: "Password changed successfully",
      data: {
        token
      }
    });

  } catch (error) {
    console.error("❌ Change Password Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to change password",
      error: process.env.NODE_ENV === "development" ? error.message : undefined
    });
  }
};

// @desc    Forgot password - send reset email
// @route   POST /api/admin/forgot-password
// @access  Public
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    console.log("📧 Forgot password request for:", email);

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required"
      });
    }

    const admin = await Admin.findOne({ email: email.toLowerCase() });

    // Always return success to prevent email enumeration
    if (!admin || !admin.isActive) {
      console.log("❌ Admin not found or inactive:", email);
      return res.json({
        success: true,
        message: "If the email exists, a reset link has been sent"
      });
    }

    // Generate reset token
    const resetToken = admin.createPasswordResetToken();
    await admin.save({ validateBeforeSave: false });

    // Create reset URL
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
    const resetURL = `${frontendUrl}/admin/reset-password/${resetToken}`;

    console.log("🔗 Reset URL generated:", resetURL);

    // Send email
    try {
      await emailService.sendPasswordResetEmail({
        email: admin.email,
        name: admin.name,
        resetURL,
        expiresIn: "15 minutes"
      });

      console.log("✅ Password reset email sent to:", admin.email);

      res.json({
        success: true,
        message: "Password reset link sent to your email"
      });

    } catch (emailError) {
      console.error("❌ Email sending failed:", emailError);
      
      // Clear reset token if email fails
      admin.passwordResetToken = undefined;
      admin.passwordResetExpires = undefined;
      await admin.save({ validateBeforeSave: false });

      return res.status(500).json({
        success: false,
        message: "Failed to send reset email. Please try again later."
      });
    }

  } catch (error) {
    console.error("❌ Forgot Password Error:", error);
    res.status(500).json({
      success: false,
      message: "Something went wrong",
      error: process.env.NODE_ENV === "development" ? error.message : undefined
    });
  }
};

// @desc    Reset password with token
// @route   POST /api/admin/reset-password/:token
// @access  Public
exports.resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password, confirmPassword } = req.body;

    console.log("🔐 Reset password attempt with token");

    if (!password || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "Password and confirm password are required"
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "Passwords do not match"
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters"
      });
    }

    // Hash the token to compare with stored hash
    const hashedToken = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    // Find admin with valid token
    const admin = await Admin.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() }
    });

    if (!admin) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired reset token"
      });
    }

    // Update password
    admin.password = password;
    admin.passwordResetToken = undefined;
    admin.passwordResetExpires = undefined;
    admin.passwordChangedAt = Date.now();
    await admin.save();

    console.log("✅ Password reset successful for:", admin.email);

    // Generate new token for auto-login
    const authToken = generateToken(admin._id, "admin");

    // Send confirmation email
    emailService.sendPasswordChangedEmail({
      email: admin.email,
      name: admin.name
    }).catch(err => console.error("Failed to send password changed email:", err));

    res.json({
      success: true,
      message: "Password reset successful",
      data: {
        token: authToken,
        admin: admin.getPublicProfile()
      }
    });

  } catch (error) {
    console.error("❌ Reset Password Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to reset password",
      error: process.env.NODE_ENV === "development" ? error.message : undefined
    });
  }
};

// @desc    Verify reset token (check if valid)
// @route   GET /api/admin/verify-reset-token/:token
// @access  Public
exports.verifyResetToken = async (req, res) => {
  try {
    const { token } = req.params;

    const hashedToken = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    const admin = await Admin.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() }
    });

    if (!admin) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired reset token"
      });
    }

    // Mask email for privacy
    const maskedEmail = admin.email.replace(/(.{2})(.*)(@.*)/, "$1***$3");

    res.json({
      success: true,
      message: "Token is valid",
      data: {
        email: maskedEmail
      }
    });

  } catch (error) {
    console.error("❌ Verify Reset Token Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to verify token"
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
    console.error("❌ Create Admin Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create admin",
      error: error.message
    });
  }
};

module.exports = exports;