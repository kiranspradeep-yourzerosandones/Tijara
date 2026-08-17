// backend/models/OtpLog.js

const mongoose = require("mongoose");

const otpLogSchema = new mongoose.Schema({
  phone: {
    type: String,
    required: true,
  },

  purpose: {
    type: String,
    enum: ["registration", "login", "reset_password", "verify_delivery"],
    default: "registration",
  },

  verificationId: {
    type: String,
  },

  // ── NEW: store the request IP for combo limiting ──────────
  ip: {
    type: String,
    default: null,
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// TTL — auto-delete logs after 24 hours
otpLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 86400 });

// Compound index for IP+Phone combo query (Layer 2)
otpLogSchema.index({ phone: 1, ip: 1, createdAt: 1 });

// Phone+date index for daily limit query (Layer 3)
otpLogSchema.index({ phone: 1, createdAt: 1 });

module.exports = mongoose.model("OtpLog", otpLogSchema);