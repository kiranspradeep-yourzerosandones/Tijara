const mongoose = require("mongoose");

const otpLogSchema = new mongoose.Schema({
  phone: {
    type: String,
    required: true,
    index: true
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
    default: Date.now,
    index: true
  }
});

// Auto-delete after 24 hours
otpLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 86400 });

module.exports = mongoose.model("OtpLog", otpLogSchema);