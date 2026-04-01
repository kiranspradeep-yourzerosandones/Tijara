// D:\yzo_ongoing\Tijara\backend\models\Cart.js
const mongoose = require("mongoose");

const cartItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true
  },

  quantity: {
    type: Number,
    required: true,
    min: [1, "Quantity must be at least 1"]
  },

  priceAtAdd: {
    type: Number,
    required: true
  },

  productTitle: {
    type: String,
    required: true
  },

  productImage: {
    type: String
  },

  unit: {
    type: String,
    default: "piece"
  },

  addedAt: {
    type: Date,
    default: Date.now
  }
}, { _id: true });

cartItemSchema.virtual('subtotal').get(function() {
  return this.quantity * this.priceAtAdd;
});

const cartSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    unique: true
  },

  items: [cartItemSchema],

  lastUpdated: {
    type: Date,
    default: Date.now
  }

}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// ✅ REMOVED: index: true from user field (unique already creates index)

cartSchema.virtual('totalItems').get(function() {
  return this.items.reduce((sum, item) => sum + item.quantity, 0);
});

cartSchema.virtual('uniqueProducts').get(function() {
  return this.items.length;
});

cartSchema.virtual('subtotal').get(function() {
  return this.items.reduce((sum, item) => sum + (item.quantity * item.priceAtAdd), 0);
});

cartSchema.virtual('total').get(function() {
  return this.subtotal;
});

cartSchema.methods.findItem = function(productId) {
  return this.items.find(item => 
    item.product.toString() === productId.toString()
  );
};

cartSchema.methods.findItemIndex = function(productId) {
  return this.items.findIndex(item => 
    item.product.toString() === productId.toString()
  );
};

cartSchema.methods.addItem = function(product, quantity) {
  const existingIndex = this.findItemIndex(product._id);

  if (existingIndex > -1) {
    this.items[existingIndex].quantity += quantity;
    this.items[existingIndex].priceAtAdd = product.price;
  } else {
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

cartSchema.methods.updateItemQuantity = function(productId, quantity) {
  const existingIndex = this.findItemIndex(productId);

  if (existingIndex > -1) {
    if (quantity <= 0) {
      this.items.splice(existingIndex, 1);
    } else {
      this.items[existingIndex].quantity = quantity;
    }
    this.lastUpdated = new Date();
    return true;
  }
  
  return false;
};

cartSchema.methods.removeItem = function(productId) {
  const existingIndex = this.findItemIndex(productId);

  if (existingIndex > -1) {
    this.items.splice(existingIndex, 1);
    this.lastUpdated = new Date();
    return true;
  }
  
  return false;
};

cartSchema.methods.clearCart = function() {
  this.items = [];
  this.lastUpdated = new Date();
};

cartSchema.methods.getSummary = function() {
  return {
    totalItems: this.totalItems,
    uniqueProducts: this.uniqueProducts,
    subtotal: this.subtotal,
    total: this.total
  };
};

cartSchema.statics.getOrCreateCart = async function(userId) {
  let cart = await this.findOne({ user: userId });
  
  if (!cart) {
    cart = await this.create({ user: userId, items: [] });
  }
  
  return cart;
};

module.exports = mongoose.model("Cart", cartSchema);