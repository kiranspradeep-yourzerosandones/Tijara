const OtpLog = require("../models/OtpLog");

/**
 * Check if phone number has exceeded daily SMS OTP limit
 * @param {string} phone - Phone number
 * @param {number} dailyLimit - Maximum OTPs per day (default 10)
 * @returns {Object} - { allowed: boolean, remaining: number }
 */
const checkSmsOtpLimit = async (phone, dailyLimit = 10) => {
  // Get start of today
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  // Count OTPs sent today for this phone
  const count = await OtpLog.countDocuments({
    phone,
    createdAt: { $gte: todayStart }
  });

  const remaining = Math.max(0, dailyLimit - count);
  const allowed = count < dailyLimit;

  console.log(`📊 OTP Limit Check - Phone: ${phone}, Sent: ${count}, Remaining: ${remaining}`);

  return {
    allowed,
    remaining,
    count
  };
};

/**
 * Log OTP sent event
 * @param {string} phone - Phone number
 * @param {string} purpose - Purpose (registration, login, reset_password)
 * @param {string} verificationId - MC verification ID
 */
const logOtpSent = async (phone, purpose, verificationId) => {
  await OtpLog.create({
    phone,
    purpose,
    verificationId
  });
  console.log(`📝 OTP logged - Phone: ${phone}, Purpose: ${purpose}`);
};

module.exports = {
  checkSmsOtpLimit,
  logOtpSent
};