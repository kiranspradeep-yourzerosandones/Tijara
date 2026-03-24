// backend/controllers/cartController.js
const Cart = require("../models/Cart");
const Product = require("../models/Product");
const mongoose = require("mongoose");

// ============================================================
// CUSTOMER CART OPERATIONS
// ============================================================

/**
 * @desc    Get user's cart
 * @route   GET /api/cart
 * @access  Private
 */
exports.getCart = async (req, res) => {
  try {
    let cart = await Cart.findOne({ user: req.user._id })
      .populate({
        path: 'items.product',
        select: 'title slug price unit images inStock isActive minOrderQuantity maxOrderQuantity trackQuantity stockQuantity'
      });

    if (!cart) {
      cart = await Cart.create({ user: req.user._id, items: [] });
    }

    // Check for any issues with cart items
    const warnings = [];
    const validItems = [];

    for (const item of cart.items) {
      const product = item.product;
      
      if (!product) {
        warnings.push(`Product "${item.productTitle}" no longer exists`);
        continue;
      }

      if (!product.isActive) {
        warnings.push(`Product "${product.title}" is no longer available`);
        continue;
      }

      if (!product.inStock) {
        warnings.push(`Product "${product.title}" is out of stock`);
        continue;
      }

      // Check stock quantity limit
      if (product.trackQuantity && product.stockQuantity !== null) {
        if (item.quantity > product.stockQuantity) {
          warnings.push(`Only ${product.stockQuantity} units available for "${product.title}"`);
          item.quantity = product.stockQuantity;
        }
      }

      // Check if price changed
      if (item.priceAtAdd !== product.price) {
        warnings.push(`Price updated for "${product.title}"`);
        item.priceAtAdd = product.price;
      }

      validItems.push(item);
    }

    // Update cart if there were changes
    if (validItems.length !== cart.items.length || warnings.length > 0) {
      cart.items = validItems;
      await cart.save();
    }

    res.status(200).json({
      success: true,
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
        warnings: warnings.length > 0 ? warnings : undefined
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

    // Validate product ID
    if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        success: false,
        message: "Valid product ID is required"
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
        message: "This product is not available"
      });
    }

    if (!product.inStock) {
      return res.status(400).json({
        success: false,
        message: "This product is out of stock"
      });
    }

    // Check minimum order quantity
    if (quantity < product.minOrderQuantity) {
      return res.status(400).json({
        success: false,
        message: `Minimum order quantity is ${product.minOrderQuantity}`
      });
    }

    // Get or create cart
    let cart = await Cart.getOrCreateCart(req.user._id);

    // Calculate total quantity (existing + new)
    const existingItem = cart.findItem(productId);
    const existingQty = existingItem ? existingItem.quantity : 0;
    const totalQty = existingQty + quantity;

    // Check maximum order quantity
    if (totalQty > product.maxOrderQuantity) {
      return res.status(400).json({
        success: false,
        message: `Maximum order quantity is ${product.maxOrderQuantity}. You already have ${existingQty} in cart.`
      });
    }

    // Check stock quantity if tracking
    if (product.trackQuantity && product.stockQuantity !== null) {
      if (totalQty > product.stockQuantity) {
        return res.status(400).json({
          success: false,
          message: `Only ${product.stockQuantity} units available. You already have ${existingQty} in cart.`,
          availableStock: product.stockQuantity,
          cartQuantity: existingQty
        });
      }
    }

    // Add item to cart
    cart.addItem(product, quantity);
    await cart.save();

    // Populate for response
    await cart.populate({
      path: 'items.product',
      select: 'title slug price unit images inStock isActive trackQuantity stockQuantity'
    });

    res.status(200).json({
      success: true,
      message: `${product.title} added to cart`,
      data: {
        cart: {
          _id: cart._id,
          items: cart.items,
          totalItems: cart.totalItems,
          uniqueProducts: cart.uniqueProducts,
          subtotal: cart.subtotal,
          total: cart.total
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

    if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        success: false,
        message: "Valid product ID is required"
      });
    }

    if (quantity === undefined || quantity < 0) {
      return res.status(400).json({
        success: false,
        message: "Valid quantity is required"
      });
    }

    // Find cart
    let cart = await Cart.findOne({ user: req.user._id });

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: "Cart not found"
      });
    }

    // If quantity is 0, remove item
    if (quantity === 0) {
      cart.removeItem(productId);
      await cart.save();

      await cart.populate({
        path: 'items.product',
        select: 'title slug price unit images inStock isActive'
      });

      return res.status(200).json({
        success: true,
        message: "Item removed from cart",
        data: {
          cart: {
            _id: cart._id,
            items: cart.items,
            totalItems: cart.totalItems,
            subtotal: cart.subtotal,
            total: cart.total
          }
        }
      });
    }

    // Find product for validation
    const product = await Product.findById(productId);

    if (!product) {
      cart.removeItem(productId);
      await cart.save();
      return res.status(404).json({
        success: false,
        message: "Product no longer exists"
      });
    }

    if (!product.inStock) {
      return res.status(400).json({
        success: false,
        message: "Product is out of stock"
      });
    }

    // Check minimum quantity
    if (quantity < product.minOrderQuantity) {
      return res.status(400).json({
        success: false,
        message: `Minimum order quantity is ${product.minOrderQuantity}`
      });
    }

    // Check maximum quantity
    if (quantity > product.maxOrderQuantity) {
      return res.status(400).json({
        success: false,
        message: `Maximum order quantity is ${product.maxOrderQuantity}`
      });
    }

    // Check stock quantity if tracking
    if (product.trackQuantity && product.stockQuantity !== null) {
      if (quantity > product.stockQuantity) {
        return res.status(400).json({
          success: false,
          message: `Only ${product.stockQuantity} units available`,
          availableStock: product.stockQuantity
        });
      }
    }

    // Update quantity
    const updated = cart.updateItemQuantity(productId, quantity);

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: "Item not found in cart"
      });
    }

    await cart.save();

    await cart.populate({
      path: 'items.product',
      select: 'title slug price unit images inStock isActive trackQuantity stockQuantity'
    });

    res.status(200).json({
      success: true,
      message: "Cart updated",
      data: {
        cart: {
          _id: cart._id,
          items: cart.items,
          totalItems: cart.totalItems,
          subtotal: cart.subtotal,
          total: cart.total
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

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID"
      });
    }

    let cart = await Cart.findOne({ user: req.user._id });

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: "Cart not found"
      });
    }

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
      select: 'title slug price unit images inStock isActive'
    });

    res.status(200).json({
      success: true,
      message: "Item removed from cart",
      data: {
        cart: {
          _id: cart._id,
          items: cart.items,
          totalItems: cart.totalItems,
          subtotal: cart.subtotal,
          total: cart.total
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
 * @desc    Clear cart
 * @route   DELETE /api/cart/clear
 * @access  Private
 */
exports.clearCart = async (req, res) => {
  try {
    let cart = await Cart.findOne({ user: req.user._id });

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: "Cart not found"
      });
    }

    cart.clearCart();
    await cart.save();

    res.status(200).json({
      success: true,
      message: "Cart cleared",
      data: {
        cart: {
          _id: cart._id,
          items: [],
          totalItems: 0,
          subtotal: 0,
          total: 0
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
 * @desc    Get cart summary
 * @route   GET /api/cart/summary
 * @access  Private
 */
exports.getCartSummary = async (req, res) => {
  try {
    let cart = await Cart.findOne({ user: req.user._id });

    if (!cart) {
      return res.status(200).json({
        success: true,
        data: {
          totalItems: 0,
          uniqueProducts: 0,
          subtotal: 0,
          total: 0
        }
      });
    }

    res.status(200).json({
      success: true,
      data: cart.getSummary()
    });

  } catch (error) {
    console.error("Get Cart Summary Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get cart summary",
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
    let cart = await Cart.findOne({ user: req.user._id })
      .populate({
        path: 'items.product',
        select: 'title price inStock isActive trackQuantity stockQuantity'
      });

    if (!cart || cart.items.length === 0) {
      return res.status(200).json({
        success: true,
        message: "Cart is empty",
        data: { updated: 0 }
      });
    }

    let updatedCount = 0;
    const warnings = [];

    for (let item of cart.items) {
      if (!item.product) continue;

      // Update price
      if (item.priceAtAdd !== item.product.price) {
        item.priceAtAdd = item.product.price;
        updatedCount++;
      }

      // Check stock
      if (item.product.trackQuantity && item.product.stockQuantity !== null) {
        if (item.quantity > item.product.stockQuantity) {
          warnings.push(`Quantity adjusted for ${item.product.title}: only ${item.product.stockQuantity} available`);
          item.quantity = item.product.stockQuantity;
          updatedCount++;
        }
      }
    }

    if (updatedCount > 0) {
      cart.lastUpdated = new Date();
      await cart.save();
    }

    res.status(200).json({
      success: true,
      message: updatedCount > 0 ? `${updatedCount} items updated` : "Prices are up to date",
      data: {
        updated: updatedCount,
        warnings: warnings.length > 0 ? warnings : undefined,
        cart: {
          subtotal: cart.subtotal,
          total: cart.total
        }
      }
    });

  } catch (error) {
    console.error("Sync Cart Prices Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to sync prices",
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
    let cart = await Cart.findOne({ user: req.user._id })
      .populate({
        path: 'items.product',
        select: 'title slug price unit inStock isActive minOrderQuantity maxOrderQuantity trackQuantity stockQuantity'
      });

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Cart is empty",
        isValid: false
      });
    }

    const errors = [];
    const warnings = [];
    let isValid = true;

    for (const item of cart.items) {
      const product = item.product;

      if (!product) {
        errors.push({
          productId: item.product,
          productTitle: item.productTitle,
          error: "Product no longer exists"
        });
        isValid = false;
        continue;
      }

      if (!product.isActive) {
        errors.push({
          productId: product._id,
          productTitle: product.title,
          error: "Product is not available"
        });
        isValid = false;
        continue;
      }

      if (!product.inStock) {
        errors.push({
          productId: product._id,
          productTitle: product.title,
          error: "Product is out of stock"
        });
        isValid = false;
        continue;
      }

      // Check stock quantity
      if (product.trackQuantity && product.stockQuantity !== null) {
        if (item.quantity > product.stockQuantity) {
          errors.push({
            productId: product._id,
            productTitle: product.title,
            error: `Only ${product.stockQuantity} units available`,
            requestedQuantity: item.quantity,
            availableQuantity: product.stockQuantity
          });
          isValid = false;
        }
      }

      // Check min/max quantity
      if (item.quantity < product.minOrderQuantity) {
        errors.push({
          productId: product._id,
          productTitle: product.title,
          error: `Minimum order quantity is ${product.minOrderQuantity}`
        });
        isValid = false;
      }

      if (item.quantity > product.maxOrderQuantity) {
        errors.push({
          productId: product._id,
          productTitle: product.title,
          error: `Maximum order quantity is ${product.maxOrderQuantity}`
        });
        isValid = false;
      }

      // Check price changes (warning only)
      if (item.priceAtAdd !== product.price) {
        warnings.push({
          productId: product._id,
          productTitle: product.title,
          warning: `Price changed from ₹${item.priceAtAdd} to ₹${product.price}`,
          oldPrice: item.priceAtAdd,
          newPrice: product.price
        });
      }
    }

    res.status(200).json({
      success: true,
      isValid,
      errors: errors.length > 0 ? errors : undefined,
      warnings: warnings.length > 0 ? warnings : undefined,
      cart: isValid ? {
        totalItems: cart.totalItems,
        subtotal: cart.subtotal,
        total: cart.total
      } : undefined
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
// ADMIN CART OPERATIONS
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

    if (hasItems === "true") {
      query["items.0"] = { $exists: true };
    }

    const carts = await Cart.find(query)
      .populate('user', 'name phone email businessName')
      .populate({
        path: 'items.product',
        select: 'title price images'
      })
      .sort({ lastUpdated: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Cart.countDocuments(query);

    // Add summary to each cart
    const cartsWithSummary = carts.map(cart => ({
      _id: cart._id,
      user: cart.user,
      items: cart.items,
      totalItems: cart.totalItems,
      uniqueProducts: cart.uniqueProducts,
      subtotal: cart.subtotal,
      total: cart.total,
      lastUpdated: cart.lastUpdated,
      createdAt: cart.createdAt
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
    console.error("Admin Get All Carts Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch carts",
      error: process.env.NODE_ENV === "development" ? error.message : undefined
    });
  }
};

/**
 * @desc    Get user's cart (Admin)
 * @route   GET /api/admin/carts/:userId
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
      .populate('user', 'name phone email businessName')
      .populate({
        path: 'items.product',
        select: 'title slug price unit images inStock isActive trackQuantity stockQuantity'
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
      message: "Failed to fetch user cart",
      error: process.env.NODE_ENV === "development" ? error.message : undefined
    });
  }
};