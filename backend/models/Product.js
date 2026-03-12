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
    unique: true
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

  // ========== PRICING (NEW) ==========
  price: {
    type: Number,
    required: [true, "Price is required"],
    min: [0, "Price cannot be negative"]
  },

  // Compare at price (for showing discounts)
  compareAtPrice: {
    type: Number,
    min: 0
  },

  // Unit of measurement
  unit: {
    type: String,
    default: "piece",
    enum: ["piece", "kg", "liter", "box", "pack", "dozen", "meter", "unit"]
  },

  // Minimum order quantity
  minOrderQuantity: {
    type: Number,
    default: 1,
    min: 1
  },

  // Maximum order quantity (per order)
  maxOrderQuantity: {
    type: Number,
    default: 100
  },

  // Stock status
  inStock: {
    type: Boolean,
    default: true
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

// Indexes
productSchema.index({ slug: 1 });
productSchema.index({ category: 1 });
productSchema.index({ isActive: 1 });
productSchema.index({ price: 1 });

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
});

// Virtual for discount percentage
productSchema.virtual('discountPercentage').get(function() {
  if (this.compareAtPrice && this.compareAtPrice > this.price) {
    return Math.round(((this.compareAtPrice - this.price) / this.compareAtPrice) * 100);
  }
  return 0;
});

// Ensure virtuals are included
productSchema.set("toJSON", { virtuals: true });
productSchema.set("toObject", { virtuals: true });

module.exports = mongoose.model("Product", productSchema);