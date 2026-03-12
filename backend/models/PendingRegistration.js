const mongoose = require("mongoose");

const pendingRegistrationSchema = new mongoose.Schema({
  phone: {
    type: String,
    required: true,
    unique: true,
    index: true
  },

  verificationId: {
    type: String,
    required: true
  },

  otpExpires: {
    type: Date,
    required: true
  },

  otpAttempts: {
    type: Number,
    default: 0
  },

  isVerified: {
    type: Boolean,
    default: false
  },

  verifiedAt: {
    type: Date
  },

  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Auto-delete after 30 minutes
pendingRegistrationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 1800 });

module.exports = mongoose.model("PendingRegistration", pendingRegistrationSchema);