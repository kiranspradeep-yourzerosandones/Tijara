// D:\yzo_ongoing\Tijara\backend\models\NotificationTemplate.js
const mongoose = require("mongoose");

const notificationTemplateSchema = new mongoose.Schema({
  // Template name
  name: {
    type: String,
    required: [true, "Template name is required"],
    trim: true,
    unique: true, // ✅ This already creates an index
    maxlength: 100
  },

  // Template slug (for easy reference)
  slug: {
    type: String,
    required: true,
    unique: true, // ✅ This already creates an index - NO need for schema.index()
    lowercase: true
  },

  // Template description
  description: {
    type: String,
    trim: true,
    maxlength: 500
  },

  // Notification type this template is for
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
    required: true
  },

  // Title template (supports variables like {{orderNumber}})
  titleTemplate: {
    type: String,
    required: true,
    maxlength: 200
  },

  // Message template (supports variables)
  messageTemplate: {
    type: String,
    required: true,
    maxlength: 2000
  },

  // Short message template (for SMS)
  shortMessageTemplate: {
    type: String,
    maxlength: 160
  },

  // Email subject template
  emailSubjectTemplate: {
    type: String,
    maxlength: 200
  },

  // Email body template (HTML)
  emailBodyTemplate: {
    type: String,
    maxlength: 10000
  },

  // WhatsApp template name (for approved templates)
  whatsappTemplateName: String,

  // Available variables for this template
  variables: [{
    name: String,
    description: String,
    example: String
  }],

  // Default channels
  defaultChannels: {
    sms: { type: Boolean, default: false },
    email: { type: Boolean, default: false },
    whatsapp: { type: Boolean, default: false },
    push: { type: Boolean, default: true },
    inApp: { type: Boolean, default: true }
  },

  // Is active
  isActive: {
    type: Boolean,
    default: true
  },

  // Created by
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  }

}, {
  timestamps: true
});

// ============================================================
// INDEXES - ✅ FIXED: Removed slug (already has unique: true)
// ============================================================
// notificationTemplateSchema.index({ slug: 1 }); // ❌ REMOVED - duplicate!
notificationTemplateSchema.index({ type: 1, isActive: 1 });

// Pre-save to generate slug
notificationTemplateSchema.pre("save", function(next) {
  if (this.isModified("name") || !this.slug) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/(^_|_$)/g, '');
  }
  next();
});

// Static method to render template with variables
notificationTemplateSchema.statics.render = function(template, variables = {}) {
  let rendered = template;
  
  for (const [key, value] of Object.entries(variables)) {
    const regex = new RegExp(`{{${key}}}`, 'g');
    rendered = rendered.replace(regex, value || '');
  }
  
  // Remove any unreplaced variables
  rendered = rendered.replace(/{{[^}]+}}/g, '');
  
  return rendered.trim();
};

module.exports = mongoose.model("NotificationTemplate", notificationTemplateSchema);