const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema({
  // Reference to order
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Order",
    required: true,
    index: true
  },

  // Reference to user (customer)
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true
  },

  // Payment reference number (for tracking)
  paymentNumber: {
    type: String,
    required: true,
    unique: true,
    index: true
  },

  // Order number snapshot
  orderNumber: {
    type: String,
    required: true
  },

  // Amount paid in this transaction
  amount: {
    type: Number,
    required: true,
    min: [0.01, "Amount must be greater than 0"]
  },

  // Payment method
  method: {
    type: String,
    enum: ["cash", "bank_transfer", "cheque", "upi", "credit_note", "other"],
    required: true
  },

  // Payment method details
  methodDetails: {
    // For bank transfer
    bankName: String,
    accountNumber: String,
    transactionId: String,
    
    // For cheque
    chequeNumber: String,
    chequeDate: Date,
    chequeBankName: String,
    
    // For UPI
    upiId: String,
    upiTransactionId: String,
    
    // For credit note
    creditNoteNumber: String,
    creditNoteReason: String
  },

  // Payment status
  status: {
    type: String,
    enum: ["pending", "completed", "failed", "cancelled", "refunded"],
    default: "completed",
    index: true
  },

  // Payment date (when payment was actually made)
  paymentDate: {
    type: Date,
    required: true,
    default: Date.now
  },

  // Notes
  notes: {
    type: String,
    maxlength: 500
  },

  // Internal notes (admin only)
  internalNotes: {
    type: String,
    maxlength: 1000
  },

  // Who recorded this payment
  recordedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },

  // Verification status (for cheques, etc.)
  isVerified: {
    type: Boolean,
    default: true
  },

  verifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },

  verifiedAt: Date,

  // Receipt number (if physical receipt given)
  receiptNumber: String,

  // Attachments (receipt images, etc.)
  attachments: [{
    filename: String,
    url: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }]

}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
paymentSchema.index({ user: 1, createdAt: -1 });
paymentSchema.index({ order: 1, createdAt: -1 });
paymentSchema.index({ paymentDate: -1 });
paymentSchema.index({ status: 1, paymentDate: -1 });

// Static method to generate payment number
paymentSchema.statics.generatePaymentNumber = async function() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  const datePrefix = `${year}${month}${day}`;

  // Get today's payment count
  const startOfDay = new Date(today.setHours(0, 0, 0, 0));
  const endOfDay = new Date(today.setHours(23, 59, 59, 999));

  const count = await this.countDocuments({
    createdAt: { $gte: startOfDay, $lte: endOfDay }
  });

  const sequence = String(count + 1).padStart(4, '0');
  return `PAY-${datePrefix}-${sequence}`;
};

// Static method to get total payments for an order
paymentSchema.statics.getOrderPayments = async function(orderId) {
  const payments = await this.find({
    order: orderId,
    status: "completed"
  }).sort({ paymentDate: -1 });

  const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);

  return { payments, totalPaid };
};

// Static method to get user payment summary
paymentSchema.statics.getUserPaymentSummary = async function(userId) {
  const result = await this.aggregate([
    {
      $match: {
        user: new mongoose.Types.ObjectId(userId),
        status: "completed"
      }
    },
    {
      $group: {
        _id: null,
        totalPayments: { $sum: 1 },
        totalAmountPaid: { $sum: "$amount" },
        lastPaymentDate: { $max: "$paymentDate" }
      }
    }
  ]);

  return result[0] || {
    totalPayments: 0,
    totalAmountPaid: 0,
    lastPaymentDate: null
  };
};

module.exports = mongoose.model("Payment", paymentSchema);