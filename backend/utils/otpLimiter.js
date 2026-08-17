// backend/utils/otpLimiter.js

const OtpLog = require("../models/OtpLog");

// ============================================================
// LAYER 2 — IP + PHONE COMBO CHECK
// 3 OTPs per phone per IP per hour
// ============================================================

/**
 * Check if this specific IP has already sent too many OTPs
 * to this specific phone number in the last hour.
 *
 * This catches one person spamming the same number from one device
 * without affecting other users on the same network using different numbers.
 *
 * @param {string} phone - Phone number
 * @param {string} ip    - Request IP address
 * @param {number} limit - Max OTPs per phone+IP per hour (default 3)
 * @returns {{ allowed: boolean, remaining: number }}
 */
const checkIpPhoneComboLimit = async (phone, ip, limit = 3) => {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

  const count = await OtpLog.countDocuments({
    phone,
    ip,
    createdAt: { $gte: oneHourAgo },
  });

  const remaining = Math.max(0, limit - count);
  const allowed = count < limit;

  console.log(
    `🔗 IP+Phone Combo Check — Phone: ${phone}, IP: ${ip}, ` +
    `Sent: ${count}/${limit}, Allowed: ${allowed}`
  );

  return { allowed, remaining, count };
};

// ============================================================
// LAYER 3 — PHONE DAILY LIMIT (existing, unchanged)
// 10 OTPs per phone per day
// ============================================================

/**
 * Check if phone number has exceeded daily SMS OTP limit.
 *
 * @param {string} phone      - Phone number
 * @param {number} dailyLimit - Maximum OTPs per day (default 10)
 * @returns {{ allowed: boolean, remaining: number, count: number }}
 */
const checkSmsOtpLimit = async (phone, dailyLimit = 10) => {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const count = await OtpLog.countDocuments({
    phone,
    createdAt: { $gte: todayStart },
  });

  const remaining = Math.max(0, dailyLimit - count);
  const allowed = count < dailyLimit;

  console.log(
    `📊 Daily Limit Check — Phone: ${phone}, ` +
    `Sent: ${count}/${dailyLimit}, Allowed: ${allowed}`
  );

  return { allowed, remaining, count };
};

// ============================================================
// LOG OTP SENT — now includes IP
// ============================================================

/**
 * Log an OTP send event.
 * Now stores IP so the combo check can query it.
 *
 * @param {string} phone          - Phone number
 * @param {string} purpose        - registration | login | reset_password
 * @param {string} verificationId - MC verification ID
 * @param {string} ip             - Request IP address
 */
const logOtpSent = async (phone, purpose, verificationId, ip = null) => {
  await OtpLog.create({
    phone,
    purpose,
    verificationId,
    ip,
  });

  console.log(
    `📝 OTP logged — Phone: ${phone}, Purpose: ${purpose}, IP: ${ip}`
  );
};

module.exports = {
  checkSmsOtpLimit,
  checkIpPhoneComboLimit,
  logOtpSent,
};