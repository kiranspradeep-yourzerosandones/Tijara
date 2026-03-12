const mongoose = require("mongoose");

// Recipient Schema (for tracking delivery to each user)
const recipientSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },

  // Delivery status per channel
  channels: {
    sms: {
      sent: { type: Boolean, default: false },
      sentAt: Date,
      delivered: { type: Boolean, default: false },
      deliveredAt: Date,
      failed: { type: Boolean, default: false },
      failedReason: String
    },
    email: {
      sent: { type: Boolean, default: false },
      sentAt: Date,
      delivered: { type: Boolean, default: false },
      deliveredAt: Date,
      failed: { type: Boolean, default: false },
      failedReason: String
    },
    whatsapp: {
      sent: { type: Boolean, default: false },
      sentAt: Date,
      delivered: { type: Boolean, default: false },
      deliveredAt: Date,
      read: { type: Boolean, default: false },
      readAt: Date,
      failed: { type: Boolean, default: false },
      failedReason: String
    },
    push: {
      sent: { type: Boolean, default: false },
      sentAt: Date,
      delivered: { type: Boolean, default: false },
      deliveredAt: Date,
      clicked: { type: Boolean, default: false },
      clickedAt: Date,
      failed: { type: Boolean, default: false },
      failedReason: String
    }
  },

  // In-app notification status
  isRead: {
    type: Boolean,
    default: false
  },
  readAt: Date

}, { _id: true });

// Main Notification Schema
const notificationSchema = new mongoose.Schema({
  // Notification title
  title: {
    type: String,
    required: [true, "Title is required"],
    trim: true,
    maxlength: 200
  },

  // Notification message/body
  message: {
    type: String,
    required: [true, "Message is required"],
    trim: true,
    maxlength: 2000
  },

  // Short message (for SMS - max 160 chars)
  shortMessage: {
    type: String,
    trim: true,
    maxlength: 160
  },

  // Notification type
  type: {
    type: String,
    enum: [
      "order_update",      // Order status changes
      "payment_reminder",  // Payment due/overdue
      "payment_received",  // Payment confirmation
      "promotional",       // Marketing/offers
      "announcement",      // General announcements
      "new_product",       // New product launch
      "system",           // System notifications
      "custom"            // Admin custom message
    ],
    default: "custom"
  },

  // Priority level
  priority: {
    type: String,
    enum: ["low", "normal", "high", "urgent"],
    default: "normal"
  },

  // Channels to send through
  channels: {
    sms: { type: Boolean, default: false },
    email: { type: Boolean, default: false },
    whatsapp: { type: Boolean, default: false },
    push: { type: Boolean, default: true },
    inApp: { type: Boolean, default: true }
  },

  // Target audience
  targetType: {
    type: String,
    enum: ["all", "selected", "segment"],
    default: "selected"
  },

  // Segment filters (if targetType is 'segment')
  segmentFilters: {
    // Filter by city
    cities: [String],
    // Filter by business type
    businessTypes: [String],
    // Filter by credit status
    hasPendingPayment: Boolean,
    // Filter by order history
    hasOrdered: Boolean,
    // Filter by last order date
    lastOrderDays: Number,
    // Filter by registration date
    registeredAfter: Date,
    registeredBefore: Date
  },

  // Recipients list
  recipients: [recipientSchema],

  // Reference to related entities
  relatedOrder: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Order"
  },
  relatedPayment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Payment"
  },
  relatedProduct: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product"
  },

  // Action URL (for push notifications)
  actionUrl: String,

  // Image URL (for rich notifications)
  imageUrl: String,

  // Notification status
  status: {
    type: String,
    enum: ["draft", "scheduled", "sending", "sent", "partial", "failed", "cancelled"],
    default: "draft"
  },

  // Schedule for future sending
  scheduledAt: Date,

  // Actual send time
  sentAt: Date,

  // Completion time
  completedAt: Date,

  // Statistics
  stats: {
    totalRecipients: { type: Number, default: 0 },
    smsSent: { type: Number, default: 0 },
    smsDelivered: { type: Number, default: 0 },
    smsFailed: { type: Number, default: 0 },
    emailSent: { type: Number, default: 0 },
    emailDelivered: { type: Number, default: 0 },
    emailFailed: { type: Number, default: 0 },
    whatsappSent: { type: Number, default: 0 },
    whatsappDelivered: { type: Number, default: 0 },
    whatsappRead: { type: Number, default: 0 },
    whatsappFailed: { type: Number, default: 0 },
    pushSent: { type: Number, default: 0 },
    pushDelivered: { type: Number, default: 0 },
    pushClicked: { type: Number, default: 0 },
    pushFailed: { type: Number, default: 0 },
    inAppRead: { type: Number, default: 0 }
  },

  // Created by admin
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },

  // Template used (if any)
  template: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "NotificationTemplate"
  },

  // Internal notes
  notes: String

}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
notificationSchema.index({ status: 1, scheduledAt: 1 });
notificationSchema.index({ createdBy: 1, createdAt: -1 });
notificationSchema.index({ type: 1, createdAt: -1 });
notificationSchema.index({ "recipients.user": 1 });
notificationSchema.index({ "recipients.isRead": 1 });

// Virtual for delivery rate
notificationSchema.virtual('deliveryRate').get(function() {
  if (this.stats.totalRecipients === 0) return 0;
  const totalDelivered = this.stats.smsDelivered + this.stats.emailDelivered + 
                         this.stats.whatsappDelivered + this.stats.pushDelivered;
  const totalSent = this.stats.smsSent + this.stats.emailSent + 
                    this.stats.whatsappSent + this.stats.pushSent;
  if (totalSent === 0) return 0;
  return Math.round((totalDelivered / totalSent) * 100);
});

// Method to update stats
notificationSchema.methods.updateStats = function() {
  const stats = {
    totalRecipients: this.recipients.length,
    smsSent: 0, smsDelivered: 0, smsFailed: 0,
    emailSent: 0, emailDelivered: 0, emailFailed: 0,
    whatsappSent: 0, whatsappDelivered: 0, whatsappRead: 0, whatsappFailed: 0,
    pushSent: 0, pushDelivered: 0, pushClicked: 0, pushFailed: 0,
    inAppRead: 0
  };

  for (const recipient of this.recipients) {
    // SMS
    if (recipient.channels.sms.sent) stats.smsSent++;
    if (recipient.channels.sms.delivered) stats.smsDelivered++;
    if (recipient.channels.sms.failed) stats.smsFailed++;
    
    // Email
    if (recipient.channels.email.sent) stats.emailSent++;
    if (recipient.channels.email.delivered) stats.emailDelivered++;
    if (recipient.channels.email.failed) stats.emailFailed++;
    
    // WhatsApp
    if (recipient.channels.whatsapp.sent) stats.whatsappSent++;
    if (recipient.channels.whatsapp.delivered) stats.whatsappDelivered++;
    if (recipient.channels.whatsapp.read) stats.whatsappRead++;
    if (recipient.channels.whatsapp.failed) stats.whatsappFailed++;
    
    // Push
    if (recipient.channels.push.sent) stats.pushSent++;
    if (recipient.channels.push.delivered) stats.pushDelivered++;
    if (recipient.channels.push.clicked) stats.pushClicked++;
    if (recipient.channels.push.failed) stats.pushFailed++;
    
    // In-app
    if (recipient.isRead) stats.inAppRead++;
  }

  this.stats = stats;
};

module.exports = mongoose.model("Notification", notificationSchema);