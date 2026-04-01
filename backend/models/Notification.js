// D:\yzo_ongoing\Tijara\backend\models\Notification.js
const mongoose = require("mongoose");

const recipientSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },

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

  isRead: {
    type: Boolean,
    default: false
  },
  readAt: Date

}, { _id: true });

const notificationSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, "Title is required"],
    trim: true,
    maxlength: 200
  },

  message: {
    type: String,
    required: [true, "Message is required"],
    trim: true,
    maxlength: 2000
  },

  shortMessage: {
    type: String,
    trim: true,
    maxlength: 160
  },

  type: {
    type: String,
    enum: [
      "order_update",
      "payment_reminder",
      "payment_received",
      "promotional",
      "announcement",
      "new_product",
      "system",
      "custom"
    ],
    default: "custom"
  },

  priority: {
    type: String,
    enum: ["low", "normal", "high", "urgent"],
    default: "normal"
  },

  channels: {
    sms: { type: Boolean, default: false },
    email: { type: Boolean, default: false },
    whatsapp: { type: Boolean, default: false },
    push: { type: Boolean, default: true },
    inApp: { type: Boolean, default: true }
  },

  targetType: {
    type: String,
    enum: ["all", "selected", "segment"],
    default: "selected"
  },

  segmentFilters: {
    cities: [String],
    businessTypes: [String],
    hasPendingPayment: Boolean,
    hasOrdered: Boolean,
    lastOrderDays: Number,
    registeredAfter: Date,
    registeredBefore: Date
  },

  recipients: [recipientSchema],

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

  actionUrl: String,
  imageUrl: String,

  status: {
    type: String,
    enum: ["draft", "scheduled", "sending", "sent", "partial", "failed", "cancelled"],
    default: "draft"
  },

  scheduledAt: Date,
  sentAt: Date,
  completedAt: Date,

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

  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Admin",
    required: true
  },

  template: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "NotificationTemplate"
  },

  notes: String

}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// ✅ FIXED: Removed duplicate index definitions
notificationSchema.index({ status: 1, scheduledAt: 1 });
notificationSchema.index({ createdBy: 1, createdAt: -1 });
notificationSchema.index({ type: 1, createdAt: -1 });
notificationSchema.index({ "recipients.user": 1 });
notificationSchema.index({ "recipients.isRead": 1 });

notificationSchema.virtual('deliveryRate').get(function() {
  if (this.stats.totalRecipients === 0) return 0;
  const totalDelivered = this.stats.smsDelivered + this.stats.emailDelivered + 
                         this.stats.whatsappDelivered + this.stats.pushDelivered;
  const totalSent = this.stats.smsSent + this.stats.emailSent + 
                    this.stats.whatsappSent + this.stats.pushSent;
  if (totalSent === 0) return 0;
  return Math.round((totalDelivered / totalSent) * 100);
});

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
    if (recipient.channels.sms.sent) stats.smsSent++;
    if (recipient.channels.sms.delivered) stats.smsDelivered++;
    if (recipient.channels.sms.failed) stats.smsFailed++;
    
    if (recipient.channels.email.sent) stats.emailSent++;
    if (recipient.channels.email.delivered) stats.emailDelivered++;
    if (recipient.channels.email.failed) stats.emailFailed++;
    
    if (recipient.channels.whatsapp.sent) stats.whatsappSent++;
    if (recipient.channels.whatsapp.delivered) stats.whatsappDelivered++;
    if (recipient.channels.whatsapp.read) stats.whatsappRead++;
    if (recipient.channels.whatsapp.failed) stats.whatsappFailed++;
    
    if (recipient.channels.push.sent) stats.pushSent++;
    if (recipient.channels.push.delivered) stats.pushDelivered++;
    if (recipient.channels.push.clicked) stats.pushClicked++;
    if (recipient.channels.push.failed) stats.pushFailed++;
    
    if (recipient.isRead) stats.inAppRead++;
  }

  this.stats = stats;
};

module.exports = mongoose.model("Notification", notificationSchema);