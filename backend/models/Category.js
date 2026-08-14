// backend/models/Category.js
const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  slug: {
    type: String
  },
  image: {
    type: String,
    default: null
  },
  description: String,
  isActive: {
    type: Boolean,
    default: true
  },
  // ✅ manual drag-order position
  sortOrder: {
    type: Number,
    default: 0
  }
}, { timestamps: true });

categorySchema.pre('save', async function() {
  if (this.isModified('name') || !this.slug) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }
});

module.exports = mongoose.model("Category", categorySchema);