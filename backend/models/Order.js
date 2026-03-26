const mongoose = require("mongoose");

// Order Item Schema (embedded)
const orderItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true
  },

  // Product details snapshot (preserved even if product changes/deleted)
  productSnapshot: {
    title: {
      type: String,
      required: true
    },
    slug: String,
    image: String,
    category: String,
    brand: String,
    unit: {
      type: String,
      default: "piece"
    }
  },

  // Quantity ordered
  quantity: {
    type: Number,
    required: true,
    min: 1
  },

  // Price per unit at time of order
  unitPrice: {
    type: Number,
    required: true
  },

  // Item subtotal (quantity * unitPrice)
  subtotal: {
    type: Number,
    required: true
  }

}, { _id: true });

// Delivery Address Schema (embedded snapshot)
const deliveryAddressSchema = new mongoose.Schema({
  // Reference to original location (may be deleted later)
  locationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Location"
  },

  // Snapshot of address at time of order
  label: String,
  shopName: {
    type: String,
    required: true
  },
  contactPerson: String,
  contactPhone: {
    type: String,
    required: true
  },
  addressLine1: {
    type: String,
    required: true
  },
  addressLine2: String,
  city: {
    type: String,
    required: true
  },
  state: {
    type: String,
    required: true
  },
  pincode: {
    type: String,
    required: true
  },
  country: {
    type: String,
    default: "India"
  },
  coordinates: {
    latitude: Number,
    longitude: Number
  },
  deliveryInstructions: String

}, { _id: false });

// Order Status History Schema (embedded)
const statusHistorySchema = new mongoose.Schema({
  status: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },
  note: String

}, { _id: true });

// Main Order Schema
const orderSchema = new mongoose.Schema({
  // Unique order number
  orderNumber: {
    type: String,
    required: true,
    unique: true,
    index: true
  },

  // Reference to customer
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true
  },

  // Customer snapshot (in case user details change)
  customerSnapshot: {
    name: {
      type: String,
      required: true
    },
    phone: {
      type: String,
      required: true
    },
    email: String,
    businessName: String
  },

  // Order items
  items: {
    type: [orderItemSchema],
    required: true,
    validate: {
      validator: function(items) {
        return items && items.length > 0;
      },
      message: "Order must have at least one item"
    }
  },

  // Delivery address (snapshot)
  deliveryAddress: {
    type: deliveryAddressSchema,
    required: true
  },

  // Order amounts
  subtotal: {
    type: Number,
    required: true
  },

  // Discount amount (if any)
  discount: {
    type: Number,
    default: 0
  },

  // Tax amount (if applicable)
  tax: {
    type: Number,
    default: 0
  },

  // Delivery charges (if any)
  deliveryCharges: {
    type: Number,
    default: 0
  },

  // Grand total
  totalAmount: {
    type: Number,
    required: true
  },

  // Order status
  status: {
    type: String,
    enum: [
      "pending",      // Order placed, waiting for confirmation
      "confirmed",    // Order confirmed by admin
      "packed",       // Order packed and ready
      "shipped",      // Order dispatched
      "on_the_way",   // Out for delivery
      "delivered",    // Order delivered
      "cancelled"     // Order cancelled
    ],
    default: "pending",
    index: true
  },

  // Status history
  statusHistory: [statusHistorySchema],

  // Payment status
  paymentStatus: {
    type: String,
    enum: ["pending", "paid", "partial", "refunded"],
    default: "pending",
    index: true
  },

  // Payment details
  payment: {
    // Amount paid so far
    amountPaid: {
      type: Number,
      default: 0
    },
    // Payment method (for record keeping)
    method: {
      type: String,
      enum: ["cash", "bank_transfer", "cheque", "upi", "credit", "other"],
      default: "credit"
    },
    // Payment notes
    notes: String,
    // Payment date
    paidAt: Date,
    // Who marked as paid
    markedPaidBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    }
  },

  // Order notes
  customerNotes: {
    type: String,
    maxlength: 500
  },

  // Internal notes (admin only)
  internalNotes: {
    type: String,
    maxlength: 1000
  },

  // Delivery OTP (for delivery confirmation)
  deliveryOtp: {
    code: String,
    generatedAt: Date,
    expiresAt: Date,
    verified: {
      type: Boolean,
      default: false
    },
    verifiedAt: Date
  },

  // Timestamps for key events
  confirmedAt: Date,
  packedAt: Date,
  shippedAt: Date,
  deliveredAt: Date,
  cancelledAt: Date,

  // Cancellation details
  cancellation: {
    reason: String,
    cancelledBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },
    isCustomerCancelled: Boolean
  },

  // Expected delivery date (set by admin)
  expectedDeliveryDate: Date,

  // Actual delivery date
  actualDeliveryDate: Date

}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ status: 1, createdAt: -1 });
orderSchema.index({ paymentStatus: 1 });
orderSchema.index({ createdAt: -1 });
orderSchema.index({ "deliveryAddress.city": 1 });
orderSchema.index({ "deliveryAddress.pincode": 1 });

// Virtual for total items count
orderSchema.virtual('totalItems').get(function() {
  if (!this.items || !Array.isArray(this.items)) return 0;
  return this.items.reduce((sum, item) => sum + item.quantity, 0);
});

// Virtual for unique products count
orderSchema.virtual('uniqueProducts').get(function() {
  if (!this.items || !Array.isArray(this.items)) return 0;
  return this.items.length;
});

// Virtual for outstanding amount
orderSchema.virtual('outstandingAmount').get(function() {
  const total = this.totalAmount || 0;
  const paid = this.payment?.amountPaid || 0;
  return total - paid;
});

// Virtual for is paid
orderSchema.virtual('isPaid').get(function() {
  return this.paymentStatus === "paid";
});

// Virtual for can cancel
orderSchema.virtual('canCancel').get(function() {
  return ["pending", "confirmed"].includes(this.status);
});

// Virtual for is completed
orderSchema.virtual('isCompleted').get(function() {
  return ["delivered", "cancelled"].includes(this.status);
});

// Pre-save middleware to update status history
orderSchema.pre("save", function() {
  // If status changed, add to history
  if (this.isModified("status")) {
    // Don't add duplicate status to history (it's already added in controller)
    const lastHistoryStatus = this.statusHistory.length > 0 
      ? this.statusHistory[this.statusHistory.length - 1].status 
      : null;
    
    if (lastHistoryStatus !== this.status) {
      this.statusHistory.push({
        status: this.status,
        timestamp: new Date()
      });
    }

    // Update timestamp fields
    switch (this.status) {
      case "confirmed":
        this.confirmedAt = new Date();
        break;
      case "packed":
        this.packedAt = new Date();
        break;
      case "shipped":
        this.shippedAt = new Date();
        break;
      case "delivered":
        this.deliveredAt = new Date();
        this.actualDeliveryDate = new Date();
        break;
      case "cancelled":
        this.cancelledAt = new Date();
        break;
    }
  }
  // No next() needed - Mongoose handles this automatically for non-async functions too in newer versions
});

// Static method to get status display text
orderSchema.statics.getStatusText = function(status) {
  const statusTexts = {
    pending: "Order Placed",
    confirmed: "Order Confirmed",
    packed: "Packed & Ready",
    shipped: "Shipped",
    on_the_way: "Out for Delivery",
    delivered: "Delivered",
    cancelled: "Cancelled"
  };
  return statusTexts[status] || status;
};

// Static method to get next valid statuses
orderSchema.statics.getNextStatuses = function(currentStatus) {
  const transitions = {
    pending: ["confirmed", "cancelled"],
    confirmed: ["packed", "cancelled"],
    packed: ["shipped", "cancelled"],
    shipped: ["on_the_way", "delivered"],
    on_the_way: ["delivered"],
    delivered: [],
    cancelled: []
  };
  return transitions[currentStatus] || [];
};

// Method to check if can transition to status
orderSchema.methods.canTransitionTo = function(newStatus) {
  const validTransitions = this.constructor.getNextStatuses(this.status);
  return validTransitions.includes(newStatus);
};

// Method to get order summary
orderSchema.methods.getSummary = function() {
  return {
    orderNumber: this.orderNumber,
    status: this.status,
    statusText: this.constructor.getStatusText(this.status),
    totalItems: this.totalItems,
    totalAmount: this.totalAmount,
    paymentStatus: this.paymentStatus,
    outstandingAmount: this.outstandingAmount,
    createdAt: this.createdAt
  };
};

module.exports = mongoose.model("Order", orderSchema);