// backend/controllers/authController.js

const User = require("../models/User");
const PendingRegistration = require("../models/PendingRegistration");
const { generateToken } = require("../utils/jwtUtils");
const {
  checkSmsOtpLimit,
  checkIpPhoneComboLimit,
  logOtpSent,
} = require("../utils/otpLimiter");
const {
  getMCAuthToken,
  mcSendOtp,
  mcValidateOtp,
} = require("../services/messageCentral");
const emailService = require("../services/emailService");

// ============================================================
// HELPER: Extract real client IP
// Handles proxies (nginx, load balancers) via x-forwarded-for
// ============================================================
const getClientIp = (req) => {
  const forwarded = req.headers["x-forwarded-for"];
  if (forwarded) {
    // x-forwarded-for can be "client, proxy1, proxy2" — take first
    return forwarded.split(",")[0].trim();
  }
  return req.ip || req.connection?.remoteAddress || "unknown";
};

// ============================================================
// PREFERRED CATEGORY
// ============================================================

exports.updatePreferredCategory = async (req, res) => {
  try {
    const { preferredCategory } = req.body;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { preferredCategory: preferredCategory || null },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    console.log(
      `⭐ Preferred category updated for user ${user._id}: ${preferredCategory || "cleared"}`
    );

    return res.status(200).json({
      success: true,
      message: preferredCategory
        ? `Industry preference set to "${preferredCategory}"`
        : "Industry preference cleared",
      preferredCategory: user.preferredCategory,
    });
  } catch (error) {
    console.error("Update Preferred Category Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update industry preference",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// ============================================================
// EMAIL PASSWORD RESET
// ============================================================

exports.requestPasswordResetEmail = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res
        .status(400)
        .json({ success: false, message: "Email is required" });
    }

    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!emailRegex.test(email)) {
      return res
        .status(400)
        .json({ success: false, message: "Please enter a valid email address" });
    }

    const user = await User.findOne({ email: email.toLowerCase() });

    // Always return the same message to prevent email enumeration
    if (!user || !user.isActive) {
      return res.status(200).json({
        success: true,
        message:
          "If an account exists with this email, you will receive a password reset link.",
      });
    }

    const resetToken = user.generatePasswordResetToken();
    await user.save({ validateBeforeSave: false });

    const resetUrl = `${
      process.env.FRONTEND_URL || "http://localhost:3000"
    }/reset-password/${resetToken}`;

    const emailResult = await emailService.sendPasswordResetEmail({
      to: user.email,
      name: user.name,
      resetUrl,
      expiresIn: "1 hour",
    });

    if (!emailResult.success && !emailResult.devMode) {
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;
      await user.save({ validateBeforeSave: false });

      return res.status(500).json({
        success: false,
        message: "Failed to send reset email. Please try again later.",
      });
    }

    console.log(`📧 Password reset email sent to: ${user.email}`);

    const responseData = {
      success: true,
      message:
        "If an account exists with this email, you will receive a password reset link.",
    };

    if (process.env.NODE_ENV === "development") {
      responseData.devInfo = { resetToken, resetUrl };
    }

    return res.status(200).json(responseData);
  } catch (error) {
    console.error("Request Password Reset Email Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to process request",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

exports.verifyResetToken = async (req, res) => {
  try {
    const { token } = req.params;

    if (!token) {
      return res
        .status(400)
        .json({ success: false, message: "Reset token is required" });
    }

    const user = await User.verifyPasswordResetToken(token);

    if (!user) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid or expired reset token" });
    }

    return res.status(200).json({
      success: true,
      message: "Token is valid",
      data: { email: user.email.replace(/(.{2})(.*)(@.*)/, "$1***$3") },
    });
  } catch (error) {
    console.error("Verify Reset Token Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to verify token",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

exports.resetPasswordWithToken = async (req, res) => {
  try {
    const { token, newPassword, confirmPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Token and new password are required",
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters",
      });
    }

    if (confirmPassword && newPassword !== confirmPassword) {
      return res
        .status(400)
        .json({ success: false, message: "Passwords do not match" });
    }

    const user = await User.verifyPasswordResetToken(token);

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired reset token. Please request a new one.",
      });
    }

    user.password = newPassword;
    user.clearPasswordReset();
    await user.save();

    if (user.email) {
      await emailService.sendPasswordChangedEmail({
        to: user.email,
        name: user.name,
      });
    }

    const authToken = generateToken(user._id, "customer");

    console.log(`🔑 Password reset successful for user: ${user.phone}`);

    return res.status(200).json({
      success: true,
      message: "Password reset successful",
      data: { user: user.getPublicProfile(), token: authToken },
    });
  } catch (error) {
    console.error("Reset Password With Token Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to reset password",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// ============================================================
// REGISTRATION FLOW
// ============================================================

exports.sendRegistrationOtp = async (req, res) => {
  try {
    const { phone } = req.body;

    if (!phone) {
      return res
        .status(400)
        .json({ success: false, message: "Phone number is required" });
    }

    const phoneRegex = /^[6-9]\d{9}$/;
    if (!phoneRegex.test(phone)) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid 10-digit phone number",
      });
    }

    // ── Check if already registered ───────────────────────
    const existingUser = await User.findOne({ phone });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        code: "PHONE_ALREADY_REGISTERED",
        message: "Phone number already registered. Please login.",
      });
    }

    const now = new Date();
    let pending = await PendingRegistration.findOne({ phone });

    // ── Cooldown check ─────────────────────────────────────
    if (pending?.otpExpires && pending?.verificationId) {
      const expiresAt = new Date(pending.otpExpires);
      if (expiresAt > now) {
        const otpValiditySeconds = 300;
        const otpSentAt = new Date(
          expiresAt.getTime() - otpValiditySeconds * 1000
        );
        const secondsSinceSent = Math.floor((now - otpSentAt) / 1000);

        if (secondsSinceSent < 30) {
          const waitTime = 30 - secondsSinceSent;
          return res.status(429).json({
            success: false,
            code: "OTP_COOLDOWN",
            message: `Please wait ${waitTime} seconds before requesting a new OTP.`,
            waitTime,
          });
        }
      }
    }

    // ── Layer 2: IP + Phone combo check ───────────────────────
    const clientIp = getClientIp(req);
    const comboCheck = await checkIpPhoneComboLimit(phone, clientIp);

    if (!comboCheck.allowed) {
      return res.status(429).json({
        success: false,
        code: "IP_PHONE_LIMIT",
        message:
          "Too many OTP requests for this number from your device. Please wait 1 hour.",
      });
    }

    // ── Layer 3: Phone daily limit ─────────────────────────────
    const limitCheck = await checkSmsOtpLimit(phone);
    if (!limitCheck.allowed) {
      return res.status(429).json({
        success: false,
        code: "OTP_DAILY_LIMIT",
        message: "Daily OTP limit reached. Please try again tomorrow.",
      });
    }

    // ── Send OTP via Message Central ───────────────────────
    const authToken = await getMCAuthToken(
      process.env.MC_CUSTOMER,
      process.env.MC_PASSWORD
    );

    try {
      const data = await mcSendOtp({
        authToken,
        customerId: process.env.MC_CUSTOMER,
        mobileNumber: phone,
        otpLength: Number(process.env.SMS_OTP_LENGTH || 4),
        countryCode: process.env.MC_COUNTRY || "91",
      });

      const verificationId =
        data?.verificationId || data?.verificationID || data?.verification_id;
      const timeout = Number(data?.timeout || data?.time || 300);

      if (pending) {
        pending.verificationId = verificationId;
        pending.otpExpires = new Date(Date.now() + timeout * 1000);
        pending.otpAttempts = 0;
        pending.isVerified = false;
        await pending.save();
      } else {
        pending = await PendingRegistration.create({
          phone,
          verificationId,
          otpExpires: new Date(Date.now() + timeout * 1000),
        });
      }

      // ── Log with IP ────────────────────────────────────────
      await logOtpSent(phone, "registration", verificationId, clientIp);

      return res.status(200).json({
        success: true,
        message: "OTP sent successfully",
        data: {
          phone,
          timeout,
          expiresIn: `${Math.floor(timeout / 60)} minutes`,
        },
      });
    } catch (providerError) {
      console.error("Message Central Error:", providerError);
      const responseCode = providerError?.response?.data?.responseCode;
      const message = providerError?.response?.data?.message;

      if (responseCode === 506 || message === "REQUEST_ALREADY_EXISTS") {
        return res.status(429).json({
          success: false,
          code: "OTP_COOLDOWN",
          message: "Please wait 30 seconds before requesting a new OTP.",
          waitTime: 30,
        });
      }
      throw providerError;
    }
  } catch (error) {
    console.error("Send Registration OTP Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to send OTP",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

exports.verifyRegistrationOtp = async (req, res) => {
  try {
    const { phone, otp } = req.body;

    if (!phone || !otp) {
      return res
        .status(400)
        .json({ success: false, message: "Phone and OTP are required" });
    }

    const pending = await PendingRegistration.findOne({ phone });

    if (!pending?.verificationId || !pending?.otpExpires) {
      return res.status(400).json({
        success: false,
        code: "NO_OTP",
        message: "OTP not requested. Please request OTP first.",
      });
    }

    if (new Date() > new Date(pending.otpExpires)) {
      return res.status(400).json({
        success: false,
        code: "OTP_EXPIRED",
        message: "OTP has expired. Please request a new one.",
      });
    }

    if (pending.otpAttempts >= 3) {
      return res.status(400).json({
        success: false,
        code: "TOO_MANY_ATTEMPTS",
        message: "Too many failed attempts. Please request a new OTP.",
      });
    }

    const authToken = await getMCAuthToken(
      process.env.MC_CUSTOMER,
      process.env.MC_PASSWORD
    );

    const result = await mcValidateOtp({
      authToken,
      verificationId: pending.verificationId,
      code: otp,
      mobileNumber: phone,
      countryCode: process.env.MC_COUNTRY || "91",
      customerId: process.env.MC_CUSTOMER,
    });

    if (!result) {
      return res.status(500).json({
        success: false,
        code: "PROVIDER_ERROR",
        message: "OTP verification failed. Please try again.",
      });
    }

    if (result.verificationStatus === "VERIFICATION_COMPLETED") {
      pending.isVerified = true;
      pending.verifiedAt = new Date();
      pending.otpAttempts = 0;
      await pending.save();

      return res.status(200).json({
        success: true,
        message: "Phone number verified successfully",
        data: { phone, verified: true },
      });
    }

    const respCode = Number(result.responseCode || result.response_code || 0);

    pending.otpAttempts += 1;
    await pending.save();

    if (respCode === 702) {
      return res.status(400).json({
        success: false,
        code: "INVALID_OTP",
        message: "Invalid OTP. Please try again.",
        attemptsRemaining: 3 - pending.otpAttempts,
      });
    }

    if (respCode === 705) {
      return res.status(400).json({
        success: false,
        code: "OTP_EXPIRED",
        message: "OTP has expired. Please request a new one.",
      });
    }

    return res.status(400).json({
      success: false,
      code: "INVALID_OTP",
      message: "OTP verification failed. Please try again.",
      attemptsRemaining: 3 - pending.otpAttempts,
    });
  } catch (error) {
    console.error("Verify Registration OTP Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to verify OTP",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

exports.completeRegistration = async (req, res) => {
  try {
    const {
      phone,
      name,
      password,
      businessName,
      businessType,
      gstNumber,
      email,
    } = req.body;

    if (!phone || !name || !password) {
      return res.status(400).json({
        success: false,
        message: "Phone, name, and password are required",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters",
      });
    }

    const pending = await PendingRegistration.findOne({
      phone,
      isVerified: true,
    });

    if (!pending) {
      return res.status(400).json({
        success: false,
        message: "Phone number not verified. Please verify OTP first.",
      });
    }

    const verifiedAt = new Date(pending.verifiedAt);
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);

    if (verifiedAt < tenMinutesAgo) {
      return res.status(400).json({
        success: false,
        message: "Verification expired. Please verify OTP again.",
      });
    }

    const existingUser = await User.findOne({ phone });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        code: "PHONE_ALREADY_REGISTERED",
        message: "Phone number already registered. Please login.",
      });
    }

    const user = await User.create({
      name,
      phone,
      password,
      businessName,
      businessType,
      gstNumber,
      email,
      isPhoneVerified: true,
      isActive: true,
    });

    const token = generateToken(user._id, "customer");

    await PendingRegistration.deleteOne({ phone });

    console.log(`✅ New customer registered: ${user.phone}`);

    return res.status(201).json({
      success: true,
      message: "Registration successful. You can now use the app.",
      data: { user: user.getPublicProfile(), token },
    });
  } catch (error) {
    console.error("Complete Registration Error:", error);

    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        code: "PHONE_ALREADY_REGISTERED",
        message: "Phone number already registered. Please login.",
      });
    }

    res.status(500).json({
      success: false,
      message: "Registration failed",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// ============================================================
// LOGIN FLOW
// ============================================================

/**
 * @desc    Login with password
 * @route   POST /api/auth/login
 * @access  Public
 *
 * Returns distinct messages for:
 *   - unknown phone     → 404  "No account found with this phone number."
 *   - deactivated       → 401  "Your account has been deactivated…"
 *   - account locked    → 403  code: ACCOUNT_LOCKED
 *   - wrong password    → 401  "Incorrect password."
 */
exports.login = async (req, res) => {
  try {
    const { phone, password } = req.body;

    if (!phone || !password) {
      return res.status(400).json({
        success: false,
        message: "Phone and password are required",
      });
    }

    const user = await User.findOne({ phone }).select("+password");

    // ── Unknown phone ──────────────────────────────────────
    if (!user) {
      return res.status(404).json({
        success: false,
        code: "NOT_FOUND",
        message: "No account found with this phone number.",
      });
    }

    // ── Deactivated ────────────────────────────────────────
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        code: "ACCOUNT_DEACTIVATED",
        message: "Your account has been deactivated. Please contact support.",
      });
    }

    // ── Account locked ─────────────────────────────────────
    if (user.otpLockedUntil && new Date(user.otpLockedUntil) > new Date()) {
      const minutesRemaining = Math.ceil(
        (new Date(user.otpLockedUntil) - new Date()) / 60000
      );
      return res.status(403).json({
        success: false,
        code: "ACCOUNT_LOCKED",
        message: `Account temporarily locked. Try again in ${minutesRemaining} minutes.`,
      });
    }

    // ── Wrong password ─────────────────────────────────────
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        code: "WRONG_PASSWORD",
        message: "Incorrect password. Please try again.",
      });
    }

    // ── Success ────────────────────────────────────────────
    await User.updateOne(
      { _id: user._id },
      {
        $set: {
          lastLoginAt: new Date(),
          otpCycleFailures: 0,
          otpLockedUntil: null,
        },
      }
    );

    const token = generateToken(user._id, "customer");
    const updatedUser = await User.findById(user._id);

    console.log(`✅ Login successful: ${user.phone}`);

    return res.status(200).json({
      success: true,
      message: "Login successful",
      data: { user: updatedUser.getPublicProfile(), token },
    });
  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({
      success: false,
      message: "Login failed",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

exports.sendLoginOtp = async (req, res) => {
  try {
    const { phone } = req.body;

    if (!phone) {
      return res
        .status(400)
        .json({ success: false, message: "Phone number is required" });
    }

    const user = await User.findOne({ phone });

    if (!user) {
      return res.status(404).json({
        success: false,
        code: "NOT_FOUND",
        message: "No account found with this phone number.",
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        code: "ACCOUNT_DEACTIVATED",
        message: "Your account has been deactivated. Please contact support.",
      });
    }

    const now = new Date();

    if (user.otpLockedUntil && new Date(user.otpLockedUntil) > now) {
      const minutesRemaining = Math.ceil(
        (new Date(user.otpLockedUntil) - now) / 60000
      );
      return res.status(403).json({
        success: false,
        code: "OTP_LOCKED",
        message: `Account temporarily locked. Try again in ${minutesRemaining} minutes.`,
      });
    }

    // ── Cooldown check ─────────────────────────────────────
    if (user.loginOtpExpires && user.loginVerificationId) {
      const expiresAt = new Date(user.loginOtpExpires);
      if (expiresAt > now) {
        const otpValiditySeconds = 300;
        const otpSentAt = new Date(
          expiresAt.getTime() - otpValiditySeconds * 1000
        );
        const secondsSinceSent = Math.floor((now - otpSentAt) / 1000);

        if (secondsSinceSent < 30) {
          const waitTime = 30 - secondsSinceSent;
          return res.status(429).json({
            success: false,
            code: "OTP_COOLDOWN",
            message: `Please wait ${waitTime} seconds before requesting a new OTP.`,
            waitTime,
          });
        }
      }
    }

    // ── Layer 2: IP + Phone combo check ───────────────────────
    const clientIp = getClientIp(req);
    const comboCheck = await checkIpPhoneComboLimit(phone, clientIp);

    if (!comboCheck.allowed) {
      return res.status(429).json({
        success: false,
        code: "IP_PHONE_LIMIT",
        message:
          "Too many OTP requests for this number from your device. Please wait 1 hour.",
      });
    }

    // ── Layer 3: Phone daily limit ─────────────────────────────
    const limitCheck = await checkSmsOtpLimit(phone);
    if (!limitCheck.allowed) {
      return res.status(429).json({
        success: false,
        code: "OTP_DAILY_LIMIT",
        message: "Daily OTP limit reached. Please try again tomorrow.",
      });
    }

    const authToken = await getMCAuthToken(
      process.env.MC_CUSTOMER,
      process.env.MC_PASSWORD
    );

    try {
      const data = await mcSendOtp({
        authToken,
        customerId: process.env.MC_CUSTOMER,
        mobileNumber: phone,
        otpLength: Number(process.env.SMS_OTP_LENGTH || 4),
        countryCode: process.env.MC_COUNTRY || "91",
      });

      const verificationId =
        data?.verificationId || data?.verificationID || data?.verification_id;
      const timeout = Number(data?.timeout || data?.time || 300);

      await User.updateOne(
        { _id: user._id },
        {
          $set: {
            loginVerificationId: verificationId,
            loginOtpExpires: new Date(Date.now() + timeout * 1000),
            loginOtpAttempts: 0,
          },
        }
      );

      // ── Log with IP ────────────────────────────────────────
      await logOtpSent(phone, "login", verificationId, clientIp);

      return res.status(200).json({
        success: true,
        message: "OTP sent successfully",
        data: {
          phone,
          timeout,
          expiresIn: `${Math.floor(timeout / 60)} minutes`,
        },
      });
    } catch (providerError) {
      console.error("Message Central Error:", providerError);
      const responseCode = providerError?.response?.data?.responseCode;
      const message = providerError?.response?.data?.message;

      if (responseCode === 506 || message === "REQUEST_ALREADY_EXISTS") {
        return res.status(429).json({
          success: false,
          code: "OTP_COOLDOWN",
          message: "Please wait 30 seconds before requesting a new OTP.",
          waitTime: 30,
        });
      }
      throw providerError;
    }
  } catch (error) {
    console.error("Send Login OTP Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to send OTP",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

exports.verifyLoginOtp = async (req, res) => {
  try {
    const { phone, otp } = req.body;

    if (!phone || !otp) {
      return res
        .status(400)
        .json({ success: false, message: "Phone and OTP are required" });
    }

    const user = await User.findOne({ phone });

    if (!user) {
      return res.status(404).json({
        success: false,
        code: "NOT_FOUND",
        message: "No account found with this phone number.",
      });
    }

    if (!user.loginVerificationId || !user.loginOtpExpires) {
      return res.status(400).json({
        success: false,
        code: "NO_OTP",
        message: "OTP not requested. Please request OTP first.",
      });
    }

    if (new Date() > new Date(user.loginOtpExpires)) {
      return res.status(400).json({
        success: false,
        code: "OTP_EXPIRED",
        message: "OTP has expired. Please request a new one.",
      });
    }

    if (user.loginOtpAttempts >= 3) {
      return res.status(400).json({
        success: false,
        code: "TOO_MANY_ATTEMPTS",
        message: "Too many failed attempts. Please request a new OTP.",
      });
    }

    const authToken = await getMCAuthToken(
      process.env.MC_CUSTOMER,
      process.env.MC_PASSWORD
    );

    const result = await mcValidateOtp({
      authToken,
      verificationId: user.loginVerificationId,
      code: otp,
      mobileNumber: phone,
      countryCode: process.env.MC_COUNTRY || "91",
      customerId: process.env.MC_CUSTOMER,
    });

    if (!result) {
      return res.status(500).json({
        success: false,
        code: "PROVIDER_ERROR",
        message: "OTP verification failed. Please try again.",
      });
    }

    if (result.verificationStatus === "VERIFICATION_COMPLETED") {
      await User.updateOne(
        { _id: user._id },
        {
          $set: {
            loginVerificationId: undefined,
            loginOtpExpires: undefined,
            loginOtpAttempts: 0,
            lastLoginAt: new Date(),
            otpCycleFailures: 0,
            otpLockedUntil: null,
          },
        }
      );

      const token = generateToken(user._id, "customer");
      const updatedUser = await User.findById(user._id);

      return res.status(200).json({
        success: true,
        message: "Login successful",
        data: { user: updatedUser.getPublicProfile(), token },
      });
    }

    const respCode = Number(result.responseCode || result.response_code || 0);
    const newAttempts = user.loginOtpAttempts + 1;
    const newCycleFailures =
      newAttempts >= 3
        ? (user.otpCycleFailures || 0) + 1
        : user.otpCycleFailures || 0;
    const shouldLock = newCycleFailures >= 5;

    await User.updateOne(
      { _id: user._id },
      {
        $set: {
          loginOtpAttempts: newAttempts,
          otpCycleFailures: newCycleFailures,
          ...(shouldLock && {
            otpLockedUntil: new Date(Date.now() + 60 * 60 * 1000),
          }),
        },
      }
    );

    if (shouldLock) {
      return res.status(403).json({
        success: false,
        code: "OTP_LOCKED",
        message: "Too many failed attempts. Account locked for 1 hour.",
      });
    }

    if (respCode === 702) {
      return res.status(400).json({
        success: false,
        code: "INVALID_OTP",
        message: "Invalid OTP. Please try again.",
        attemptsRemaining: 3 - newAttempts,
      });
    }

    if (respCode === 705) {
      return res.status(400).json({
        success: false,
        code: "OTP_EXPIRED",
        message: "OTP has expired. Please request a new one.",
      });
    }

    return res.status(400).json({
      success: false,
      code: "INVALID_OTP",
      message: "OTP verification failed. Please try again.",
      attemptsRemaining: 3 - newAttempts,
    });
  } catch (error) {
    console.error("Verify Login OTP Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to verify OTP",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// ============================================================
// FORGOT PASSWORD FLOW
// ============================================================

exports.sendForgotPasswordOtp = async (req, res) => {
  try {
    const { phone } = req.body;

    if (!phone) {
      return res
        .status(400)
        .json({ success: false, message: "Phone number is required" });
    }

    const user = await User.findOne({ phone });

    if (!user) {
      return res.status(404).json({
        success: false,
        code: "NOT_FOUND",
        message: "No account found with this phone number.",
      });
    }

    const now = new Date();

    // ── Cooldown check ─────────────────────────────────────
    if (user.resetOtpExpires && user.resetVerificationId) {
      const expiresAt = new Date(user.resetOtpExpires);
      if (expiresAt > now) {
        const otpValiditySeconds = 300;
        const otpSentAt = new Date(
          expiresAt.getTime() - otpValiditySeconds * 1000
        );
        const secondsSinceSent = Math.floor((now - otpSentAt) / 1000);

        if (secondsSinceSent < 30) {
          const waitTime = 30 - secondsSinceSent;
          return res.status(429).json({
            success: false,
            code: "OTP_COOLDOWN",
            message: `Please wait ${waitTime} seconds before requesting a new OTP.`,
            waitTime,
          });
        }
      }
    }

    // ── Layer 2: IP + Phone combo check ───────────────────────
    const clientIp = getClientIp(req);
    const comboCheck = await checkIpPhoneComboLimit(phone, clientIp);

    if (!comboCheck.allowed) {
      return res.status(429).json({
        success: false,
        code: "IP_PHONE_LIMIT",
        message:
          "Too many OTP requests for this number from your device. Please wait 1 hour.",
      });
    }

    // ── Layer 3: Phone daily limit ─────────────────────────────
    const limitCheck = await checkSmsOtpLimit(phone);
    if (!limitCheck.allowed) {
      return res.status(429).json({
        success: false,
        code: "OTP_DAILY_LIMIT",
        message: "Daily OTP limit reached. Please try again tomorrow.",
      });
    }

    const authToken = await getMCAuthToken(
      process.env.MC_CUSTOMER,
      process.env.MC_PASSWORD
    );

    try {
      const data = await mcSendOtp({
        authToken,
        customerId: process.env.MC_CUSTOMER,
        mobileNumber: phone,
        otpLength: Number(process.env.SMS_OTP_LENGTH || 4),
        countryCode: process.env.MC_COUNTRY || "91",
      });

      const verificationId =
        data?.verificationId || data?.verificationID || data?.verification_id;
      const timeout = Number(data?.timeout || data?.time || 300);

      await User.updateOne(
        { _id: user._id },
        {
          $set: {
            resetVerificationId: verificationId,
            resetOtpExpires: new Date(Date.now() + timeout * 1000),
            resetOtpAttempts: 0,
          },
        }
      );

      // ── Log with IP ────────────────────────────────────────
      await logOtpSent(phone, "reset_password", verificationId, clientIp);

      return res.status(200).json({
        success: true,
        message: "OTP sent successfully",
        data: {
          phone,
          timeout,
          expiresIn: `${Math.floor(timeout / 60)} minutes`,
        },
      });
    } catch (providerError) {
      console.error("Message Central Error:", providerError);
      const responseCode = providerError?.response?.data?.responseCode;
      const message = providerError?.response?.data?.message;

      if (responseCode === 506 || message === "REQUEST_ALREADY_EXISTS") {
        return res.status(429).json({
          success: false,
          code: "OTP_COOLDOWN",
          message: "Please wait 30 seconds before requesting a new OTP.",
          waitTime: 30,
        });
      }
      throw providerError;
    }
  } catch (error) {
    console.error("Send Forgot Password OTP Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to send OTP",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { phone, otp, newPassword } = req.body;

    if (!phone || !otp || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Phone, OTP, and new password are required",
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters",
      });
    }

    const user = await User.findOne({ phone });

    if (!user) {
      return res.status(404).json({
        success: false,
        code: "NOT_FOUND",
        message: "No account found with this phone number.",
      });
    }

    if (!user.resetVerificationId || !user.resetOtpExpires) {
      return res.status(400).json({
        success: false,
        code: "NO_OTP",
        message: "OTP not requested. Please request OTP first.",
      });
    }

    if (new Date() > new Date(user.resetOtpExpires)) {
      return res.status(400).json({
        success: false,
        code: "OTP_EXPIRED",
        message: "OTP has expired. Please request a new one.",
      });
    }

    if (user.resetOtpAttempts >= 3) {
      return res.status(400).json({
        success: false,
        code: "TOO_MANY_ATTEMPTS",
        message: "Too many failed attempts. Please request a new OTP.",
      });
    }

    const authToken = await getMCAuthToken(
      process.env.MC_CUSTOMER,
      process.env.MC_PASSWORD
    );

    const result = await mcValidateOtp({
      authToken,
      verificationId: user.resetVerificationId,
      code: otp,
      mobileNumber: phone,
      countryCode: process.env.MC_COUNTRY || "91",
      customerId: process.env.MC_CUSTOMER,
    });

    if (!result) {
      return res.status(500).json({
        success: false,
        code: "PROVIDER_ERROR",
        message: "OTP verification failed. Please try again.",
      });
    }

    if (result.verificationStatus === "VERIFICATION_COMPLETED") {
      // Clear OTP fields first (avoids validation issues)
      await User.updateOne(
        { _id: user._id },
        {
          $set: {
            resetVerificationId: undefined,
            resetOtpExpires: undefined,
            resetOtpAttempts: 0,
          },
        }
      );

      // Re-fetch then save password (triggers bcrypt pre-save hook)
      const freshUser = await User.findById(user._id);
      freshUser.password = newPassword;
      await freshUser.save({ validateBeforeSave: false });

      const token = generateToken(user._id, "customer");

      console.log(`🔑 Password reset via OTP for: ${user.phone}`);

      return res.status(200).json({
        success: true,
        message: "Password reset successful",
        data: { user: freshUser.getPublicProfile(), token },
      });
    }

    const respCode = Number(result.responseCode || result.response_code || 0);

    await User.updateOne(
      { _id: user._id },
      { $inc: { resetOtpAttempts: 1 } }
    );

    const updatedUser = await User.findById(user._id).select(
      "resetOtpAttempts"
    );

    if (respCode === 702) {
      return res.status(400).json({
        success: false,
        code: "INVALID_OTP",
        message: "Invalid OTP. Please try again.",
        attemptsRemaining: 3 - updatedUser.resetOtpAttempts,
      });
    }

    if (respCode === 705) {
      return res.status(400).json({
        success: false,
        code: "OTP_EXPIRED",
        message: "OTP has expired. Please request a new one.",
      });
    }

    return res.status(400).json({
      success: false,
      code: "INVALID_OTP",
      message: "OTP verification failed. Please try again.",
      attemptsRemaining: 3 - updatedUser.resetOtpAttempts,
    });
  } catch (error) {
    console.error("Reset Password Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to reset password",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// ============================================================
// PROFILE MANAGEMENT
// ============================================================

exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    const creditSummary = user.getCreditSummary();

    const profileData = {
      ...user.getPublicProfile(),
      creditUtilization: creditSummary.creditUtilization,
      totalPaid: creditSummary.totalPaid,
      creditBlockedReason: creditSummary.creditBlockedReason,
    };

    return res.status(200).json({ success: true, data: { user: profileData } });
  } catch (error) {
    console.error("Get Profile Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get profile",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const { name, email, businessName, businessType, gstNumber } = req.body;

    const user = await User.findById(req.user._id);

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    if (name !== undefined) user.name = name;
    if (email !== undefined) user.email = email;
    if (businessName !== undefined) user.businessName = businessName;
    if (businessType !== undefined) user.businessType = businessType;
    if (gstNumber !== undefined) user.gstNumber = gstNumber;

    await user.save();

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      data: { user: user.getPublicProfile() },
    });
  } catch (error) {
    console.error("Update Profile Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update profile",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Current password and new password are required",
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: "New password must be at least 6 characters",
      });
    }

    const user = await User.findById(req.user._id).select("+password");

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Current password is incorrect",
      });
    }

    user.password = newPassword;
    await user.save();

    const authToken = generateToken(user._id, "customer");

    return res.status(200).json({
      success: true,
      message: "Password changed successfully",
      data: { token: authToken },
    });
  } catch (error) {
    console.error("Change Password Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to change password",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

exports.updatePushToken = async (req, res) => {
  try {
    const { pushToken } = req.body;

    // ✅ Log so we can confirm the endpoint is being hit
    console.log(`🔔 updatePushToken called for user ${req.user._id}`);
    console.log(`🔔 Token received: ${pushToken ? pushToken.substring(0, 30) + '...' : 'NULL'}`);

    await User.findByIdAndUpdate(req.user._id, {
      pushToken: pushToken || null,
      pushTokenUpdatedAt: new Date(),
    });

    console.log(`🔔 Push token ${pushToken ? 'saved' : 'cleared'} for user ${req.user._id}`);

    return res.status(200).json({
      success: true,
      message: pushToken
        ? "Push token updated successfully"
        : "Push token cleared successfully",
    });
  } catch (error) {
    console.error("Update Push Token Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update push token",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

exports.getNotificationPreferences = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select(
      "notificationPreferences"
    );

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    const prefs = {
      pushEnabled: user.notificationPreferences?.pushEnabled ?? true,
      inAppEnabled: user.notificationPreferences?.inAppEnabled ?? true,
      orderUpdates: user.notificationPreferences?.orderUpdates ?? true,
      paymentNotifications:
        user.notificationPreferences?.paymentNotifications ?? true,
      promotions: user.notificationPreferences?.promotions ?? true,
      announcements: user.notificationPreferences?.announcements ?? true,
    };

    return res
      .status(200)
      .json({ success: true, data: { preferences: prefs } });
  } catch (error) {
    console.error("Get Notification Preferences Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get notification preferences",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

exports.updateNotificationPreferences = async (req, res) => {
  try {
    const {
      pushEnabled,
      inAppEnabled,
      orderUpdates,
      paymentNotifications,
      promotions,
      announcements,
    } = req.body;

    const user = await User.findById(req.user._id).select(
      "notificationPreferences pushToken"
    );

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    if (!user.notificationPreferences) {
      user.notificationPreferences = {};
    }

    if (pushEnabled !== undefined)
      user.notificationPreferences.pushEnabled = pushEnabled;
    if (inAppEnabled !== undefined)
      user.notificationPreferences.inAppEnabled = inAppEnabled;
    if (orderUpdates !== undefined)
      user.notificationPreferences.orderUpdates = orderUpdates;
    if (paymentNotifications !== undefined)
      user.notificationPreferences.paymentNotifications = paymentNotifications;
    if (promotions !== undefined)
      user.notificationPreferences.promotions = promotions;
    if (announcements !== undefined)
      user.notificationPreferences.announcements = announcements;

    user.markModified("notificationPreferences");
    await user.save({ validateBeforeSave: false });

    const prefs = {
      pushEnabled: user.notificationPreferences.pushEnabled ?? true,
      inAppEnabled: user.notificationPreferences.inAppEnabled ?? true,
      orderUpdates: user.notificationPreferences.orderUpdates ?? true,
      paymentNotifications:
        user.notificationPreferences.paymentNotifications ?? true,
      promotions: user.notificationPreferences.promotions ?? true,
      announcements: user.notificationPreferences.announcements ?? true,
    };

    console.log(
      `🔔 Notification preferences updated for user ${user._id}`
    );

    return res.status(200).json({
      success: true,
      message: "Notification preferences updated",
      data: { preferences: prefs },
    });
  } catch (error) {
    console.error("Update Notification Preferences Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update notification preferences",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};