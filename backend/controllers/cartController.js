const Cart = require("../models/Cart");
const Product = require("../models/Product");
const mongoose = require("mongoose");

// ============================================================
// CART MANAGEMENT
// ============================================================

/**
 * @desc    Get current user's cart
 * @route   GET /api/cart
 * @access  Private
 */
exports.getCart = async (req, res) => {
  try {
    // Get or create cart
    let cart = await Cart.findOne({ user: req.user._id })
      .populate({
        path: 'items.product',
        select: 'title slug price compareAtPrice unit images inStock isActive minOrderQuantity maxOrderQuantity'
      });

    if (!cart) {
      cart = await Cart.create({ user: req.user._id, items: [] });
    }

    // Filter out items with deleted/inactive products
    const validItems = [];
    const invalidItems = [];

    for (const item of cart.items) {
      if (item.product && item.product.isActive) {
        validItems.push(item);
      } else {
        invalidItems.push(item);
      }
    }

    // If there are invalid items, remove them and save
    if (invalidItems.length > 0) {
      cart.items = validItems;
      await cart.save();
      console.log(`🛒 Removed ${invalidItems.length} invalid items from cart`);
    }

    // Calculate totals
    const summary = {
      totalItems: cart.totalItems,
      uniqueProducts: cart.uniqueProducts,
      subtotal: cart.subtotal,
      total: cart.total
    };

    res.status(200).json({
      success: true,
      data: {
        cart: {
          _id: cart._id,
          items: cart.items,
          ...summary,
          lastUpdated: cart.lastUpdated
        }
      }
    });

  } catch (error) {
    console.error("Get Cart Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch cart",
      error: process.env.NODE_ENV === "development" ? error.message : undefined
    });
  }
};

/**
 * @desc    Add item to cart
 * @route   POST /api/cart/add
 * @access  Private
 */
exports.addToCart = async (req, res) => {
  try {
    const { productId, quantity = 1 } = req.body;

    // Validate productId
    if (!productId) {
      return res.status(400).json({
        success: false,
        message: "Product ID is required"
      });
    }

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID"
      });
    }

    // Validate quantity
    const qty = parseInt(quantity);
    if (isNaN(qty) || qty < 1) {
      return res.status(400).json({
        success: false,
        message: "Quantity must be at least 1"
      });
    }

    // Find product
    const product = await Product.findById(productId);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found"
      });
    }

    if (!product.isActive) {
      return res.status(400).json({
        success: false,
        message: "Product is not available"
      });
    }

    if (!product.inStock) {
      return res.status(400).json({
        success: false,
        message: "Product is out of stock"
      });
    }

    // Check minimum order quantity
    if (qty < product.minOrderQuantity) {
      return res.status(400).json({
        success: false,
        message: `Minimum order quantity is ${product.minOrderQuantity} ${product.unit}`
      });
    }

    // Get or create cart
    let cart = await Cart.getOrCreateCart(req.user._id);

    // Check existing quantity + new quantity against max
    const existingItem = cart.findItem(productId);
    const totalQty = existingItem ? existingItem.quantity + qty : qty;

    if (totalQty > product.maxOrderQuantity) {
      return res.status(400).json({
        success: false,
        message: `Maximum order quantity is ${product.maxOrderQuantity} ${product.unit}. You already have ${existingItem ? existingItem.quantity : 0} in cart.`
      });
    }

    // Add item to cart
    cart.addItem(product, qty);
    await cart.save();

    // Populate product details for response
    await cart.populate({
      path: 'items.product',
      select: 'title slug price compareAtPrice unit images inStock isActive'
    });

    console.log(`🛒 Added ${qty} x ${product.title} to cart for user: ${req.user._id}`);

    res.status(200).json({
      success: true,
      message: "Item added to cart",
      data: {
        cart: {
          _id: cart._id,
          items: cart.items,
          totalItems: cart.totalItems,
          uniqueProducts: cart.uniqueProducts,
          subtotal: cart.subtotal,
          total: cart.total,
          lastUpdated: cart.lastUpdated
        }
      }
    });

  } catch (error) {
    console.error("Add to Cart Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to add item to cart",
      error: process.env.NODE_ENV === "development" ? error.message : undefined
    });
  }
};

/**
 * @desc    Update cart item quantity
 * @route   PUT /api/cart/update
 * @access  Private
 */
exports.updateCartItem = async (req, res) => {
  try {
    const { productId, quantity } = req.body;

    // Validate productId
    if (!productId) {
      return res.status(400).json({
        success: false,
        message: "Product ID is required"
      });
    }

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID"
      });
    }

    // Validate quantity
    const qty = parseInt(quantity);
    if (isNaN(qty) || qty < 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid quantity"
      });
    }

    // Find cart
    const cart = await Cart.findOne({ user: req.user._id });

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: "Cart not found"
      });
    }

    // Find item in cart
    const existingItem = cart.findItem(productId);

    if (!existingItem) {
      return res.status(404).json({
        success: false,
        message: "Item not found in cart"
      });
    }

    // If quantity is 0, remove item
    if (qty === 0) {
      cart.removeItem(productId);
      await cart.save();

      await cart.populate({
        path: 'items.product',
        select: 'title slug price compareAtPrice unit images inStock isActive'
      });

      return res.status(200).json({
        success: true,
        message: "Item removed from cart",
        data: {
          cart: {
            _id: cart._id,
            items: cart.items,
            totalItems: cart.totalItems,
            uniqueProducts: cart.uniqueProducts,
            subtotal: cart.subtotal,
            total: cart.total,
            lastUpdated: cart.lastUpdated
          }
        }
      });
    }

    // Check product constraints
    const product = await Product.findById(productId);

    if (!product || !product.isActive) {
      // Remove invalid product from cart
      cart.removeItem(productId);
      await cart.save();

      return res.status(400).json({
        success: false,
        message: "Product is no longer available"
      });
    }

    // Check minimum order quantity
    if (qty < product.minOrderQuantity) {
      return res.status(400).json({
        success: false,
        message: `Minimum order quantity is ${product.minOrderQuantity} ${product.unit}`
      });
    }

    // Check maximum order quantity
    if (qty > product.maxOrderQuantity) {
      return res.status(400).json({
        success: false,
        message: `Maximum order quantity is ${product.maxOrderQuantity} ${product.unit}`
      });
    }

    // Update quantity and price
    cart.updateItemQuantity(productId, qty);
    
    // Also update the price to current price
    const itemIndex = cart.findItemIndex(productId);
    if (itemIndex > -1) {
      cart.items[itemIndex].priceAtAdd = product.price;
    }

    await cart.save();

    await cart.populate({
      path: 'items.product',
      select: 'title slug price compareAtPrice unit images inStock isActive'
    });

    console.log(`🛒 Updated quantity to ${qty} for product: ${productId}`);

    res.status(200).json({
      success: true,
      message: "Cart updated",
      data: {
        cart: {
          _id: cart._id,
          items: cart.items,
          totalItems: cart.totalItems,
          uniqueProducts: cart.uniqueProducts,
          subtotal: cart.subtotal,
          total: cart.total,
          lastUpdated: cart.lastUpdated
        }
      }
    });

  } catch (error) {
    console.error("Update Cart Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update cart",
      error: process.env.NODE_ENV === "development" ? error.message : undefined
    });
  }
};

/**
 * @desc    Remove item from cart
 * @route   DELETE /api/cart/remove/:productId
 * @access  Private
 */
exports.removeFromCart = async (req, res) => {
  try {
    const { productId } = req.params;

    // Validate productId
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID"
      });
    }

    // Find cart
    const cart = await Cart.findOne({ user: req.user._id });

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: "Cart not found"
      });
    }

    // Remove item
    const removed = cart.removeItem(productId);

    if (!removed) {
      return res.status(404).json({
        success: false,
        message: "Item not found in cart"
      });
    }

    await cart.save();

    await cart.populate({
      path: 'items.product',
      select: 'title slug price compareAtPrice unit images inStock isActive'
    });

    console.log(`🛒 Removed product ${productId} from cart`);

    res.status(200).json({
      success: true,
      message: "Item removed from cart",
      data: {
        cart: {
          _id: cart._id,
          items: cart.items,
          totalItems: cart.totalItems,
          uniqueProducts: cart.uniqueProducts,
          subtotal: cart.subtotal,
          total: cart.total,
          lastUpdated: cart.lastUpdated
        }
      }
    });

  } catch (error) {
    console.error("Remove from Cart Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to remove item from cart",
      error: process.env.NODE_ENV === "development" ? error.message : undefined
    });
  }
};

/**
 * @desc    Clear entire cart
 * @route   DELETE /api/cart/clear
 * @access  Private
 */
exports.clearCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id });

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: "Cart not found"
      });
    }

    cart.clearCart();
    await cart.save();

    console.log(`🛒 Cart cleared for user: ${req.user._id}`);

    res.status(200).json({
      success: true,
      message: "Cart cleared",
      data: {
        cart: {
          _id: cart._id,
          items: [],
          totalItems: 0,
          uniqueProducts: 0,
          subtotal: 0,
          total: 0,
          lastUpdated: cart.lastUpdated
        }
      }
    });

  } catch (error) {
    console.error("Clear Cart Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to clear cart",
      error: process.env.NODE_ENV === "development" ? error.message : undefined
    });
  }
};

/**
 * @desc    Get cart summary (count and total only)
 * @route   GET /api/cart/summary
 * @access  Private
 */
exports.getCartSummary = async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id });

    if (!cart) {
      return res.status(200).json({
        success: true,
        data: {
          summary: {
            totalItems: 0,
            uniqueProducts: 0,
            subtotal: 0,
            total: 0
          }
        }
      });
    }

    res.status(200).json({
      success: true,
      data: {
        summary: cart.getSummary()
      }
    });

  } catch (error) {
    console.error("Get Cart Summary Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch cart summary",
      error: process.env.NODE_ENV === "development" ? error.message : undefined
    });
  }
};

/**
 * @desc    Sync cart prices with current product prices
 * @route   PUT /api/cart/sync-prices
 * @access  Private
 */
exports.syncCartPrices = async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id });

    if (!cart || cart.items.length === 0) {
      return res.status(200).json({
        success: true,
        message: "Cart is empty",
        data: {
          cart: {
            items: [],
            totalItems: 0,
            uniqueProducts: 0,
            subtotal: 0,
            total: 0
          }
        }
      });
    }

    // Get all product IDs
    const productIds = cart.items.map(item => item.product);

    // Fetch current product data
    const products = await Product.find({
      _id: { $in: productIds },
      isActive: true
    });

    const productMap = new Map();
    products.forEach(p => productMap.set(p._id.toString(), p));

    // Update prices and remove unavailable products
    const updatedItems = [];
    const removedItems = [];
    const priceChanges = [];

    for (const item of cart.items) {
      const product = productMap.get(item.product.toString());

      if (!product) {
        // Product no longer available
        removedItems.push(item.productTitle);
        continue;
      }

      if (!product.inStock) {
        // Product out of stock
        removedItems.push(item.productTitle);
        continue;
      }

      // Check if price changed
      if (item.priceAtAdd !== product.price) {
        priceChanges.push({
          product: product.title,
          oldPrice: item.priceAtAdd,
          newPrice: product.price
        });
        item.priceAtAdd = product.price;
      }

      // Update product details
      item.productTitle = product.title;
      item.productImage = product.images && product.images.length > 0 ? product.images[0] : null;
      item.unit = product.unit;

      updatedItems.push(item);
    }

    cart.items = updatedItems;
    cart.lastUpdated = new Date();
    await cart.save();

    await cart.populate({
      path: 'items.product',
      select: 'title slug price compareAtPrice unit images inStock isActive'
    });

    res.status(200).json({
      success: true,
      message: "Cart synced with current prices",
      data: {
        cart: {
          _id: cart._id,
          items: cart.items,
          totalItems: cart.totalItems,
          uniqueProducts: cart.uniqueProducts,
          subtotal: cart.subtotal,
          total: cart.total,
          lastUpdated: cart.lastUpdated
        },
        changes: {
          priceChanges,
          removedItems
        }
      }
    });

  } catch (error) {
    console.error("Sync Cart Prices Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to sync cart prices",
      error: process.env.NODE_ENV === "development" ? error.message : undefined
    });
  }
};

/**
 * @desc    Validate cart before checkout
 * @route   GET /api/cart/validate
 * @access  Private
 */
exports.validateCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id })
      .populate({
        path: 'items.product',
        select: 'title slug price unit inStock isActive minOrderQuantity maxOrderQuantity'
      });

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Cart is empty",
        isValid: false,
        errors: ["Cart is empty"]
      });
    }

    const errors = [];
    const warnings = [];
    const validItems = [];

    for (const item of cart.items) {
      const product = item.product;

      // Check if product exists and is active
      if (!product || !product.isActive) {
        errors.push(`${item.productTitle} is no longer available`);
        continue;
      }

      // Check if in stock
      if (!product.inStock) {
        errors.push(`${product.title} is out of stock`);
        continue;
      }

      // Check minimum quantity
      if (item.quantity < product.minOrderQuantity) {
        errors.push(`${product.title} requires minimum quantity of ${product.minOrderQuantity}`);
        continue;
      }

      // Check maximum quantity
      if (item.quantity > product.maxOrderQuantity) {
        errors.push(`${product.title} maximum quantity is ${product.maxOrderQuantity}`);
        continue;
      }

      // Check price changes
      if (item.priceAtAdd !== product.price) {
        warnings.push(`Price of ${product.title} has changed from ₹${item.priceAtAdd} to ₹${product.price}`);
      }

      validItems.push(item);
    }

    const isValid = errors.length === 0 && validItems.length > 0;

    res.status(200).json({
      success: true,
      data: {
        isValid,
        errors,
        warnings,
        validItemsCount: validItems.length,
        totalItemsCount: cart.items.length,
        subtotal: cart.subtotal,
        total: cart.total
      }
    });

  } catch (error) {
    console.error("Validate Cart Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to validate cart",
      error: process.env.NODE_ENV === "development" ? error.message : undefined
    });
  }
};

// ============================================================
// ADMIN CART MANAGEMENT
// ============================================================

/**
 * @desc    Get all carts (Admin)
 * @route   GET /api/admin/carts
 * @access  Private/Admin
 */
exports.adminGetAllCarts = async (req, res) => {
  try {
    const { page = 1, limit = 20, hasItems } = req.query;

    const query = {};

    // Filter carts with items only
    if (hasItems === "true") {
      query["items.0"] = { $exists: true };
    }

    const carts = await Cart.find(query)
      .populate("user", "name phone businessName")
      .populate({
        path: 'items.product',
        select: 'title price'
      })
      .sort({ lastUpdated: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Cart.countDocuments(query);

    // Add summary to each cart
    const cartsWithSummary = carts.map(cart => ({
      _id: cart._id,
      user: cart.user,
      itemsCount: cart.items.length,
      totalItems: cart.totalItems,
      subtotal: cart.subtotal,
      total: cart.total,
      lastUpdated: cart.lastUpdated
    }));

    res.status(200).json({
      success: true,
      data: {
        carts: cartsWithSummary,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / limit),
          total
        }
      }
    });

  } catch (error) {
    console.error("Admin Get Carts Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch carts",
      error: process.env.NODE_ENV === "development" ? error.message : undefined
    });
  }
};

/**
 * @desc    Get specific user's cart (Admin)
 * @route   GET /api/admin/users/:userId/cart
 * @access  Private/Admin
 */
exports.adminGetUserCart = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID"
      });
    }

    const cart = await Cart.findOne({ user: userId })
      .populate("user", "name phone businessName")
      .populate({
        path: 'items.product',
        select: 'title slug price compareAtPrice unit images inStock isActive'
      });

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: "Cart not found for this user"
      });
    }

    res.status(200).json({
      success: true,
      data: {
        cart: {
          _id: cart._id,
          user: cart.user,
          items: cart.items,
          totalItems: cart.totalItems,
          uniqueProducts: cart.uniqueProducts,
          subtotal: cart.subtotal,
          total: cart.total,
          lastUpdated: cart.lastUpdated
        }
      }
    });

  } catch (error) {
    console.error("Admin Get User Cart Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch cart",
      error: process.env.NODE_ENV === "development" ? error.message : undefined
    });
  }
};