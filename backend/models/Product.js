// backend/models/Product.js
const mongoose = require("mongoose");

function generateSlug(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

const productSchema = new mongoose.Schema({

  title: {
    type: String,
    required: true
  },

  slug: {
    type: String,
    unique: true // ✅ This already creates an index
  },

  brand: String,
  
  category: {
    type: String,
    required: true
  },

  shortDescription: {
    type: String,
    maxlength: 200
  },

  description: String,

  images: [String],
  applications: [String],

  // ========== PRICING ==========
  price: {
    type: Number,
    required: [true, "Price is required"],
    min: [0, "Price cannot be negative"]
  },

  compareAtPrice: {
    type: Number,
    min: 0
  },

  unit: {
    type: String,
    default: "piece",
    enum: ["piece", "kg", "liter", "box", "pack", "dozen", "meter", "unit"]
  },

  minOrderQuantity: {
    type: Number,
    default: 1,
    min: 1
  },

  maxOrderQuantity: {
    type: Number,
    default: 100
  },

  // ========== INVENTORY ==========
  inStock: {
    type: Boolean,
    default: true
  },

  trackQuantity: {
    type: Boolean,
    default: false
  },

  stockQuantity: {
    type: Number,
    default: null,
    min: 0
  },

  lowStockThreshold: {
    type: Number,
    default: 10
  },

  // ========== EXISTING FIELDS ==========
  specifications: {
    type: Map,
    of: String
  },

  packaging: {
    weight: String,
    type: String
  },

  chemicalInfo: {
    formula: String,
    grade: String
  },

  storage: String,
  advantages: [String],

  isActive: {
    type: Boolean,
    default: true
  }

}, { timestamps: true });

// ============================================================
// INDEXES - ✅ FIXED: Removed slug (already indexed by unique: true)
// ============================================================
productSchema.index({ category: 1 });
productSchema.index({ isActive: 1 });
productSchema.index({ price: 1 });
productSchema.index({ inStock: 1, stockQuantity: 1 });

// Generate slug before saving
productSchema.pre('save', async function() {
  if (this.isModified('title') || !this.slug) {
    let baseSlug = generateSlug(this.title);
    let slug = baseSlug;
    let counter = 1;
    
    while (await mongoose.models.Product.findOne({ slug, _id: { $ne: this._id } })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }
    
    this.slug = slug;
  }

  // Auto-update inStock based on stockQuantity if tracking
  if (this.trackQuantity && this.stockQuantity !== null) {
    this.inStock = this.stockQuantity > 0;
  }
});

// Virtual for discount percentage
productSchema.virtual('discountPercentage').get(function() {
  if (this.compareAtPrice && this.compareAtPrice > this.price) {
    return Math.round(((this.compareAtPrice - this.price) / this.compareAtPrice) * 100);
  }
  return 0;
});

// Virtual for stock status text
productSchema.virtual('stockStatus').get(function() {
  if (!this.inStock) return "out_of_stock";
  if (!this.trackQuantity) return "in_stock";
  if (this.stockQuantity <= 0) return "out_of_stock";
  if (this.stockQuantity <= this.lowStockThreshold) return "low_stock";
  return "in_stock";
});

// Virtual for available quantity (for cart/order validation)
productSchema.virtual('availableQuantity').get(function() {
  if (!this.inStock) return 0;
  if (!this.trackQuantity) return this.maxOrderQuantity || 9999;
  return this.stockQuantity || 0;
});

// Method to check if quantity is available
productSchema.methods.hasStock = function(quantity = 1) {
  if (!this.inStock) return false;
  if (!this.trackQuantity) return true;
  return this.stockQuantity >= quantity;
};

// Method to reserve/decrement stock
productSchema.methods.decrementStock = async function(quantity) {
  if (!this.trackQuantity) return true;
  
  if (this.stockQuantity < quantity) {
    throw new Error(`Insufficient stock. Available: ${this.stockQuantity}`);
  }

  this.stockQuantity -= quantity;
  
  if (this.stockQuantity <= 0) {
    this.inStock = false;
  }

  await this.save();
  return true;
};

// Method to restore stock (for cancelled orders)
productSchema.methods.incrementStock = async function(quantity) {
  if (!this.trackQuantity) return true;
  
  this.stockQuantity += quantity;
  this.inStock = true;
  
  await this.save();
  return true;
};

// Ensure virtuals are included
productSchema.set("toJSON", { virtuals: true });
productSchema.set("toObject", { virtuals: true });

module.exports = mongoose.model("Product", productSchema);