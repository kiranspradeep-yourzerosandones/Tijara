// backend/models/Order.js
const mongoose = require("mongoose");

// Order Item Schema (embedded)
const orderItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true
  },
  productSnapshot: {
    title: { type: String, required: true },
    slug: String,
    image: String,
    category: String,
    brand: String,
    unit: { type: String, default: "piece" }
  },
  quantity: { type: Number, required: true, min: 1 },
  unitPrice: { type: Number, required: true },
  subtotal: { type: Number, required: true }
}, { _id: true });

// Delivery Address Schema (embedded snapshot)
const deliveryAddressSchema = new mongoose.Schema({
  locationId: { type: mongoose.Schema.Types.ObjectId, ref: "Location" },
  label: String,
  shopName: { type: String, required: true },
  contactPerson: String,
  contactPhone: { type: String, required: true },
  addressLine1: { type: String, required: true },
  addressLine2: String,
  city: { type: String, required: true },
  state: { type: String, required: true },
  pincode: { type: String, required: true },
  country: { type: String, default: "India" },
  coordinates: { latitude: Number, longitude: Number },
  deliveryInstructions: String
}, { _id: false });

// Status History Schema (embedded)
const statusHistorySchema = new mongoose.Schema({
  status: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  note: String
}, { _id: true });

// ✅ NEW: Expected Timeline Schema
const expectedTimelineSchema = new mongoose.Schema({
  confirmed: {
    expectedDate: Date,
    actualDate: Date,
    isCompleted: { type: Boolean, default: false },
    note: String
  },
  packed: {
    expectedDate: Date,
    actualDate: Date,
    isCompleted: { type: Boolean, default: false },
    note: String
  },
  shipped: {
    expectedDate: Date,
    actualDate: Date,
    isCompleted: { type: Boolean, default: false },
    note: String
  },
  out_for_delivery: {
    expectedDate: Date,
    actualDate: Date,
    isCompleted: { type: Boolean, default: false },
    note: String
  },
  delivered: {
    expectedDate: Date,
    actualDate: Date,
    isCompleted: { type: Boolean, default: false },
    note: String
  }
}, { _id: false });

// Main Order Schema
const orderSchema = new mongoose.Schema({
  orderNumber: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true
  },
  customerSnapshot: {
    name: { type: String, required: true },
    phone: { type: String, required: true },
    email: String,
    businessName: String
  },
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
  deliveryAddress: {
    type: deliveryAddressSchema,
    required: true
  },

  // Order amounts
  subtotal: { type: Number, required: true },
  discount: { type: Number, default: 0 },
  tax: { type: Number, default: 0 },
  deliveryCharges: { type: Number, default: 0 },
  totalAmount: { type: Number, required: true },

  // Order status
  status: {
    type: String,
    enum: ["pending", "confirmed", "packed", "shipped", "out_for_delivery", "delivered", "cancelled"],
    default: "pending",
    index: true
  },

  // Status history
  statusHistory: [statusHistorySchema],

  // ✅ NEW: Expected Timeline with dates for each step
  expectedTimeline: {
    type: expectedTimelineSchema,
    default: {}
  },

  // ✅ NEW: Overall expected delivery date
  expectedDeliveryDate: Date,

  // ✅ NEW: Actual delivery date
  actualDeliveryDate: Date,

  // ✅ NEW: Is order delayed?
  isDelayed: { type: Boolean, default: false },

  // ✅ NEW: Delay reason (if delayed)
  delayReason: String,

  // Payment status
  paymentStatus: {
    type: String,
    enum: ["pending", "paid", "partial", "refunded"],
    default: "pending",
    index: true
  },

  payment: {
    amountPaid: { type: Number, default: 0 },
    method: {
      type: String,
      enum: ["cash", "bank_transfer", "cheque", "upi", "credit", "other"],
      default: "credit"
    },
    notes: String,
    paidAt: Date,
    markedPaidBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
  },

  customerNotes: { type: String, maxlength: 500 },
  internalNotes: { type: String, maxlength: 1000 },

  // Delivery OTP
  deliveryOtp: {
    code: String,
    generatedAt: Date,
    expiresAt: Date,
    verified: { type: Boolean, default: false },
    verifiedAt: Date
  },

  // Timestamps for key events
  confirmedAt: Date,
  packedAt: Date,
  shippedAt: Date,
  outForDeliveryAt: Date,
  deliveredAt: Date,
  cancelledAt: Date,

  // Cancellation details
  cancellation: {
    reason: String,
    cancelledBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    isCustomerCancelled: Boolean
  }

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
orderSchema.index({ expectedDeliveryDate: 1 });

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
  return (this.totalAmount || 0) - (this.payment?.amountPaid || 0);
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

// ✅ NEW: Virtual for tracking timeline (for mobile app)
orderSchema.virtual('trackingTimeline').get(function() {
  const steps = [
    {
      key: "pending",
      title: "Order Placed",
      description: "Your order has been placed",
      icon: "checkmark-circle"
    },
    {
      key: "confirmed",
      title: "Order Confirmed",
      description: "Seller has processed your order",
      icon: "checkmark-done"
    },
    {
      key: "packed",
      title: "Packed",
      description: "Your item has been packed",
      icon: "cube"
    },
    {
      key: "shipped",
      title: "Shipped",
      description: "Your item has been shipped",
      icon: "airplane"
    },
    {
      key: "out_for_delivery",
      title: "Out for Delivery",
      description: "Your item is out for delivery",
      icon: "car"
    },
    {
      key: "delivered",
      title: "Delivered",
      description: "Your item has been delivered",
      icon: "checkmark-circle"
    }
  ];

  const statusOrder = ["pending", "confirmed", "packed", "shipped", "out_for_delivery", "delivered"];
  const currentStatusIndex = statusOrder.indexOf(this.status);

  // Handle cancelled orders
  if (this.status === "cancelled") {
    return [{
      key: "cancelled",
      title: "Order Cancelled",
      description: this.cancellation?.reason || "Your order has been cancelled",
      icon: "close-circle",
      status: "cancelled",
      isCompleted: true,
      isCurrent: true,
      completedAt: this.cancelledAt || this.updatedAt,
      isDelayed: false
    }];
  }

  return steps.map((step, index) => {
    const stepKey = step.key;
    const expectedInfo = this.expectedTimeline?.[stepKey] || {};
    const isCompleted = index <= currentStatusIndex;
    const isCurrent = index === currentStatusIndex;
    const isPending = index > currentStatusIndex;

    // Get completed date from status history
    let completedAt = null;
    if (isCompleted) {
      const historyEntry = this.statusHistory?.find(h => h.status === stepKey);
      completedAt = historyEntry?.timestamp;

      // Special case for "pending" - use order creation date
      if (stepKey === "pending") {
        completedAt = this.createdAt;
      }
    }

    // Check if this step is delayed
    const now = new Date();
    let isDelayed = false;
    if (!isCompleted && expectedInfo.expectedDate) {
      isDelayed = now > new Date(expectedInfo.expectedDate);
    }

    return {
      key: stepKey,
      title: step.title,
      description: isDelayed 
        ? `Delayed - ${step.description.toLowerCase()}` 
        : step.description,
      icon: step.icon,
      status: isCompleted ? "completed" : isPending ? "pending" : "current",
      isCompleted,
      isCurrent,
      isPending,
      completedAt,
      expectedDate: expectedInfo.expectedDate,
      actualDate: expectedInfo.actualDate || completedAt,
      note: expectedInfo.note,
      isDelayed
    };
  });
});

// Pre-save middleware
orderSchema.pre("save", function() {
  if (this.isModified("status")) {
    const lastHistoryStatus = this.statusHistory?.length > 0 
      ? this.statusHistory[this.statusHistory.length - 1].status 
      : null;
    
    if (lastHistoryStatus !== this.status) {
      this.statusHistory.push({
        status: this.status,
        timestamp: new Date()
      });
    }

    // Update timestamp fields and expectedTimeline
    const now = new Date();
    switch (this.status) {
      case "confirmed":
        this.confirmedAt = now;
        if (this.expectedTimeline) {
          this.expectedTimeline.confirmed = {
            ...this.expectedTimeline.confirmed,
            actualDate: now,
            isCompleted: true
          };
        }
        break;
      case "packed":
        this.packedAt = now;
        if (this.expectedTimeline) {
          this.expectedTimeline.packed = {
            ...this.expectedTimeline.packed,
            actualDate: now,
            isCompleted: true
          };
        }
        break;
      case "shipped":
        this.shippedAt = now;
        if (this.expectedTimeline) {
          this.expectedTimeline.shipped = {
            ...this.expectedTimeline.shipped,
            actualDate: now,
            isCompleted: true
          };
        }
        break;
      case "out_for_delivery":
        this.outForDeliveryAt = now;
        if (this.expectedTimeline) {
          this.expectedTimeline.out_for_delivery = {
            ...this.expectedTimeline.out_for_delivery,
            actualDate: now,
            isCompleted: true
          };
        }
        break;
      case "delivered":
        this.deliveredAt = now;
        this.actualDeliveryDate = now;
        if (this.expectedTimeline) {
          this.expectedTimeline.delivered = {
            ...this.expectedTimeline.delivered,
            actualDate: now,
            isCompleted: true
          };
        }
        break;
      case "cancelled":
        this.cancelledAt = now;
        break;
    }

    // Check if order is delayed
    if (this.expectedDeliveryDate && now > this.expectedDeliveryDate && this.status !== "delivered") {
      this.isDelayed = true;
    }
  }
});

// Static method to get status display text
orderSchema.statics.getStatusText = function(status) {
  const statusTexts = {
    pending: "Order Placed",
    confirmed: "Order Confirmed",
    packed: "Packed & Ready",
    shipped: "Shipped",
    out_for_delivery: "Out for Delivery",
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
    shipped: ["out_for_delivery", "delivered"],
    out_for_delivery: ["delivered"],
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

// ✅ NEW: Method to set expected timeline dates
orderSchema.methods.setExpectedDates = function(expectedDeliveryDate, processingDays = 1, shippingDays = 2) {
  const orderDate = this.createdAt || new Date();
  
  // Calculate expected dates for each step
  const confirmDate = new Date(orderDate);
  confirmDate.setHours(confirmDate.getHours() + 12); // 12 hours to confirm

  const packDate = new Date(orderDate);
  packDate.setDate(packDate.getDate() + processingDays);

  const shipDate = new Date(packDate);
  shipDate.setDate(shipDate.getDate() + 1);

  const outForDeliveryDate = new Date(expectedDeliveryDate);
  outForDeliveryDate.setHours(8, 0, 0, 0); // 8 AM on delivery day

  this.expectedDeliveryDate = expectedDeliveryDate;
  this.expectedTimeline = {
    confirmed: {
      expectedDate: confirmDate,
      isCompleted: ["confirmed", "packed", "shipped", "out_for_delivery", "delivered"].includes(this.status),
      actualDate: this.confirmedAt
    },
    packed: {
      expectedDate: packDate,
      isCompleted: ["packed", "shipped", "out_for_delivery", "delivered"].includes(this.status),
      actualDate: this.packedAt
    },
    shipped: {
      expectedDate: shipDate,
      isCompleted: ["shipped", "out_for_delivery", "delivered"].includes(this.status),
      actualDate: this.shippedAt
    },
    out_for_delivery: {
      expectedDate: outForDeliveryDate,
      isCompleted: ["out_for_delivery", "delivered"].includes(this.status),
      actualDate: this.outForDeliveryAt
    },
    delivered: {
      expectedDate: expectedDeliveryDate,
      isCompleted: this.status === "delivered",
      actualDate: this.deliveredAt
    }
  };
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
    expectedDeliveryDate: this.expectedDeliveryDate,
    isDelayed: this.isDelayed,
    createdAt: this.createdAt
  };
};

module.exports = mongoose.model("Order", orderSchema);