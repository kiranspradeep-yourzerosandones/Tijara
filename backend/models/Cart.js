const mongoose = require("mongoose");

// Cart Item Schema (embedded)
const cartItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true
  },

  // Quantity ordered
  quantity: {
    type: Number,
    required: true,
    min: [1, "Quantity must be at least 1"]
  },

  // Price at the time of adding to cart (snapshot)
  priceAtAdd: {
    type: Number,
    required: true
  },

  // Product title snapshot (in case product is deleted later)
  productTitle: {
    type: String,
    required: true
  },

  // Product image snapshot
  productImage: {
    type: String
  },

  // Unit of product
  unit: {
    type: String,
    default: "piece"
  },

  // When item was added
  addedAt: {
    type: Date,
    default: Date.now
  }
}, { _id: true });

// Virtual for item subtotal
cartItemSchema.virtual('subtotal').get(function() {
  return this.quantity * this.priceAtAdd;
});

// Main Cart Schema
const cartSchema = new mongoose.Schema({
  // Reference to user
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    unique: true, // One cart per user
    index: true
  },

  // Cart items
  items: [cartItemSchema],

  // Cart metadata
  lastUpdated: {
    type: Date,
    default: Date.now
  }

}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for total items count
cartSchema.virtual('totalItems').get(function() {
  return this.items.reduce((sum, item) => sum + item.quantity, 0);
});

// Virtual for unique products count
cartSchema.virtual('uniqueProducts').get(function() {
  return this.items.length;
});

// Virtual for cart subtotal
cartSchema.virtual('subtotal').get(function() {
  return this.items.reduce((sum, item) => sum + (item.quantity * item.priceAtAdd), 0);
});

// Virtual for cart total (same as subtotal for now, can add taxes/discounts later)
cartSchema.virtual('total').get(function() {
  return this.subtotal;
});

// Method to find item by product ID
cartSchema.methods.findItem = function(productId) {
  return this.items.find(item => 
    item.product.toString() === productId.toString()
  );
};

// Method to find item index by product ID
cartSchema.methods.findItemIndex = function(productId) {
  return this.items.findIndex(item => 
    item.product.toString() === productId.toString()
  );
};

// Method to add or update item
cartSchema.methods.addItem = function(product, quantity) {
  const existingIndex = this.findItemIndex(product._id);

  if (existingIndex > -1) {
    // Update existing item quantity
    this.items[existingIndex].quantity += quantity;
    this.items[existingIndex].priceAtAdd = product.price; // Update price
  } else {
    // Add new item
    this.items.push({
      product: product._id,
      quantity: quantity,
      priceAtAdd: product.price,
      productTitle: product.title,
      productImage: product.images && product.images.length > 0 ? product.images[0] : null,
      unit: product.unit || "piece"
    });
  }

  this.lastUpdated = new Date();
};

// Method to update item quantity
cartSchema.methods.updateItemQuantity = function(productId, quantity) {
  const existingIndex = this.findItemIndex(productId);

  if (existingIndex > -1) {
    if (quantity <= 0) {
      // Remove item if quantity is 0 or less
      this.items.splice(existingIndex, 1);
    } else {
      this.items[existingIndex].quantity = quantity;
    }
    this.lastUpdated = new Date();
    return true;
  }
  
  return false;
};

// Method to remove item
cartSchema.methods.removeItem = function(productId) {
  const existingIndex = this.findItemIndex(productId);

  if (existingIndex > -1) {
    this.items.splice(existingIndex, 1);
    this.lastUpdated = new Date();
    return true;
  }
  
  return false;
};

// Method to clear cart
cartSchema.methods.clearCart = function() {
  this.items = [];
  this.lastUpdated = new Date();
};

// Method to get cart summary
cartSchema.methods.getSummary = function() {
  return {
    totalItems: this.totalItems,
    uniqueProducts: this.uniqueProducts,
    subtotal: this.subtotal,
    total: this.total
  };
};

// Static method to get or create cart for user
cartSchema.statics.getOrCreateCart = async function(userId) {
  let cart = await this.findOne({ user: userId });
  
  if (!cart) {
    cart = await this.create({ user: userId, items: [] });
  }
  
  return cart;
};

module.exports = mongoose.model("Cart", cartSchema);