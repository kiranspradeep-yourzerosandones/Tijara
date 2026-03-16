// Dbackend\controllers\authController.js
const User = require("../models/User");
const PendingRegistration = require("../models/PendingRegistration");
const { generateToken } = require("../utils/jwtUtils");
const { checkSmsOtpLimit, logOtpSent } = require("../utils/otpLimiter");
const { 
  getMCAuthToken, 
  mcSendOtp, 
  mcValidateOtp 
} = require("../services/messageCentral");
const emailService = require("../services/emailService");

// ============================================================
// REGISTRATION FLOW
// ============================================================

exports.requestPasswordResetEmail = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required"
      });
    }

    // Validate email format
    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid email address"
      });
    }

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() });

    // Always return success to prevent email enumeration
    if (!user) {
      console.log(`Password reset requested for non-existent email: ${email}`);
      return res.status(200).json({
        success: true,
        message: "If an account exists with this email, you will receive a password reset link."
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(200).json({
        success: true,
        message: "If an account exists with this email, you will receive a password reset link."
      });
    }

    // Generate reset token
    const resetToken = user.generatePasswordResetToken();
    await user.save({ validateBeforeSave: false });

    // Create reset URL
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password/${resetToken}`;

    // Send email
    const emailResult = await emailService.sendPasswordResetEmail({
      to: user.email,
      name: user.name,
      resetUrl,
      expiresIn: "1 hour"
    });

    if (!emailResult.success && !emailResult.devMode) {
      // Clear reset token if email failed
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;
      await user.save({ validateBeforeSave: false });

      console.error("Failed to send password reset email:", emailResult.message);
      return res.status(500).json({
        success: false,
        message: "Failed to send reset email. Please try again later."
      });
    }

    console.log(`📧 Password reset email sent to: ${user.email}`);

    // In development, include token in response for testing
    const responseData = {
      success: true,
      message: "If an account exists with this email, you will receive a password reset link."
    };

    if (process.env.NODE_ENV === "development") {
      responseData.devInfo = {
        resetToken,
        resetUrl
      };
    }

    res.status(200).json(responseData);

  } catch (error) {
    console.error("Request Password Reset Email Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to process request",
      error: process.env.NODE_ENV === "development" ? error.message : undefined
    });
  }
};

/**
 * @desc    Verify reset token (check if valid)
 * @route   GET /api/auth/reset-password/verify/:token
 * @access  Public
 */
exports.verifyResetToken = async (req, res) => {
  try {
    const { token } = req.params;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: "Reset token is required"
      });
    }

    // Verify token
    const user = await User.verifyPasswordResetToken(token);

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired reset token"
      });
    }

    res.status(200).json({
      success: true,
      message: "Token is valid",
      data: {
        email: user.email.replace(/(.{2})(.*)(@.*)/, "$1***$3") // Mask email
      }
    });

  } catch (error) {
    console.error("Verify Reset Token Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to verify token",
      error: process.env.NODE_ENV === "development" ? error.message : undefined
    });
  }
};

/**
 * @desc    Reset password using email token
 * @route   POST /api/auth/reset-password/email
 * @access  Public
 */
exports.resetPasswordWithToken = async (req, res) => {
  try {
    const { token, newPassword, confirmPassword } = req.body;

    // Validate inputs
    if (!token || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Token and new password are required"
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters"
      });
    }

    if (confirmPassword && newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "Passwords do not match"
      });
    }

    // Verify token and get user
    const user = await User.verifyPasswordResetToken(token);

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired reset token. Please request a new one."
      });
    }

    // Update password
    user.password = newPassword;
    user.clearPasswordReset();
    await user.save();

    // Send confirmation email
    if (user.email) {
      await emailService.sendPasswordChangedEmail({
        to: user.email,
        name: user.name
      });
    }

    // Generate new token for auto-login
    const authToken = generateToken(user._id, user.role);

    console.log(`🔑 Password reset successful for user: ${user.phone}`);

    res.status(200).json({
      success: true,
      message: "Password reset successful",
      data: {
        user: user.getPublicProfile(),
        token: authToken
      }
    });

  } catch (error) {
    console.error("Reset Password With Token Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to reset password",
      error: process.env.NODE_ENV === "development" ? error.message : undefined
    });
  }
};

/**
 * @desc    Send OTP for registration
 * @route   POST /api/auth/register/send-otp
 * @access  Public
 */
exports.sendRegistrationOtp = async (req, res) => {
  try {
    const { phone } = req.body;

    // Validate phone
    if (!phone) {
      return res.status(400).json({
        success: false,
        message: "Phone number is required"
      });
    }

    // Validate phone format (10 digit Indian number)
    const phoneRegex = /^[6-9]\d{9}$/;
    if (!phoneRegex.test(phone)) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid 10-digit phone number"
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ phone });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "Phone number already registered. Please login."
      });
    }

    const now = new Date();

    // Check for existing pending registration
    let pending = await PendingRegistration.findOne({ phone });

    if (pending && pending.otpExpires && pending.verificationId) {
      const expiresAt = new Date(pending.otpExpires);

      if (expiresAt > now) {
        // OTP still valid - check cooldown (30 seconds)
        const otpValiditySeconds = 300; // 5 minutes
        const otpSentAt = new Date(expiresAt.getTime() - otpValiditySeconds * 1000);
        const secondsSinceSent = Math.floor((now - otpSentAt) / 1000);

        if (secondsSinceSent < 30) {
          const waitTime = 30 - secondsSinceSent;
          return res.status(429).json({
            success: false,
            code: "OTP_COOLDOWN",
            message: `Please wait ${waitTime} seconds before requesting a new OTP.`,
            waitTime
          });
        }
      }
    }

    // Check daily SMS limit
    const limitCheck = await checkSmsOtpLimit(phone);
    if (!limitCheck.allowed) {
      return res.status(429).json({
        success: false,
        code: "OTP_DAILY_LIMIT",
        message: "Daily OTP limit reached. Please try again tomorrow."
      });
    }

    // Get MC auth token
    const authToken = await getMCAuthToken(
      process.env.MC_CUSTOMER,
      process.env.MC_PASSWORD
    );

    // Send OTP via Message Central
    try {
      const data = await mcSendOtp({
        authToken,
        customerId: process.env.MC_CUSTOMER,
        mobileNumber: phone,
        otpLength: Number(process.env.SMS_OTP_LENGTH || 4),
        countryCode: process.env.MC_COUNTRY || "91"
      });

      const verificationId = 
        data?.verificationId || 
        data?.verificationID || 
        data?.verification_id;
      
      const timeout = Number(data?.timeout || data?.time || 300);

      // Save/update pending registration
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
          otpExpires: new Date(Date.now() + timeout * 1000)
        });
      }

      // Log OTP sent
      await logOtpSent(phone, "registration", verificationId);

      return res.status(200).json({
        success: true,
        message: "OTP sent successfully",
        data: {
          phone,
          timeout,
          expiresIn: `${Math.floor(timeout / 60)} minutes`
        }
      });

    } catch (providerError) {
      console.error("Message Central Error:", providerError);

      const responseCode = providerError?.response?.data?.responseCode;
      const message = providerError?.response?.data?.message;

      // Handle REQUEST_ALREADY_EXISTS
      if (responseCode === 506 || message === "REQUEST_ALREADY_EXISTS") {
        return res.status(429).json({
          success: false,
          code: "OTP_COOLDOWN",
          message: "Please wait 30 seconds before requesting a new OTP.",
          waitTime: 30
        });
      }

      throw providerError;
    }

  } catch (error) {
    console.error("Send Registration OTP Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to send OTP",
      error: process.env.NODE_ENV === "development" ? error.message : undefined
    });
  }
};

/**
 * @desc    Verify registration OTP
 * @route   POST /api/auth/register/verify-otp
 * @access  Public
 */
exports.verifyRegistrationOtp = async (req, res) => {
  try {
    const { phone, otp } = req.body;

    // Validate inputs
    if (!phone || !otp) {
      return res.status(400).json({
        success: false,
        message: "Phone and OTP are required"
      });
    }

    // Find pending registration
    const pending = await PendingRegistration.findOne({ phone });

    if (!pending) {
      return res.status(400).json({
        success: false,
        code: "NO_OTP",
        message: "OTP not requested. Please request OTP first."
      });
    }

    if (!pending.verificationId || !pending.otpExpires) {
      return res.status(400).json({
        success: false,
        code: "NO_OTP",
        message: "OTP not requested. Please request OTP first."
      });
    }

    // Check if OTP expired
    if (new Date() > new Date(pending.otpExpires)) {
      return res.status(400).json({
        success: false,
        code: "OTP_EXPIRED",
        message: "OTP has expired. Please request a new one."
      });
    }

    // Check attempts
    if (pending.otpAttempts >= 3) {
      return res.status(400).json({
        success: false,
        code: "TOO_MANY_ATTEMPTS",
        message: "Too many failed attempts. Please request a new OTP."
      });
    }

    // Get MC auth token
    const authToken = await getMCAuthToken(
      process.env.MC_CUSTOMER,
      process.env.MC_PASSWORD
    );

    // Validate OTP via Message Central
    const result = await mcValidateOtp({
      authToken,
      verificationId: pending.verificationId,
      code: otp,
      mobileNumber: phone,
      countryCode: process.env.MC_COUNTRY || "91",
      customerId: process.env.MC_CUSTOMER
    });

    if (!result) {
      return res.status(500).json({
        success: false,
        code: "PROVIDER_ERROR",
        message: "OTP verification failed. Please try again."
      });
    }

    // Check verification status
    if (result.verificationStatus === "VERIFICATION_COMPLETED") {
      // Mark as verified
      pending.isVerified = true;
      pending.verifiedAt = new Date();
      pending.otpAttempts = 0;
      await pending.save();

      return res.status(200).json({
        success: true,
        message: "Phone number verified successfully",
        data: {
          phone,
          verified: true
        }
      });
    }

    // Handle failed verification
    const respCode = Number(result.responseCode || result.response_code || 0);
    
    // Increment attempts
    pending.otpAttempts += 1;
    await pending.save();

    if (respCode === 702) {
      return res.status(400).json({
        success: false,
        code: "INVALID_OTP",
        message: "Invalid OTP. Please try again.",
        attemptsRemaining: 3 - pending.otpAttempts
      });
    }

    if (respCode === 705) {
      return res.status(400).json({
        success: false,
        code: "OTP_EXPIRED",
        message: "OTP has expired. Please request a new one."
      });
    }

    return res.status(400).json({
      success: false,
      code: "INVALID_OTP",
      message: "OTP verification failed. Please try again.",
      attemptsRemaining: 3 - pending.otpAttempts
    });

  } catch (error) {
    console.error("Verify Registration OTP Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to verify OTP",
      error: process.env.NODE_ENV === "development" ? error.message : undefined
    });
  }
};

/**
 * @desc    Complete registration after OTP verification
 * @route   POST /api/auth/register/complete
 * @access  Public
 */
exports.completeRegistration = async (req, res) => {
  try {
    const { 
      phone, 
      name, 
      password,
      businessName,
      businessType,
      gstNumber,
      email 
    } = req.body;

    if (!phone || !name || !password) {
      return res.status(400).json({
        success: false,
        message: "Phone, name, and password are required"
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters"
      });
    }

    const pending = await PendingRegistration.findOne({ 
      phone, 
      isVerified: true 
    });

    if (!pending) {
      return res.status(400).json({
        success: false,
        message: "Phone number not verified. Please verify OTP first."
      });
    }

    const verifiedAt = new Date(pending.verifiedAt);
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);

    if (verifiedAt < tenMinutesAgo) {
      return res.status(400).json({
        success: false,
        message: "Verification expired. Please verify OTP again."
      });
    }

    const existingUser = await User.findOne({ phone });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "Phone number already registered"
      });
    }

    // ✅ CREATE USER - AUTO-APPROVED (isActive: true by default)
    const user = await User.create({
      name,
      phone,
      password,
      businessName,
      businessType,
      gstNumber,
      email,
      isPhoneVerified: true,
      isActive: true, // ✅ AUTO-APPROVED - No admin approval needed
      role: "customer"
    });

    const token = generateToken(user._id, user.role);

    await PendingRegistration.deleteOne({ phone });

    console.log(`✅ New customer registered (auto-approved): ${user.phone}`);

    res.status(201).json({
      success: true,
      message: "Registration successful. You can now use the app.",
      data: {
        user: user.getPublicProfile(),
        token
      }
    });

  } catch (error) {
    console.error("Complete Registration Error:", error);
    
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Phone number already registered"
      });
    }

    res.status(500).json({
      success: false,
      message: "Registration failed",
      error: process.env.NODE_ENV === "development" ? error.message : undefined
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
 */
exports.login = async (req, res) => {
  try {
    const { phone, password } = req.body;

    // Validate inputs
    if (!phone || !password) {
      return res.status(400).json({
        success: false,
        message: "Phone and password are required"
      });
    }

    // Find user with password
    const user = await User.findOne({ phone }).select("+password");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials"
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: "Your account has been deactivated. Please contact support."
      });
    }

    // Check if locked out
    if (user.otpLockedUntil && new Date(user.otpLockedUntil) > new Date()) {
      const minutesRemaining = Math.ceil(
        (new Date(user.otpLockedUntil) - new Date()) / 60000
      );
      return res.status(403).json({
        success: false,
        code: "ACCOUNT_LOCKED",
        message: `Account temporarily locked. Try again in ${minutesRemaining} minutes.`
      });
    }

    // Check password
    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials"
      });
    }

    // Update last login
    user.lastLoginAt = new Date();
    user.otpCycleFailures = 0;
    user.otpLockedUntil = null;
    await user.save();

    // Generate token
    const token = generateToken(user._id, user.role);

    res.status(200).json({
      success: true,
      message: "Login successful",
      data: {
        user: user.getPublicProfile(),
        token
      }
    });

  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({
      success: false,
      message: "Login failed",
      error: process.env.NODE_ENV === "development" ? error.message : undefined
    });
  }
};

/**
 * @desc    Send OTP for login (passwordless)
 * @route   POST /api/auth/login/send-otp
 * @access  Public
 */
exports.sendLoginOtp = async (req, res) => {
  try {
    const { phone } = req.body;

    // Validate phone
    if (!phone) {
      return res.status(400).json({
        success: false,
        message: "Phone number is required"
      });
    }

    // Find user
    const user = await User.findOne({ phone });

    if (!user) {
      return res.status(404).json({
        success: false,
        code: "NOT_FOUND",
        message: "Phone number not registered. Please register first."
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: "Your account has been deactivated. Please contact support."
      });
    }

    const now = new Date();

    // Check if locked out
    if (user.otpLockedUntil && new Date(user.otpLockedUntil) > now) {
      const minutesRemaining = Math.ceil(
        (new Date(user.otpLockedUntil) - now) / 60000
      );
      return res.status(403).json({
        success: false,
        code: "OTP_LOCKED",
        message: `Account temporarily locked. Try again in ${minutesRemaining} minutes.`
      });
    }

    // Check for existing OTP (cooldown)
    if (user.loginOtpExpires && user.loginVerificationId) {
      const expiresAt = new Date(user.loginOtpExpires);

      if (expiresAt > now) {
        const otpValiditySeconds = 300;
        const otpSentAt = new Date(expiresAt.getTime() - otpValiditySeconds * 1000);
        const secondsSinceSent = Math.floor((now - otpSentAt) / 1000);

        if (secondsSinceSent < 30) {
          const waitTime = 30 - secondsSinceSent;
          return res.status(429).json({
            success: false,
            code: "OTP_COOLDOWN",
            message: `Please wait ${waitTime} seconds before requesting a new OTP.`,
            waitTime
          });
        }
      }
    }

    // Check daily SMS limit
    const limitCheck = await checkSmsOtpLimit(phone);
    if (!limitCheck.allowed) {
      return res.status(429).json({
        success: false,
        code: "OTP_DAILY_LIMIT",
        message: "Daily OTP limit reached. Please try again tomorrow."
      });
    }

    // Get MC auth token
    const authToken = await getMCAuthToken(
      process.env.MC_CUSTOMER,
      process.env.MC_PASSWORD
    );

    // Send OTP
    try {
      const data = await mcSendOtp({
        authToken,
        customerId: process.env.MC_CUSTOMER,
        mobileNumber: phone,
        otpLength: Number(process.env.SMS_OTP_LENGTH || 4),
        countryCode: process.env.MC_COUNTRY || "91"
      });

      const verificationId = 
        data?.verificationId || 
        data?.verificationID || 
        data?.verification_id;
      
      const timeout = Number(data?.timeout || data?.time || 300);

      // Update user with OTP details
      user.loginVerificationId = verificationId;
      user.loginOtpExpires = new Date(Date.now() + timeout * 1000);
      user.loginOtpAttempts = 0;
      await user.save();

      // Log OTP sent
      await logOtpSent(phone, "login", verificationId);

      return res.status(200).json({
        success: true,
        message: "OTP sent successfully",
        data: {
          phone,
          timeout,
          expiresIn: `${Math.floor(timeout / 60)} minutes`
        }
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
          waitTime: 30
        });
      }

      throw providerError;
    }

  } catch (error) {
    console.error("Send Login OTP Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to send OTP",
      error: process.env.NODE_ENV === "development" ? error.message : undefined
    });
  }
};

/**
 * @desc    Verify login OTP
 * @route   POST /api/auth/login/verify-otp
 * @access  Public
 */
exports.verifyLoginOtp = async (req, res) => {
  try {
    const { phone, otp } = req.body;

    // Validate inputs
    if (!phone || !otp) {
      return res.status(400).json({
        success: false,
        message: "Phone and OTP are required"
      });
    }

    // Find user
    const user = await User.findOne({ phone });

    if (!user) {
      return res.status(404).json({
        success: false,
        code: "NOT_FOUND",
        message: "User not found"
      });
    }

    if (!user.loginVerificationId || !user.loginOtpExpires) {
      return res.status(400).json({
        success: false,
        code: "NO_OTP",
        message: "OTP not requested. Please request OTP first."
      });
    }

    // Check if OTP expired
    if (new Date() > new Date(user.loginOtpExpires)) {
      return res.status(400).json({
        success: false,
        code: "OTP_EXPIRED",
        message: "OTP has expired. Please request a new one."
      });
    }

    // Check attempts
    if (user.loginOtpAttempts >= 3) {
      return res.status(400).json({
        success: false,
        code: "TOO_MANY_ATTEMPTS",
        message: "Too many failed attempts. Please request a new OTP."
      });
    }

    // Get MC auth token
    const authToken = await getMCAuthToken(
      process.env.MC_CUSTOMER,
      process.env.MC_PASSWORD
    );

    // Validate OTP
    const result = await mcValidateOtp({
      authToken,
      verificationId: user.loginVerificationId,
      code: otp,
      mobileNumber: phone,
      countryCode: process.env.MC_COUNTRY || "91",
      customerId: process.env.MC_CUSTOMER
    });

    if (!result) {
      return res.status(500).json({
        success: false,
        code: "PROVIDER_ERROR",
        message: "OTP verification failed. Please try again."
      });
    }

    // Check verification status
    if (result.verificationStatus === "VERIFICATION_COMPLETED") {
      // Clear OTP fields and update user
      user.clearLoginOtp();
      user.lastLoginAt = new Date();
      user.otpCycleFailures = 0;
      user.otpLockedUntil = null;
      await user.save();

      // Generate token
      const token = generateToken(user._id, user.role);

      return res.status(200).json({
        success: true,
        message: "Login successful",
        data: {
          user: user.getPublicProfile(),
          token
        }
      });
    }

    // Handle failed verification
    const respCode = Number(result.responseCode || result.response_code || 0);
    
    const newAttempts = user.loginOtpAttempts + 1;
    const newCycleFailures = newAttempts >= 3 
      ? (user.otpCycleFailures || 0) + 1 
      : user.otpCycleFailures || 0;

    // Lock account after 5 failed OTP cycles (15 total wrong guesses)
    const shouldLock = newCycleFailures >= 5;

    user.loginOtpAttempts = newAttempts;
    user.otpCycleFailures = newCycleFailures;
    
    if (shouldLock) {
      user.otpLockedUntil = new Date(Date.now() + 60 * 60 * 1000); // 1 hour lockout
    }
    
    await user.save();

    if (shouldLock) {
      return res.status(403).json({
        success: false,
        code: "OTP_LOCKED",
        message: "Too many failed attempts. Account locked for 1 hour."
      });
    }

    if (respCode === 702) {
      return res.status(400).json({
        success: false,
        code: "INVALID_OTP",
        message: "Invalid OTP. Please try again.",
        attemptsRemaining: 3 - newAttempts
      });
    }

    if (respCode === 705) {
      return res.status(400).json({
        success: false,
        code: "OTP_EXPIRED",
        message: "OTP has expired. Please request a new one."
      });
    }

    return res.status(400).json({
      success: false,
      code: "INVALID_OTP",
      message: "OTP verification failed. Please try again.",
      attemptsRemaining: 3 - newAttempts
    });

  } catch (error) {
    console.error("Verify Login OTP Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to verify OTP",
      error: process.env.NODE_ENV === "development" ? error.message : undefined
    });
  }
};

// ============================================================
// FORGOT PASSWORD FLOW
// ============================================================

/**
 * @desc    Send OTP for password reset
 * @route   POST /api/auth/forgot-password/send-otp
 * @access  Public
 */
exports.sendForgotPasswordOtp = async (req, res) => {
  try {
    const { phone } = req.body;

    if (!phone) {
      return res.status(400).json({
        success: false,
        message: "Phone number is required"
      });
    }

    // Find user
    const user = await User.findOne({ phone });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "No account found with this phone number"
      });
    }

    const now = new Date();

    // Check cooldown
    if (user.resetOtpExpires && user.resetVerificationId) {
      const expiresAt = new Date(user.resetOtpExpires);

      if (expiresAt > now) {
        const otpValiditySeconds = 300;
        const otpSentAt = new Date(expiresAt.getTime() - otpValiditySeconds * 1000);
        const secondsSinceSent = Math.floor((now - otpSentAt) / 1000);

        if (secondsSinceSent < 30) {
          const waitTime = 30 - secondsSinceSent;
          return res.status(429).json({
            success: false,
            code: "OTP_COOLDOWN",
            message: `Please wait ${waitTime} seconds before requesting a new OTP.`,
            waitTime
          });
        }
      }
    }

    // Check daily limit
    const limitCheck = await checkSmsOtpLimit(phone);
    if (!limitCheck.allowed) {
      return res.status(429).json({
        success: false,
        code: "OTP_DAILY_LIMIT",
        message: "Daily OTP limit reached. Please try again tomorrow."
      });
    }

    // Get MC auth token
    const authToken = await getMCAuthToken(
      process.env.MC_CUSTOMER,
      process.env.MC_PASSWORD
    );

    // Send OTP
    try {
      const data = await mcSendOtp({
        authToken,
        customerId: process.env.MC_CUSTOMER,
        mobileNumber: phone,
        otpLength: Number(process.env.SMS_OTP_LENGTH || 4),
        countryCode: process.env.MC_COUNTRY || "91"
      });

      const verificationId = 
        data?.verificationId || 
        data?.verificationID || 
        data?.verification_id;
      
      const timeout = Number(data?.timeout || data?.time || 300);

      // Update user
      user.resetVerificationId = verificationId;
      user.resetOtpExpires = new Date(Date.now() + timeout * 1000);
      user.resetOtpAttempts = 0;
      await user.save();

      // Log OTP sent
      await logOtpSent(phone, "reset_password", verificationId);

      return res.status(200).json({
        success: true,
        message: "OTP sent successfully",
        data: {
          phone,
          timeout,
          expiresIn: `${Math.floor(timeout / 60)} minutes`
        }
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
          waitTime: 30
        });
      }

      throw providerError;
    }

  } catch (error) {
    console.error("Send Forgot Password OTP Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to send OTP",
      error: process.env.NODE_ENV === "development" ? error.message : undefined
    });
  }
};

/**
 * @desc    Reset password with OTP
 * @route   POST /api/auth/forgot-password/reset
 * @access  Public
 */
exports.resetPassword = async (req, res) => {
  try {
    const { phone, otp, newPassword } = req.body;

    // Validate inputs
    if (!phone || !otp || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Phone, OTP, and new password are required"
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters"
      });
    }

    // Find user
    const user = await User.findOne({ phone });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    if (!user.resetVerificationId || !user.resetOtpExpires) {
      return res.status(400).json({
        success: false,
        code: "NO_OTP",
        message: "OTP not requested. Please request OTP first."
      });
    }

    // Check if OTP expired
    if (new Date() > new Date(user.resetOtpExpires)) {
      return res.status(400).json({
        success: false,
        code: "OTP_EXPIRED",
        message: "OTP has expired. Please request a new one."
      });
    }

    // Check attempts
    if (user.resetOtpAttempts >= 3) {
      return res.status(400).json({
        success: false,
        code: "TOO_MANY_ATTEMPTS",
        message: "Too many failed attempts. Please request a new OTP."
      });
    }

    // Get MC auth token
    const authToken = await getMCAuthToken(
      process.env.MC_CUSTOMER,
      process.env.MC_PASSWORD
    );

    // Validate OTP
    const result = await mcValidateOtp({
      authToken,
      verificationId: user.resetVerificationId,
      code: otp,
      mobileNumber: phone,
      countryCode: process.env.MC_COUNTRY || "91",
      customerId: process.env.MC_CUSTOMER
    });

    if (!result) {
      return res.status(500).json({
        success: false,
        code: "PROVIDER_ERROR",
        message: "OTP verification failed. Please try again."
      });
    }

    // Check verification status
    if (result.verificationStatus === "VERIFICATION_COMPLETED") {
      // Update password
      user.password = newPassword;
      user.clearResetOtp();
      await user.save();

      // Generate token
      const token = generateToken(user._id, user.role);

      return res.status(200).json({
        success: true,
        message: "Password reset successful",
        data: {
          user: user.getPublicProfile(),
          token
        }
      });
    }

    // Handle failed verification
    const respCode = Number(result.responseCode || result.response_code || 0);
    
    user.resetOtpAttempts += 1;
    await user.save();

    if (respCode === 702) {
      return res.status(400).json({
        success: false,
        code: "INVALID_OTP",
        message: "Invalid OTP. Please try again.",
        attemptsRemaining: 3 - user.resetOtpAttempts
      });
    }

    if (respCode === 705) {
      return res.status(400).json({
        success: false,
        code: "OTP_EXPIRED",
        message: "OTP has expired. Please request a new one."
      });
    }

    return res.status(400).json({
      success: false,
      code: "INVALID_OTP",
      message: "OTP verification failed. Please try again.",
      attemptsRemaining: 3 - user.resetOtpAttempts
    });

  } catch (error) {
    console.error("Reset Password Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to reset password",
      error: process.env.NODE_ENV === "development" ? error.message : undefined
    });
  }
};

// ============================================================
// PROFILE MANAGEMENT
// ============================================================

/**
 * @desc    Get current user profile
 * @route   GET /api/auth/me
 * @access  Private
 */
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    res.status(200).json({
      success: true,
      data: {
        user: user.getPublicProfile()
      }
    });

  } catch (error) {
    console.error("Get Profile Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get profile",
      error: process.env.NODE_ENV === "development" ? error.message : undefined
    });
  }
};

/**
 * @desc    Update user profile
 * @route   PUT /api/auth/profile
 * @access  Private
 */
exports.updateProfile = async (req, res) => {
  try {
    const { 
      name, 
      email, 
      businessName, 
      businessType, 
      gstNumber 
    } = req.body;

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    // Update fields
    if (name) user.name = name;
    if (email !== undefined) user.email = email;
    if (businessName !== undefined) user.businessName = businessName;
    if (businessType !== undefined) user.businessType = businessType;
    if (gstNumber !== undefined) user.gstNumber = gstNumber;

    await user.save();

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      data: {
        user: user.getPublicProfile()
      }
    });

  } catch (error) {
    console.error("Update Profile Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update profile",
      error: process.env.NODE_ENV === "development" ? error.message : undefined
    });
  }
};

/**
 * @desc    Change password (when logged in)
 * @route   PUT /api/auth/change-password
 * @access  Private
 */
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Current password and new password are required"
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: "New password must be at least 6 characters"
      });
    }

    // Get user with password
    const user = await User.findById(req.user._id).select("+password");

    // Check current password
    const isMatch = await user.comparePassword(currentPassword);

    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Current password is incorrect"
      });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    // Generate new token
    const token = generateToken(user._id, user.role);

    res.status(200).json({
      success: true,
      message: "Password changed successfully",
      data: { token }
    });

  } catch (error) {
    console.error("Change Password Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to change password",
      error: process.env.NODE_ENV === "development" ? error.message : undefined
    });
  }
};

/**
 * @desc    Update FCM Token (for push notifications)
 * @route   PUT /api/auth/fcm-token
 * @access  Private
 */
exports.updateFCMToken = async (req, res) => {
  try {
    const { fcmToken } = req.body;

    if (!fcmToken) {
      return res.status(400).json({
        success: false,
        message: "FCM token is required"
      });
    }

    await User.findByIdAndUpdate(req.user._id, { fcmToken });

    res.status(200).json({
      success: true,
      message: "FCM token updated successfully"
    });

  } catch (error) {
    console.error("Update FCM Token Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update FCM token",
      error: process.env.NODE_ENV === "development" ? error.message : undefined
    });
  }
};