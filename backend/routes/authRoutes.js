const express = require("express");
const router = express.Router();

const {
  // Registration
  sendRegistrationOtp,
  verifyRegistrationOtp,
  completeRegistration,
  // Login
  login,
  sendLoginOtp,
  verifyLoginOtp,
  // Forgot Password
  sendForgotPasswordOtp,
  resetPassword,
  // Profile
  getMe,
  updateProfile,
  changePassword,
  updateFCMToken
} = require("../controllers/authController");

const { protect } = require("../middleware/auth");

// ============ Registration Routes ============
router.post("/register/send-otp", sendRegistrationOtp);
router.post("/register/verify-otp", verifyRegistrationOtp);
router.post("/register/complete", completeRegistration);

// ============ Login Routes ============
router.post("/login", login);
router.post("/login/send-otp", sendLoginOtp);
router.post("/login/verify-otp", verifyLoginOtp);

// ============ Forgot Password Routes ============
router.post("/forgot-password/send-otp", sendForgotPasswordOtp);
router.post("/forgot-password/reset", resetPassword);

// ============ Protected Routes ============
router.get("/me", protect, getMe);
router.put("/profile", protect, updateProfile);
router.put("/change-password", protect, changePassword);
router.put("/fcm-token", protect, updateFCMToken);

module.exports = router;