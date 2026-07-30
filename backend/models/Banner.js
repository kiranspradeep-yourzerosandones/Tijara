// backend/models/Banner.js
const mongoose = require("mongoose");

const bannerSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      maxlength: [100, "Title cannot exceed 100 characters"],
    },

    subtitle: {
      type: String,
      trim: true,
      maxlength: [200, "Subtitle cannot exceed 200 characters"],
      default: "",
    },

    // ── Visuals ──────────────────────────────────────────────
    backgroundColor: {
      type: String,
      default: "#2D5A27",
      match: [/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/, "Invalid hex color"],
    },

    image: {
      type: String,
      default: null, // e.g. "/uploads/banner-xyz.jpg"
    },

    // ── Action ───────────────────────────────────────────────
    actionType: {
      type: String,
      enum: ["none", "product", "category", "screen", "url"],
      default: "none",
    },

    // Used when actionType === "product"
    actionProductId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      default: null,
    },

    // Used when actionType === "category"
    actionCategory: {
      type: String,
      default: null,
    },

    // Used when actionType === "screen"
    // Valid values: "ProductList" | "Cart" | "Notifications" | "Categories"
    actionScreen: {
      type: String,
      enum: ["ProductList", "Cart", "Notifications", "Categories", null],
      default: null,
    },

    // Used when actionType === "url"
    actionUrl: {
      type: String,
      default: null,
    },

    // ── Meta ─────────────────────────────────────────────────
    isActive: {
      type: Boolean,
      default: true,
    },

    // Lower number = shown first
    order: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

// Indexes
bannerSchema.index({ isActive: 1, order: 1 });

module.exports = mongoose.model("Banner", bannerSchema);