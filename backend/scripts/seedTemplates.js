require("dotenv").config();
const mongoose = require("mongoose");
const NotificationTemplate = require("../models/NotificationTemplate");

const templates = [
  {
    name: "Order Confirmed",
    type: "order_update",
    titleTemplate: "Order Confirmed! 🎉",
    messageTemplate: "Hi {{customerName}}, your order {{orderNumber}} has been confirmed. We're preparing it now. Expected delivery: {{expectedDate}}.",
    shortMessageTemplate: "Order {{orderNumber}} confirmed! Preparing for delivery.",
    variables: [
      { name: "customerName", description: "Customer name", example: "John" },
      { name: "orderNumber", description: "Order number", example: "TIJ-20241215-00001" },
      { name: "expectedDate", description: "Expected delivery date", example: "Dec 20, 2024" }
    ],
    defaultChannels: { sms: true, push: true, inApp: true }
  },
  {
    name: "Order Shipped",
    type: "order_update",
    titleTemplate: "Order Shipped! 🚚",
    messageTemplate: "Great news! Your order {{orderNumber}} has been shipped. Track your delivery and expect it soon.",
    shortMessageTemplate: "Order {{orderNumber}} shipped! Delivery on the way.",
    variables: [
      { name: "orderNumber", description: "Order number", example: "TIJ-20241215-00001" }
    ],
    defaultChannels: { sms: true, push: true, inApp: true }
  },
  {
    name: "Order Delivered",
    type: "order_update",
    titleTemplate: "Order Delivered! ✅",
    messageTemplate: "Your order {{orderNumber}} has been delivered. Thank you for shopping with Tijara!",
    shortMessageTemplate: "Order {{orderNumber}} delivered. Thanks for choosing Tijara!",
    variables: [
      { name: "orderNumber", description: "Order number", example: "TIJ-20241215-00001" }
    ],
    defaultChannels: { sms: true, push: true, inApp: true }
  },
  {
    name: "Payment Reminder",
    type: "payment_reminder",
    titleTemplate: "Payment Reminder 💰",
    messageTemplate: "Hi {{customerName}}, you have an outstanding payment of ₹{{amount}}. Please clear it at your earliest convenience to continue placing orders.",
    shortMessageTemplate: "Payment due: ₹{{amount}}. Please clear to continue ordering.",
    variables: [
      { name: "customerName", description: "Customer name", example: "John" },
      { name: "amount", description: "Outstanding amount", example: "5,000" }
    ],
    defaultChannels: { sms: true, push: true, inApp: true }
  },
  {
    name: "Payment Overdue",
    type: "payment_reminder",
    titleTemplate: "Payment Overdue ⚠️",
    messageTemplate: "Hi {{customerName}}, your payment of ₹{{amount}} is overdue by {{days}} days. Please clear it immediately to avoid credit restrictions.",
    shortMessageTemplate: "URGENT: ₹{{amount}} overdue by {{days}} days. Please pay now.",
    variables: [
      { name: "customerName", description: "Customer name", example: "John" },
      { name: "amount", description: "Outstanding amount", example: "5,000" },
      { name: "days", description: "Days overdue", example: "15" }
    ],
    defaultChannels: { sms: true, whatsapp: true, push: true, inApp: true }
  },
  {
    name: "Payment Received",
    type: "payment_received",
    titleTemplate: "Payment Received! 🙏",
    messageTemplate: "Thank you! We received your payment of ₹{{amount}} for order {{orderNumber}}. Your updated balance is ₹{{balance}}.",
    shortMessageTemplate: "Payment of ₹{{amount}} received. Thank you!",
    variables: [
      { name: "amount", description: "Payment amount", example: "5,000" },
      { name: "orderNumber", description: "Order number", example: "TIJ-20241215-00001" },
      { name: "balance", description: "Remaining balance", example: "0" }
    ],
    defaultChannels: { sms: true, push: true, inApp: true }
  },
  {
    name: "New Product Announcement",
    type: "new_product",
    titleTemplate: "New Product Alert! 🆕",
    messageTemplate: "Introducing {{productName}}! {{description}} Now available at ₹{{price}}. Order now!",
    shortMessageTemplate: "NEW: {{productName}} now available at ₹{{price}}!",
    variables: [
      { name: "productName", description: "Product name", example: "Industrial Adhesive Pro" },
      { name: "description", description: "Short description", example: "High-strength bonding" },
      { name: "price", description: "Product price", example: "500" }
    ],
    defaultChannels: { push: true, inApp: true }
  },
  {
    name: "General Announcement",
    type: "announcement",
    titleTemplate: "{{title}}",
    messageTemplate: "{{message}}",
    shortMessageTemplate: "{{shortMessage}}",
    variables: [
      { name: "title", description: "Announcement title", example: "Holiday Hours" },
      { name: "message", description: "Full message", example: "We will be closed on..." },
      { name: "shortMessage", description: "Short message for SMS", example: "Closed Dec 25-26" }
    ],
    defaultChannels: { push: true, inApp: true }
  }
];

const seedTemplates = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB connected");

    // Check existing templates
    const existingCount = await NotificationTemplate.countDocuments();
    
    if (existingCount > 0) {
      console.log(`Found ${existingCount} existing templates. Skipping seed.`);
      console.log("To reseed, delete existing templates first.");
      process.exit(0);
    }

    // Insert templates
    await NotificationTemplate.insertMany(templates);

    console.log("✅ Default notification templates created!");
    console.log(`   Created ${templates.length} templates`);

    process.exit(0);

  } catch (error) {
    console.error("Seed Error:", error);
    process.exit(1);
  }
};

seedTemplates();