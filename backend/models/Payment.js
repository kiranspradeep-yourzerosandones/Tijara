// D:\yzo_ongoing\Tijara\backend\models\Payment.js
const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema({
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Order",
    required: true
  },

  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },

  paymentNumber: {
    type: String,
    required: true,
    unique: true // ✅ This already creates an index - NO need for schema.index()
  },

  orderNumber: {
    type: String,
    required: true
  },

  amount: {
    type: Number,
    required: true,
    min: [0.01, "Amount must be greater than 0"]
  },

  method: {
    type: String,
    enum: ["cash", "bank_transfer", "cheque", "upi", "credit_note", "other"],
    required: true
  },

  methodDetails: {
    bankName: String,
    accountNumber: String,
    transactionId: String,
    
    chequeNumber: String,
    chequeDate: Date,
    chequeBankName: String,
    
    upiId: String,
    upiTransactionId: String,
    
    creditNoteNumber: String,
    creditNoteReason: String
  },

  status: {
    type: String,
    enum: ["pending", "completed", "failed", "cancelled", "refunded"],
    default: "completed"
  },

  paymentDate: {
    type: Date,
    required: true,
    default: Date.now
  },

  notes: {
    type: String,
    maxlength: 500
  },

  internalNotes: {
    type: String,
    maxlength: 1000
  },

  recordedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },

  isVerified: {
    type: Boolean,
    default: true
  },

  verifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },

  verifiedAt: Date,

  receiptNumber: String,

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

// ============================================================
// INDEXES - ✅ FIXED: Removed paymentNumber (already has unique: true)
// ============================================================
paymentSchema.index({ user: 1, createdAt: -1 });
paymentSchema.index({ order: 1, createdAt: -1 });
// paymentSchema.index({ paymentNumber: 1 }); // ❌ REMOVED - duplicate!
paymentSchema.index({ paymentDate: -1 });
paymentSchema.index({ status: 1, paymentDate: -1 });

paymentSchema.statics.generatePaymentNumber = async function() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  const datePrefix = `${year}${month}${day}`;

  const startOfDay = new Date(today.setHours(0, 0, 0, 0));
  const endOfDay = new Date(today.setHours(23, 59, 59, 999));

  const count = await this.countDocuments({
    createdAt: { $gte: startOfDay, $lte: endOfDay }
  });

  const sequence = String(count + 1).padStart(4, '0');
  return `PAY-${datePrefix}-${sequence}`;
};

paymentSchema.statics.getOrderPayments = async function(orderId) {
  const payments = await this.find({
    order: orderId,
    status: "completed"
  }).sort({ paymentDate: -1 });

  const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);

  return { payments, totalPaid };
};

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