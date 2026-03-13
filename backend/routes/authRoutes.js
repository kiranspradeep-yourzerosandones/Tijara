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
  // Forgot Password (OTP - Phone)
  sendForgotPasswordOtp,
  resetPassword,
  // Forgot Password (Email)
  requestPasswordResetEmail,
  verifyResetToken,
  resetPasswordWithToken,
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

// ============ Forgot Password (OTP - Phone) ============
router.post("/forgot-password/send-otp", sendForgotPasswordOtp);
router.post("/forgot-password/reset", resetPassword);

// ============ Forgot Password (Email Link) ============
router.post("/forgot-password/email", requestPasswordResetEmail);
router.get("/reset-password/verify/:token", verifyResetToken);
router.post("/reset-password/email", resetPasswordWithToken);

// ============ Protected Routes ============
router.get("/me", protect, getMe);
router.put("/profile", protect, updateProfile);
router.put("/change-password", protect, changePassword);
router.put("/fcm-token", protect, updateFCMToken);

module.exports = router;