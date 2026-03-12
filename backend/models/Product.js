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

module.exports = mongoose.model("Product", productSchema);