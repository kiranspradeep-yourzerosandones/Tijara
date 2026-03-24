// backend/controllers/orderController.js

const Order = require("../models/Order");
const Cart = require("../models/Cart");
const Location = require("../models/Location");
const Product = require("../models/Product");
const User = require("../models/User");
const mongoose = require("mongoose");
const { generateOrderNumber } = require("../utils/generateOrderNumber");

// ============================================================
// CUSTOMER ORDER OPERATIONS
// ============================================================

/**
 * @desc    Place order from cart
 * @route   POST /api/orders
 * @access  Private
 */
exports.placeOrder = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { locationId, customerNotes } = req.body;

    // Validate location ID
    if (!locationId) {
      return res.status(400).json({
        success: false,
        message: "Delivery location is required"
      });
    }

    if (!mongoose.Types.ObjectId.isValid(locationId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid location ID"
      });
    }

    // Get user's cart
    const cart = await Cart.findOne({ user: req.user._id })
      .populate({
        path: 'items.product',
        select: 'title slug price unit images category brand inStock isActive minOrderQuantity maxOrderQuantity trackQuantity stockQuantity'
      })
      .session(session);

    if (!cart || cart.items.length === 0) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: "Cart is empty"
      });
    }

    // Validate cart items
    const validItems = [];
    const errors = [];

    for (const item of cart.items) {
      const product = item.product;

      if (!product) {
        errors.push(`Product "${item.productTitle}" no longer exists`);
        continue;
      }

      if (!product.isActive) {
        errors.push(`Product "${product.title}" is no longer available`);
        continue;
      }

      if (!product.inStock) {
        errors.push(`Product "${product.title}" is out of stock`);
        continue;
      }

      // Check stock quantity if tracking
      if (product.trackQuantity && product.stockQuantity !== null) {
        if (item.quantity > product.stockQuantity) {
          errors.push(`Only ${product.stockQuantity} units available for "${product.title}"`);
          continue;
        }
      }

      if (item.quantity < product.minOrderQuantity) {
        errors.push(`${product.title} requires minimum quantity of ${product.minOrderQuantity}`);
        continue;
      }

      if (item.quantity > product.maxOrderQuantity) {
        errors.push(`${product.title} maximum quantity is ${product.maxOrderQuantity}`);
        continue;
      }

      validItems.push({
        product: product._id,
        productSnapshot: {
          title: product.title,
          slug: product.slug,
          image: product.images && product.images.length > 0 ? product.images[0] : null,
          category: product.category,
          brand: product.brand,
          unit: product.unit || "piece"
        },
        quantity: item.quantity,
        unitPrice: product.price, // Use current price
        subtotal: item.quantity * product.price
      });
    }

    if (errors.length > 0) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: "Some items in cart are invalid",
        errors
      });
    }

    if (validItems.length === 0) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: "No valid items in cart"
      });
    }

    // Get delivery location
    const location = await Location.findOne({
      _id: locationId,
      user: req.user._id,
      isActive: true
    }).session(session);

    if (!location) {
      await session.abortTransaction();
      return res.status(404).json({
        success: false,
        message: "Delivery location not found"
      });
    }

    // Calculate totals
    const subtotal = validItems.reduce((sum, item) => sum + item.subtotal, 0);
    const discount = 0; // Can be implemented later
    const tax = 0; // Can be implemented later
    const deliveryCharges = 0; // Can be implemented later
    const totalAmount = subtotal - discount + tax + deliveryCharges;

    // Generate order number
    const orderNumber = await generateOrderNumber(Order);

    // Get user details for snapshot
    const user = await User.findById(req.user._id).session(session);

    // Create order
    const order = new Order({
      orderNumber,
      user: req.user._id,
      customerSnapshot: {
        name: user.name,
        phone: user.phone,
        email: user.email,
        businessName: user.businessName
      },
      items: validItems,
      deliveryAddress: {
        locationId: location._id,
        label: location.label,
        shopName: location.shopName,
        contactPerson: location.contactPerson,
        contactPhone: location.contactPhone,
        addressLine1: location.address.line1,
        addressLine2: location.address.line2,
        city: location.address.city,
        state: location.address.state,
        pincode: location.address.pincode,
        country: location.address.country,
        coordinates: location.coordinates ? {
          latitude: location.coordinates.latitude,
          longitude: location.coordinates.longitude
        } : undefined,
        deliveryInstructions: location.deliveryInstructions
      },
      subtotal,
      discount,
      tax,
      deliveryCharges,
      totalAmount,
      customerNotes,
      status: "pending",
      paymentStatus: "pending",
      payment: {
        method: "credit",
        amountPaid: 0
      },
      statusHistory: [{
        status: "pending",
        timestamp: new Date(),
        note: "Order placed by customer"
      }]
    });

    await order.save({ session });

    // ✅ DECREMENT STOCK for products that track quantity
    for (const item of validItems) {
      try {
        const product = await Product.findById(item.product).session(session);
        if (product && product.trackQuantity) {
          await product.decrementStock(item.quantity);
          console.log(`📦 Stock decremented: ${product.title} - ${item.quantity} units`);
        }
      } catch (stockError) {
        console.error(`Failed to decrement stock for product ${item.product}:`, stockError);
        // Continue anyway - order is more important than stock tracking
      }
    }

    // Clear the cart
    cart.clearCart();
    await cart.save({ session });

    // Update user's pending amount
    await User.findByIdAndUpdate(
      req.user._id,
      { $inc: { pendingAmount: totalAmount } },
      { session }
    );

    await session.commitTransaction();

    console.log(`📦 Order placed: ${orderNumber} by user: ${req.user._id}`);

    // Populate order for response
    await order.populate('items.product', 'title slug images price');

    res.status(201).json({
      success: true,
      message: "Order placed successfully",
      data: {
        order: {
          _id: order._id,
          orderNumber: order.orderNumber,
          status: order.status,
          statusText: Order.getStatusText(order.status),
          items: order.items,
          deliveryAddress: order.deliveryAddress,
          subtotal: order.subtotal,
          discount: order.discount,
          tax: order.tax,
          deliveryCharges: order.deliveryCharges,
          totalAmount: order.totalAmount,
          totalItems: order.totalItems,
          paymentStatus: order.paymentStatus,
          customerNotes: order.customerNotes,
          createdAt: order.createdAt
        }
      }
    });

  } catch (error) {
    await session.abortTransaction();
    console.error("Place Order Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to place order",
      error: process.env.NODE_ENV === "development" ? error.message : undefined
    });
  } finally {
    session.endSession();
  }
};

/**
 * @desc    Get all orders for current user
 * @route   GET /api/orders
 * @access  Private
 */
exports.getMyOrders = async (req, res) => {
  try {
    const {
      status,
      paymentStatus,
      page = 1,
      limit = 10,
      sortBy = "createdAt",
      sortOrder = "desc"
    } = req.query;

    const query = { user: req.user._id };

    // Filter by status
    if (status) {
      query.status = status;
    }

    // Filter by payment status
    if (paymentStatus) {
      query.paymentStatus = paymentStatus;
    }

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === "asc" ? 1 : -1;

    const orders = await Order.find(query)
      .select('-internalNotes -deliveryOtp')
      .populate('items.product', 'title slug images')
      .sort(sortOptions)
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Order.countDocuments(query);

    // Add status text to each order
    const ordersWithStatusText = orders.map(order => ({
      ...order.toObject(),
      statusText: Order.getStatusText(order.status)
    }));

    res.status(200).json({
      success: true,
      data: {
        orders: ordersWithStatusText,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / limit),
          total
        }
      }
    });

  } catch (error) {
    console.error("Get Orders Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch orders",
      error: process.env.NODE_ENV === "development" ? error.message : undefined
    });
  }
};

/**
 * @desc    Get single order by ID
 * @route   GET /api/orders/:id
 * @access  Private
 */
exports.getOrder = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order ID"
      });
    }

    const order = await Order.findOne({
      _id: id,
      user: req.user._id
    })
    .select('-internalNotes -deliveryOtp')
    .populate('items.product', 'title slug images price inStock');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found"
      });
    }

    res.status(200).json({
      success: true,
      data: {
        order: {
          ...order.toObject(),
          statusText: Order.getStatusText(order.status),
          nextStatuses: Order.getNextStatuses(order.status)
        }
      }
    });

  } catch (error) {
    console.error("Get Order Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch order",
      error: process.env.NODE_ENV === "development" ? error.message : undefined
    });
  }
};

/**
 * @desc    Get order by order number
 * @route   GET /api/orders/number/:orderNumber
 * @access  Private
 */
exports.getOrderByNumber = async (req, res) => {
  try {
    const { orderNumber } = req.params;

    const order = await Order.findOne({
      orderNumber: orderNumber.toUpperCase(),
      user: req.user._id
    })
    .select('-internalNotes -deliveryOtp')
    .populate('items.product', 'title slug images price');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found"
      });
    }

    res.status(200).json({
      success: true,
      data: {
        order: {
          ...order.toObject(),
          statusText: Order.getStatusText(order.status)
        }
      }
    });

  } catch (error) {
    console.error("Get Order By Number Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch order",
      error: process.env.NODE_ENV === "development" ? error.message : undefined
    });
  }
};

/**
 * @desc    Cancel order (customer)
 * @route   PUT /api/orders/:id/cancel
 * @access  Private
 */
exports.cancelOrder = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { id } = req.params;
    const { reason } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order ID"
      });
    }

    const order = await Order.findOne({
      _id: id,
      user: req.user._id
    }).session(session);

    if (!order) {
      await session.abortTransaction();
      return res.status(404).json({
        success: false,
        message: "Order not found"
      });
    }

    // Check if order can be cancelled
    if (!order.canCancel) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: `Order cannot be cancelled. Current status: ${Order.getStatusText(order.status)}`
      });
    }

    // Update order
    order.status = "cancelled";
    order.cancellation = {
      reason: reason || "Cancelled by customer",
      cancelledBy: req.user._id,
      isCustomerCancelled: true
    };

    // Add to status history
    order.statusHistory.push({
      status: "cancelled",
      timestamp: new Date(),
      updatedBy: req.user._id,
      note: reason || "Cancelled by customer"
    });

    await order.save({ session });

    // ✅ RESTORE STOCK for products that track quantity
    for (const item of order.items) {
      try {
        const product = await Product.findById(item.product).session(session);
        if (product && product.trackQuantity) {
          await product.incrementStock(item.quantity);
          console.log(`📦 Stock restored: ${product.title} + ${item.quantity} units`);
        }
      } catch (stockError) {
        console.error(`Failed to restore stock for product ${item.product}:`, stockError);
        // Continue anyway
      }
    }

    // Update user's pending amount
    await User.findByIdAndUpdate(
      req.user._id,
      { $inc: { pendingAmount: -order.totalAmount } },
      { session }
    );

    await session.commitTransaction();

    console.log(`📦 Order cancelled: ${order.orderNumber} by customer`);

    res.status(200).json({
      success: true,
      message: "Order cancelled successfully",
      data: {
        order: {
          _id: order._id,
          orderNumber: order.orderNumber,
          status: order.status,
          statusText: Order.getStatusText(order.status),
          cancelledAt: order.cancelledAt
        }
      }
    });

  } catch (error) {
    await session.abortTransaction();
    console.error("Cancel Order Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to cancel order",
      error: process.env.NODE_ENV === "development" ? error.message : undefined
    });
  } finally {
    session.endSession();
  }
};

/**
 * @desc    Get order statistics for current user
 * @route   GET /api/orders/stats
 * @access  Private
 */
exports.getMyOrderStats = async (req, res) => {
  try {
    const userId = req.user._id;

    // Aggregate order statistics
    const stats = await Order.aggregate([
      { $match: { user: new mongoose.Types.ObjectId(userId) } },
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          totalSpent: {
            $sum: {
              $cond: [
                { $ne: ["$status", "cancelled"] },
                "$totalAmount",
                0
              ]
            }
          },
          pendingOrders: {
            $sum: { $cond: [{ $eq: ["$status", "pending"] }, 1, 0] }
          },
          confirmedOrders: {
            $sum: { $cond: [{ $eq: ["$status", "confirmed"] }, 1, 0] }
          },
          deliveredOrders: {
            $sum: { $cond: [{ $eq: ["$status", "delivered"] }, 1, 0] }
          },
          cancelledOrders: {
            $sum: { $cond: [{ $eq: ["$status", "cancelled"] }, 1, 0] }
          },
          pendingPayments: {
            $sum: {
              $cond: [
                { $and: [
                  { $ne: ["$status", "cancelled"] },
                  { $eq: ["$paymentStatus", "pending"] }
                ]},
                "$totalAmount",
                0
              ]
            }
          }
        }
      }
    ]);

    const defaultStats = {
      totalOrders: 0,
      totalSpent: 0,
      pendingOrders: 0,
      confirmedOrders: 0,
      deliveredOrders: 0,
      cancelledOrders: 0,
      pendingPayments: 0
    };

    res.status(200).json({
      success: true,
      data: {
        stats: stats[0] || defaultStats
      }
    });

  } catch (error) {
    console.error("Get Order Stats Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch order statistics",
      error: process.env.NODE_ENV === "development" ? error.message : undefined
    });
  }
};

/**
 * @desc    Reorder (add previous order items to cart)
 * @route   POST /api/orders/:id/reorder
 * @access  Private
 */
exports.reorder = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order ID"
      });
    }

    const order = await Order.findOne({
      _id: id,
      user: req.user._id
    }).populate('items.product', 'title price inStock isActive minOrderQuantity maxOrderQuantity trackQuantity stockQuantity');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found"
      });
    }

    // Get or create cart
    let cart = await Cart.getOrCreateCart(req.user._id);

    const addedItems = [];
    const skippedItems = [];

    for (const item of order.items) {
      const product = item.product;

      // Check if product is still available
      if (!product || !product.isActive || !product.inStock) {
        skippedItems.push({
          title: item.productSnapshot.title,
          reason: "Product no longer available"
        });
        continue;
      }

      // Check stock if tracking
      if (product.trackQuantity && product.stockQuantity !== null) {
        if (product.stockQuantity < item.quantity) {
          skippedItems.push({
            title: product.title,
            reason: `Only ${product.stockQuantity} units available`
          });
          continue;
        }
      }

      // Check quantity limits
      let quantity = item.quantity;
      if (quantity < product.minOrderQuantity) {
        quantity = product.minOrderQuantity;
      }
      if (quantity > product.maxOrderQuantity) {
        quantity = product.maxOrderQuantity;
      }

      // Add to cart
      cart.addItem(product, quantity);
      addedItems.push({
        title: product.title,
        quantity
      });
    }

    await cart.save();

    // Populate cart for response
    await cart.populate({
      path: 'items.product',
      select: 'title slug price unit images inStock isActive'
    });

    res.status(200).json({
      success: true,
      message: addedItems.length > 0 
        ? `${addedItems.length} items added to cart` 
        : "No items could be added to cart",
      data: {
        addedItems,
        skippedItems,
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
    console.error("Reorder Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to reorder",
      error: process.env.NODE_ENV === "development" ? error.message : undefined
    });
  }
};

// ============================================================
// ADMIN ORDER OPERATIONS
// ============================================================

/**
 * @desc    Get all orders (Admin)
 * @route   GET /api/admin/orders
 * @access  Private/Admin
 */
exports.adminGetAllOrders = async (req, res) => {
  try {
    const {
      status,
      paymentStatus,
      userId,
      city,
      startDate,
      endDate,
      search,
      page = 1,
      limit = 20,
      sortBy = "createdAt",
      sortOrder = "desc"
    } = req.query;

    const query = {};

    // Filter by status
    if (status) {
      query.status = status;
    }

    // Filter by payment status
    if (paymentStatus) {
      query.paymentStatus = paymentStatus;
    }

    // Filter by user
    if (userId) {
      if (mongoose.Types.ObjectId.isValid(userId)) {
        query.user = userId;
      }
    }

    // Filter by city
    if (city) {
      query["deliveryAddress.city"] = { $regex: city, $options: "i" };
    }

    // Filter by date range
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) {
        query.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        query.createdAt.$lte = new Date(endDate);
      }
    }

    // Search by order number or customer name/phone
    if (search) {
      query.$or = [
        { orderNumber: { $regex: search, $options: "i" } },
        { "customerSnapshot.name": { $regex: search, $options: "i" } },
        { "customerSnapshot.phone": { $regex: search, $options: "i" } },
        { "customerSnapshot.businessName": { $regex: search, $options: "i" } }
      ];
    }

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === "asc" ? 1 : -1;

    const orders = await Order.find(query)
      .populate('user', 'name phone businessName')
      .select('-deliveryOtp.code')
      .sort(sortOptions)
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Order.countDocuments(query);

    // Add status text
    const ordersWithStatusText = orders.map(order => ({
      ...order.toObject(),
      statusText: Order.getStatusText(order.status)
    }));

    res.status(200).json({
      success: true,
      data: {
        orders: ordersWithStatusText,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / limit),
          total
        }
      }
    });

  } catch (error) {
    console.error("Admin Get Orders Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch orders",
      error: process.env.NODE_ENV === "development" ? error.message : undefined
    });
  }
};

/**
 * @desc    Get single order (Admin)
 * @route   GET /api/admin/orders/:id
 * @access  Private/Admin
 */
exports.adminGetOrder = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order ID"
      });
    }

    const order = await Order.findById(id)
      .populate('user', 'name phone email businessName')
      .populate('items.product', 'title slug images price inStock')
      .populate('statusHistory.updatedBy', 'name')
      .populate('payment.markedPaidBy', 'name')
      .populate('cancellation.cancelledBy', 'name');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found"
      });
    }

    res.status(200).json({
      success: true,
      data: {
        order: {
          ...order.toObject(),
          statusText: Order.getStatusText(order.status),
          nextStatuses: Order.getNextStatuses(order.status)
        }
      }
    });

  } catch (error) {
    console.error("Admin Get Order Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch order",
      error: process.env.NODE_ENV === "development" ? error.message : undefined
    });
  }
};

/**
 * @desc    Update order status (Admin)
 * @route   PUT /api/admin/orders/:id/status
 * @access  Private/Admin
 */
exports.adminUpdateOrderStatus = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { id } = req.params;
    const { status, note, expectedDeliveryDate } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order ID"
      });
    }

    if (!status) {
      return res.status(400).json({
        success: false,
        message: "Status is required"
      });
    }

    const order = await Order.findById(id).session(session);

    if (!order) {
      await session.abortTransaction();
      return res.status(404).json({
        success: false,
        message: "Order not found"
      });
    }

    // Check valid transition
    if (!order.canTransitionTo(status)) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: `Cannot change status from "${Order.getStatusText(order.status)}" to "${Order.getStatusText(status)}"`,
        validStatuses: Order.getNextStatuses(order.status)
      });
    }

    // Update status
    order.status = status;

    // Add to status history
    order.statusHistory.push({
      status,
      timestamp: new Date(),
      updatedBy: req.user._id,
      note
    });

    // Set expected delivery date if provided
    if (expectedDeliveryDate) {
      order.expectedDeliveryDate = new Date(expectedDeliveryDate);
    }

    // Handle cancellation
    if (status === "cancelled") {
      order.cancellation = {
        reason: note || "Cancelled by admin",
        cancelledBy: req.user._id,
        isCustomerCancelled: false
      };

      // ✅ RESTORE STOCK for products that track quantity
      for (const item of order.items) {
        try {
          const product = await Product.findById(item.product).session(session);
          if (product && product.trackQuantity) {
            await product.incrementStock(item.quantity);
            console.log(`📦 Stock restored (admin cancel): ${product.title} + ${item.quantity} units`);
          }
        } catch (stockError) {
          console.error(`Failed to restore stock for product ${item.product}:`, stockError);
        }
      }

      // Update user's pending amount
      await User.findByIdAndUpdate(
        order.user,
        { $inc: { pendingAmount: -order.totalAmount } },
        { session }
      );
    }

    await order.save({ session });

    await session.commitTransaction();

    console.log(`📦 Order status updated: ${order.orderNumber} -> ${status} by admin: ${req.user._id}`);

    res.status(200).json({
      success: true,
      message: `Order status updated to "${Order.getStatusText(status)}"`,
      data: {
        order: {
          _id: order._id,
          orderNumber: order.orderNumber,
          status: order.status,
          statusText: Order.getStatusText(order.status),
          nextStatuses: Order.getNextStatuses(order.status),
          statusHistory: order.statusHistory
        }
      }
    });

  } catch (error) {
    await session.abortTransaction();
    console.error("Admin Update Order Status Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update order status",
      error: process.env.NODE_ENV === "development" ? error.message : undefined
    });
  } finally {
    session.endSession();
  }
};

/**
 * @desc    Update payment status (Admin)
 * @route   PUT /api/admin/orders/:id/payment
 * @access  Private/Admin
 */
exports.adminUpdatePaymentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { paymentStatus, amountPaid, method, notes } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order ID"
      });
    }

    if (!paymentStatus) {
      return res.status(400).json({
        success: false,
        message: "Payment status is required"
      });
    }

    const validStatuses = ["pending", "paid", "partial", "refunded"];
    if (!validStatuses.includes(paymentStatus)) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment status",
        validStatuses
      });
    }

    const order = await Order.findById(id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found"
      });
    }

    // Cannot update payment for cancelled orders
    if (order.status === "cancelled") {
      return res.status(400).json({
        success: false,
        message: "Cannot update payment for cancelled order"
      });
    }

    const previousPaymentStatus = order.paymentStatus;
    const previousAmountPaid = order.payment.amountPaid || 0;

    // Update payment details
    order.paymentStatus = paymentStatus;
    order.payment.amountPaid = amountPaid !== undefined ? amountPaid : order.totalAmount;
    order.payment.method = method || order.payment.method;
    order.payment.notes = notes || order.payment.notes;
    order.payment.markedPaidBy = req.user._id;

    if (paymentStatus === "paid") {
      order.payment.paidAt = new Date();
      order.payment.amountPaid = order.totalAmount;
    }

    await order.save();

    // Update user's pending and total credit amounts
    const user = await User.findById(order.user);
    if (user) {
      const amountDifference = (order.payment.amountPaid || 0) - previousAmountPaid;
      
      if (paymentStatus === "paid" && previousPaymentStatus !== "paid") {
        // Mark as fully paid - clear from pending, add to total credit
        user.pendingAmount = Math.max(0, user.pendingAmount - order.totalAmount);
        user.totalCredit += order.totalAmount;
      } else if (paymentStatus === "partial") {
        // Partial payment
        user.pendingAmount = Math.max(0, user.pendingAmount - amountDifference);
        user.totalCredit += amountDifference;
      }

      await user.save();
    }

    console.log(`💰 Payment updated: ${order.orderNumber} -> ${paymentStatus} by admin: ${req.user._id}`);

    res.status(200).json({
      success: true,
      message: `Payment status updated to "${paymentStatus}"`,
      data: {
        order: {
          _id: order._id,
          orderNumber: order.orderNumber,
          paymentStatus: order.paymentStatus,
          payment: order.payment,
          totalAmount: order.totalAmount,
          outstandingAmount: order.outstandingAmount
        }
      }
    });

  } catch (error) {
    console.error("Admin Update Payment Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update payment status",
      error: process.env.NODE_ENV === "development" ? error.message : undefined
    });
  }
};

/**
 * @desc    Add internal note to order (Admin)
 * @route   PUT /api/admin/orders/:id/notes
 * @access  Private/Admin
 */
exports.adminAddNote = async (req, res) => {
  try {
    const { id } = req.params;
    const { note } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order ID"
      });
    }

    if (!note) {
      return res.status(400).json({
        success: false,
        message: "Note is required"
      });
    }

    const order = await Order.findById(id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found"
      });
    }

    // Append note with timestamp
    const timestamp = new Date().toISOString();
    const newNote = `[${timestamp}] ${req.user.name}: ${note}`;
    
    order.internalNotes = order.internalNotes 
      ? `${order.internalNotes}\n${newNote}`
      : newNote;

    await order.save();

    res.status(200).json({
      success: true,
      message: "Note added successfully",
      data: {
        internalNotes: order.internalNotes
      }
    });

  } catch (error) {
    console.error("Admin Add Note Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to add note",
      error: process.env.NODE_ENV === "development" ? error.message : undefined
    });
  }
};

/**
 * @desc    Get order statistics (Admin)
 * @route   GET /api/admin/orders/stats
 * @access  Private/Admin
 */
exports.adminGetOrderStats = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const matchQuery = {};
    
    if (startDate || endDate) {
      matchQuery.createdAt = {};
      if (startDate) matchQuery.createdAt.$gte = new Date(startDate);
      if (endDate) matchQuery.createdAt.$lte = new Date(endDate);
    }

    const stats = await Order.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          totalRevenue: {
            $sum: {
              $cond: [
                { $eq: ["$status", "delivered"] },
                "$totalAmount",
                0
              ]
            }
          },
          pendingOrders: {
            $sum: { $cond: [{ $eq: ["$status", "pending"] }, 1, 0] }
          },
          confirmedOrders: {
            $sum: { $cond: [{ $eq: ["$status", "confirmed"] }, 1, 0] }
          },
          packedOrders: {
            $sum: { $cond: [{ $eq: ["$status", "packed"] }, 1, 0] }
          },
          shippedOrders: {
            $sum: { $cond: [{ $eq: ["$status", "shipped"] }, 1, 0] }
          },
          deliveredOrders: {
            $sum: { $cond: [{ $eq: ["$status", "delivered"] }, 1, 0] }
          },
          cancelledOrders: {
            $sum: { $cond: [{ $eq: ["$status", "cancelled"] }, 1, 0] }
          },
          pendingPaymentAmount: {
            $sum: {
              $cond: [
                { $and: [
                  { $ne: ["$status", "cancelled"] },
                  { $eq: ["$paymentStatus", "pending"] }
                ]},
                "$totalAmount",
                0
              ]
            }
          },
          paidAmount: {
            $sum: {
              $cond: [
                { $eq: ["$paymentStatus", "paid"] },
                "$totalAmount",
                0
              ]
            }
          }
        }
      }
    ]);

    // Status breakdown
    const statusBreakdown = await Order.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
          totalAmount: { $sum: "$totalAmount" }
        }
      }
    ]);

    // Recent orders
    const recentOrders = await Order.find(matchQuery)
      .select('orderNumber status totalAmount createdAt customerSnapshot.name')
      .sort({ createdAt: -1 })
      .limit(5);

    const defaultStats = {
      totalOrders: 0,
      totalRevenue: 0,
      pendingOrders: 0,
      confirmedOrders: 0,
      packedOrders: 0,
      shippedOrders: 0,
      deliveredOrders: 0,
      cancelledOrders: 0,
      pendingPaymentAmount: 0,
      paidAmount: 0
    };

    res.status(200).json({
      success: true,
      data: {
        stats: stats[0] || defaultStats,
        statusBreakdown,
        recentOrders
      }
    });

  } catch (error) {
    console.error("Admin Get Order Stats Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch order statistics",
      error: process.env.NODE_ENV === "development" ? error.message : undefined
    });
  }
};

/**
 * @desc    Get user's orders (Admin)
 * @route   GET /api/admin/users/:userId/orders
 * @access  Private/Admin
 */
exports.adminGetUserOrders = async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID"
      });
    }

    const orders = await Order.find({ user: userId })
      .select('-internalNotes -deliveryOtp')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Order.countDocuments({ user: userId });

    // Calculate user order summary
    const summary = await Order.aggregate([
      { $match: { user: new mongoose.Types.ObjectId(userId) } },
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          totalSpent: {
            $sum: {
              $cond: [{ $eq: ["$paymentStatus", "paid"] }, "$totalAmount", 0]
            }
          },
          pendingPayments: {
            $sum: {
              $cond: [
                { $and: [
                  { $ne: ["$status", "cancelled"] },
                  { $ne: ["$paymentStatus", "paid"] }
                ]},
                "$totalAmount",
                0
              ]
            }
          }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      data: {
        orders: orders.map(order => ({
          ...order.toObject(),
          statusText: Order.getStatusText(order.status)
        })),
        summary: summary[0] || { totalOrders: 0, totalSpent: 0, pendingPayments: 0 },
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / limit),
          total
        }
      }
    });

  } catch (error) {
    console.error("Admin Get User Orders Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch user orders",
      error: process.env.NODE_ENV === "development" ? error.message : undefined
    });
  }
};

/**
 * @desc    Generate delivery OTP (Admin)
 * @route   POST /api/admin/orders/:id/delivery-otp
 * @access  Private/Admin
 */
exports.adminGenerateDeliveryOtp = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order ID"
      });
    }

    const order = await Order.findById(id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found"
      });
    }

    // Only generate OTP for shipped/on_the_way orders
    if (!["shipped", "on_the_way"].includes(order.status)) {
      return res.status(400).json({
        success: false,
        message: "Delivery OTP can only be generated for shipped orders"
      });
    }

    // Generate 4-digit OTP
    const otp = Math.floor(1000 + Math.random() * 9000).toString();

    order.deliveryOtp = {
      code: otp,
      generatedAt: new Date(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      verified: false
    };

    await order.save();

    console.log(`🔐 Delivery OTP generated: ${order.orderNumber} -> ${otp}`);

    res.status(200).json({
      success: true,
      message: "Delivery OTP generated",
      data: {
        orderNumber: order.orderNumber,
        otp: otp,
        expiresAt: order.deliveryOtp.expiresAt
      }
    });

  } catch (error) {
    console.error("Generate Delivery OTP Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to generate delivery OTP",
      error: process.env.NODE_ENV === "development" ? error.message : undefined
    });
  }
};

/**
 * @desc    Verify delivery OTP and mark delivered (Admin/Delivery)
 * @route   POST /api/admin/orders/:id/verify-delivery
 * @access  Private/Admin
 */
exports.adminVerifyDeliveryOtp = async (req, res) => {
  try {
    const { id } = req.params;
    const { otp } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order ID"
      });
    }

    if (!otp) {
      return res.status(400).json({
        success: false,
        message: "OTP is required"
      });
    }

    const order = await Order.findById(id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found"
      });
    }

    if (!order.deliveryOtp || !order.deliveryOtp.code) {
      return res.status(400).json({
        success: false,
        message: "No delivery OTP generated for this order"
      });
    }

    if (order.deliveryOtp.verified) {
      return res.status(400).json({
        success: false,
        message: "Delivery OTP already verified"
      });
    }

    if (new Date() > order.deliveryOtp.expiresAt) {
      return res.status(400).json({
        success: false,
        message: "Delivery OTP has expired"
      });
    }

    if (order.deliveryOtp.code !== otp) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP"
      });
    }

    // Mark OTP as verified
    order.deliveryOtp.verified = true;
    order.deliveryOtp.verifiedAt = new Date();

    // Update order status to delivered
    order.status = "delivered";
    order.statusHistory.push({
      status: "delivered",
      timestamp: new Date(),
      updatedBy: req.user._id,
      note: "Delivery confirmed with OTP"
    });

    await order.save();

    console.log(`✅ Order delivered: ${order.orderNumber}`);

    res.status(200).json({
      success: true,
      message: "Delivery confirmed successfully",
      data: {
        orderNumber: order.orderNumber,
        status: order.status,
        deliveredAt: order.deliveredAt
      }
    });

  } catch (error) {
    console.error("Verify Delivery OTP Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to verify delivery",
      error: process.env.NODE_ENV === "development" ? error.message : undefined
    });
  }
};