// backend/routes/adminRoutes.js
const express = require("express");
const router = express.Router();

const {
  adminLogin,
  getMe,
  createAdmin,
  updateProfile,
  changePassword,
  forgotPassword,
  resetPassword,
  verifyResetToken
} = require("../controllers/adminAuthController");

const { protect } = require("../middleware/auth");
const { adminOnly, superAdminOnly } = require("../middleware/adminAuth");

// ═══════════════════════════════════════════════════════════
// PUBLIC ROUTES (No authentication required)
// ═══════════════════════════════════════════════════════════
router.post("/login", adminLogin);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password/:token", resetPassword);
router.get("/verify-reset-token/:token", verifyResetToken);

// ═══════════════════════════════════════════════════════════
// PROTECTED ROUTES (Requires Admin Login)
// ═══════════════════════════════════════════════════════════
router.get("/me", protect, adminOnly, getMe);
router.put("/profile", protect, adminOnly, updateProfile);
router.put("/change-password", protect, adminOnly, changePassword);

// ═══════════════════════════════════════════════════════════
// SUPER ADMIN ONLY ROUTES
// ═══════════════════════════════════════════════════════════
router.post("/create-admin", protect, superAdminOnly, createAdmin);

module.exports = router;