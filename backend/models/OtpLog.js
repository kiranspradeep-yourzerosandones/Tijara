// D:\yzo_ongoing\Tijara\backend\models\OtpLog.js
const mongoose = require("mongoose");

const otpLogSchema = new mongoose.Schema({
  phone: {
    type: String,
    required: true
  },

  purpose: {
    type: String,
    enum: ["registration", "login", "reset_password", "verify_delivery"],
    default: "registration"
  },

  verificationId: {
    type: String
  },

  createdAt: {
    type: Date,
    default: Date.now
  }
});

// ✅ FIXED: Combined into one index with TTL
otpLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 86400 });

module.exports = mongoose.model("OtpLog", otpLogSchema);