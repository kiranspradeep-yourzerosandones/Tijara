const Payment = require("../models/Payment");
const Order = require("../models/Order");
const User = require("../models/User");
const mongoose = require("mongoose");

// ============================================================
// CUSTOMER PAYMENT VIEWS
// ============================================================

/**
 * @desc    Get my payment history
 * @route   GET /api/payments
 * @access  Private
 */
exports.getMyPayments = async (req, res) => {
  try {
    const {
      orderId,
      status,
      startDate,
      endDate,
      page = 1,
      limit = 20
    } = req.query;

    const query = { user: req.user._id };

    // Filter by order
    if (orderId) {
      if (mongoose.Types.ObjectId.isValid(orderId)) {
        query.order = orderId;
      }
    }

    // Filter by status
    if (status) {
      query.status = status;
    }

    // Filter by date range
    if (startDate || endDate) {
      query.paymentDate = {};
      if (startDate) query.paymentDate.$gte = new Date(startDate);
      if (endDate) query.paymentDate.$lte = new Date(endDate);
    }

    const payments = await Payment.find(query)
      .populate('order', 'orderNumber totalAmount status')
      .select('-internalNotes')
      .sort({ paymentDate: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Payment.countDocuments(query);

    res.status(200).json({
      success: true,
      data: {
        payments,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / limit),
          total
        }
      }
    });

  } catch (error) {
    console.error("Get Payments Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch payments",
      error: process.env.NODE_ENV === "development" ? error.message : undefined
    });
  }
};

/**
 * @desc    Get single payment details
 * @route   GET /api/payments/:id
 * @access  Private
 */
exports.getPayment = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment ID"
      });
    }

    const payment = await Payment.findOne({
      _id: id,
      user: req.user._id
    })
    .populate('order', 'orderNumber totalAmount status deliveryAddress')
    .select('-internalNotes');

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment not found"
      });
    }

    res.status(200).json({
      success: true,
      data: { payment }
    });

  } catch (error) {
    console.error("Get Payment Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch payment",
      error: process.env.NODE_ENV === "development" ? error.message : undefined
    });
  }
};

/**
 * @desc    Get my credit summary
 * @route   GET /api/payments/credit-summary
 * @access  Private
 */
exports.getMyCreditSummary = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    // Get payment summary
    const paymentSummary = await Payment.getUserPaymentSummary(req.user._id);

    // Get pending orders count
    const pendingOrdersCount = await Order.countDocuments({
      user: req.user._id,
      status: { $nin: ["delivered", "cancelled"] },
      paymentStatus: { $ne: "paid" }
    });

    // Get overdue orders (past payment terms)
    const overdueDate = new Date();
    overdueDate.setDate(overdueDate.getDate() - (user.paymentTerms || 30));

    const overdueOrders = await Order.find({
      user: req.user._id,
      status: { $ne: "cancelled" },
      paymentStatus: { $ne: "paid" },
      createdAt: { $lt: overdueDate }
    }).select('orderNumber totalAmount createdAt');

    const overdueAmount = overdueOrders.reduce((sum, order) => sum + order.totalAmount, 0);

    res.status(200).json({
      success: true,
      data: {
        creditSummary: user.getCreditSummary(),
        paymentSummary: {
          totalPayments: paymentSummary.totalPayments,
          totalAmountPaid: paymentSummary.totalAmountPaid,
          lastPaymentDate: paymentSummary.lastPaymentDate
        },
        pendingOrdersCount,
        overdueOrders: overdueOrders.length,
        overdueAmount
      }
    });

  } catch (error) {
    console.error("Get Credit Summary Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch credit summary",
      error: process.env.NODE_ENV === "development" ? error.message : undefined
    });
  }
};

/**
 * @desc    Get payments for specific order
 * @route   GET /api/payments/order/:orderId
 * @access  Private
 */
exports.getOrderPayments = async (req, res) => {
  try {
    const { orderId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order ID"
      });
    }

    // Verify order belongs to user
    const order = await Order.findOne({
      _id: orderId,
      user: req.user._id
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found"
      });
    }

    const { payments, totalPaid } = await Payment.getOrderPayments(orderId);

    res.status(200).json({
      success: true,
      data: {
        order: {
          _id: order._id,
          orderNumber: order.orderNumber,
          totalAmount: order.totalAmount,
          paymentStatus: order.paymentStatus
        },
        payments,
        totalPaid,
        outstanding: order.totalAmount - totalPaid
      }
    });

  } catch (error) {
    console.error("Get Order Payments Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch order payments",
      error: process.env.NODE_ENV === "development" ? error.message : undefined
    });
  }
};

/**
 * @desc    Get outstanding/pending payments
 * @route   GET /api/payments/outstanding
 * @access  Private
 */
exports.getOutstandingPayments = async (req, res) => {
  try {
    // Get all orders with pending payments
    const orders = await Order.find({
      user: req.user._id,
      status: { $ne: "cancelled" },
      paymentStatus: { $ne: "paid" }
    })
    .select('orderNumber totalAmount paymentStatus payment createdAt deliveryAddress.shopName')
    .sort({ createdAt: 1 }); // Oldest first

    // Calculate due dates based on payment terms
    const user = await User.findById(req.user._id);
    const paymentTerms = user.paymentTerms || 30;

    const outstandingOrders = orders.map(order => {
      const dueDate = new Date(order.createdAt);
      dueDate.setDate(dueDate.getDate() + paymentTerms);
      
      const isOverdue = new Date() > dueDate;
      const daysOverdue = isOverdue 
        ? Math.floor((new Date() - dueDate) / (1000 * 60 * 60 * 24))
        : 0;

      return {
        _id: order._id,
        orderNumber: order.orderNumber,
        totalAmount: order.totalAmount,
        amountPaid: order.payment?.amountPaid || 0,
        outstanding: order.totalAmount - (order.payment?.amountPaid || 0),
        shopName: order.deliveryAddress?.shopName,
        orderDate: order.createdAt,
        dueDate,
        isOverdue,
        daysOverdue
      };
    });

    // Calculate totals
    const totalOutstanding = outstandingOrders.reduce((sum, o) => sum + o.outstanding, 0);
    const totalOverdue = outstandingOrders
      .filter(o => o.isOverdue)
      .reduce((sum, o) => sum + o.outstanding, 0);

    res.status(200).json({
      success: true,
      data: {
        orders: outstandingOrders,
        summary: {
          totalOrders: outstandingOrders.length,
          totalOutstanding,
          overdueOrders: outstandingOrders.filter(o => o.isOverdue).length,
          totalOverdue
        }
      }
    });

  } catch (error) {
    console.error("Get Outstanding Payments Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch outstanding payments",
      error: process.env.NODE_ENV === "development" ? error.message : undefined
    });
  }
};

// ============================================================
// ADMIN PAYMENT OPERATIONS
// ============================================================

/**
 * @desc    Record a payment (Admin)
 * @route   POST /api/admin/payments
 * @access  Private/Admin
 */
exports.adminRecordPayment = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const {
      orderId,
      amount,
      method,
      methodDetails,
      paymentDate,
      notes,
      internalNotes,
      receiptNumber
    } = req.body;

    // Validate required fields
    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: "Order ID is required"
      });
    }

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Valid amount is required"
      });
    }

    if (!method) {
      return res.status(400).json({
        success: false,
        message: "Payment method is required"
      });
    }

    // Validate order ID
    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order ID"
      });
    }

    // Find order
    const order = await Order.findById(orderId).session(session);

    if (!order) {
      await session.abortTransaction();
      return res.status(404).json({
        success: false,
        message: "Order not found"
      });
    }

    // Cannot record payment for cancelled orders
    if (order.status === "cancelled") {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: "Cannot record payment for cancelled order"
      });
    }

    // Calculate outstanding
    const currentPaid = order.payment?.amountPaid || 0;
    const outstanding = order.totalAmount - currentPaid;

    if (amount > outstanding) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: `Payment amount (₹${amount}) exceeds outstanding amount (₹${outstanding})`
      });
    }

    // Generate payment number
    const paymentNumber = await Payment.generatePaymentNumber();

    // Create payment record
    const payment = new Payment({
      order: order._id,
      user: order.user,
      paymentNumber,
      orderNumber: order.orderNumber,
      amount,
      method,
      methodDetails,
      paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
      notes,
      internalNotes,
      receiptNumber,
      recordedBy: req.user._id,
      status: "completed"
    });

    await payment.save({ session });

    // Update order payment info
    const newAmountPaid = currentPaid + amount;
    order.payment.amountPaid = newAmountPaid;
    order.payment.method = method;
    
    if (newAmountPaid >= order.totalAmount) {
      order.paymentStatus = "paid";
      order.payment.paidAt = new Date();
    } else {
      order.paymentStatus = "partial";
    }
    
    order.payment.markedPaidBy = req.user._id;
    order.payment.notes = notes;

    await order.save({ session });

    // Update user credit info
    const user = await User.findById(order.user).session(session);
    if (user) {
      user.pendingAmount = Math.max(0, user.pendingAmount - amount);
      user.totalPaid += amount;
      user.lastPaymentDate = payment.paymentDate;
      await user.save({ session });
    }

    await session.commitTransaction();

    console.log(`💰 Payment recorded: ${paymentNumber} - ₹${amount} for order ${order.orderNumber}`);

    // Populate for response
    await payment.populate('order', 'orderNumber totalAmount paymentStatus');
    await payment.populate('user', 'name phone businessName');
    await payment.populate('recordedBy', 'name');

    res.status(201).json({
      success: true,
      message: "Payment recorded successfully",
      data: {
        payment,
        orderPaymentStatus: order.paymentStatus,
        orderOutstanding: order.totalAmount - newAmountPaid
      }
    });

  } catch (error) {
    await session.abortTransaction();
    console.error("Record Payment Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to record payment",
      error: process.env.NODE_ENV === "development" ? error.message : undefined
    });
  } finally {
    session.endSession();
  }
};

/**
 * @desc    Get all payments (Admin)
 * @route   GET /api/admin/payments
 * @access  Private/Admin
 */
exports.adminGetAllPayments = async (req, res) => {
  try {
    const {
      userId,
      orderId,
      method,
      status,
      startDate,
      endDate,
      search,
      page = 1,
      limit = 20,
      sortBy = "paymentDate",
      sortOrder = "desc"
    } = req.query;

    const query = {};

    // Filter by user
    if (userId && mongoose.Types.ObjectId.isValid(userId)) {
      query.user = userId;
    }

    // Filter by order
    if (orderId && mongoose.Types.ObjectId.isValid(orderId)) {
      query.order = orderId;
    }

    // Filter by method
    if (method) {
      query.method = method;
    }

    // Filter by status
    if (status) {
      query.status = status;
    }

    // Filter by date range
    if (startDate || endDate) {
      query.paymentDate = {};
      if (startDate) query.paymentDate.$gte = new Date(startDate);
      if (endDate) query.paymentDate.$lte = new Date(endDate);
    }

    // Search by payment number or order number
    if (search) {
      query.$or = [
        { paymentNumber: { $regex: search, $options: "i" } },
        { orderNumber: { $regex: search, $options: "i" } }
      ];
    }

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === "asc" ? 1 : -1;

    const payments = await Payment.find(query)
      .populate('user', 'name phone businessName')
      .populate('order', 'orderNumber totalAmount status')
      .populate('recordedBy', 'name')
      .sort(sortOptions)
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Payment.countDocuments(query);

    // Calculate totals for filtered results
    const totalAmount = await Payment.aggregate([
      { $match: { ...query, status: "completed" } },
      { $group: { _id: null, total: { $sum: "$amount" } } }
    ]);

    res.status(200).json({
      success: true,
      data: {
        payments,
        totalAmount: totalAmount[0]?.total || 0,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / limit),
          total
        }
      }
    });

  } catch (error) {
    console.error("Admin Get Payments Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch payments",
      error: process.env.NODE_ENV === "development" ? error.message : undefined
    });
  }
};

/**
 * @desc    Get single payment (Admin)
 * @route   GET /api/admin/payments/:id
 * @access  Private/Admin
 */
exports.adminGetPayment = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment ID"
      });
    }

    const payment = await Payment.findById(id)
      .populate('user', 'name phone businessName email')
      .populate('order', 'orderNumber totalAmount status paymentStatus deliveryAddress')
      .populate('recordedBy', 'name')
      .populate('verifiedBy', 'name');

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment not found"
      });
    }

    res.status(200).json({
      success: true,
      data: { payment }
    });

  } catch (error) {
    console.error("Admin Get Payment Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch payment",
      error: process.env.NODE_ENV === "development" ? error.message : undefined
    });
  }
};

/**
 * @desc    Update payment (Admin)
 * @route   PUT /api/admin/payments/:id
 * @access  Private/Admin
 */
exports.adminUpdatePayment = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      method,
      methodDetails,
      paymentDate,
      notes,
      internalNotes,
      receiptNumber,
      isVerified
    } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment ID"
      });
    }

    const payment = await Payment.findById(id);

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment not found"
      });
    }

    // Cannot update cancelled/refunded payments
    if (["cancelled", "refunded"].includes(payment.status)) {
      return res.status(400).json({
        success: false,
        message: "Cannot update cancelled or refunded payment"
      });
    }

    // Update fields
    if (method) payment.method = method;
    if (methodDetails) payment.methodDetails = { ...payment.methodDetails, ...methodDetails };
    if (paymentDate) payment.paymentDate = new Date(paymentDate);
    if (notes !== undefined) payment.notes = notes;
    if (internalNotes !== undefined) payment.internalNotes = internalNotes;
    if (receiptNumber !== undefined) payment.receiptNumber = receiptNumber;

    // Handle verification
    if (isVerified !== undefined) {
      payment.isVerified = isVerified;
      if (isVerified) {
        payment.verifiedBy = req.user._id;
        payment.verifiedAt = new Date();
      }
    }

    await payment.save();

    await payment.populate('user', 'name phone businessName');
    await payment.populate('order', 'orderNumber totalAmount');
    await payment.populate('recordedBy', 'name');

    res.status(200).json({
      success: true,
      message: "Payment updated successfully",
      data: { payment }
    });

  } catch (error) {
    console.error("Admin Update Payment Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update payment",
      error: process.env.NODE_ENV === "development" ? error.message : undefined
    });
  }
};

/**
 * @desc    Cancel/Reverse payment (Admin)
 * @route   PUT /api/admin/payments/:id/cancel
 * @access  Private/Admin
 */
exports.adminCancelPayment = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { id } = req.params;
    const { reason } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment ID"
      });
    }

    if (!reason) {
      return res.status(400).json({
        success: false,
        message: "Cancellation reason is required"
      });
    }

    const payment = await Payment.findById(id).session(session);

    if (!payment) {
      await session.abortTransaction();
      return res.status(404).json({
        success: false,
        message: "Payment not found"
      });
    }

    if (payment.status !== "completed") {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: "Only completed payments can be cancelled"
      });
    }

    // Update payment status
    payment.status = "cancelled";
    payment.internalNotes = payment.internalNotes 
      ? `${payment.internalNotes}\n[CANCELLED] ${new Date().toISOString()}: ${reason}`
      : `[CANCELLED] ${new Date().toISOString()}: ${reason}`;

    await payment.save({ session });

    // Reverse order payment
    const order = await Order.findById(payment.order).session(session);
    if (order) {
      order.payment.amountPaid = Math.max(0, (order.payment.amountPaid || 0) - payment.amount);
      
      if (order.payment.amountPaid === 0) {
        order.paymentStatus = "pending";
      } else if (order.payment.amountPaid < order.totalAmount) {
        order.paymentStatus = "partial";
      }

      await order.save({ session });
    }

    // Reverse user credit
    const user = await User.findById(payment.user).session(session);
    if (user) {
      user.pendingAmount += payment.amount;
      user.totalPaid = Math.max(0, user.totalPaid - payment.amount);
      await user.save({ session });
    }

    await session.commitTransaction();

    console.log(`💰 Payment cancelled: ${payment.paymentNumber}`);

    res.status(200).json({
      success: true,
      message: "Payment cancelled successfully",
      data: {
        payment: {
          _id: payment._id,
          paymentNumber: payment.paymentNumber,
          status: payment.status
        }
      }
    });

  } catch (error) {
    await session.abortTransaction();
    console.error("Cancel Payment Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to cancel payment",
      error: process.env.NODE_ENV === "development" ? error.message : undefined
    });
  } finally {
    session.endSession();
  }
};

/**
 * @desc    Get payment statistics (Admin)
 * @route   GET /api/admin/payments/stats
 * @access  Private/Admin
 */
exports.adminGetPaymentStats = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const matchQuery = { status: "completed" };
    
    if (startDate || endDate) {
      matchQuery.paymentDate = {};
      if (startDate) matchQuery.paymentDate.$gte = new Date(startDate);
      if (endDate) matchQuery.paymentDate.$lte = new Date(endDate);
    }

    // Overall stats
    const stats = await Payment.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: null,
          totalPayments: { $sum: 1 },
          totalAmount: { $sum: "$amount" },
          avgPaymentAmount: { $avg: "$amount" }
        }
      }
    ]);

    // By method
    const byMethod = await Payment.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: "$method",
          count: { $sum: 1 },
          totalAmount: { $sum: "$amount" }
        }
      },
      { $sort: { totalAmount: -1 } }
    ]);

    // Daily trend (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const dailyTrend = await Payment.aggregate([
      {
        $match: {
          status: "completed",
          paymentDate: { $gte: thirtyDaysAgo }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$paymentDate" }
          },
          count: { $sum: 1 },
          totalAmount: { $sum: "$amount" }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Top customers by payment
    const topCustomers = await Payment.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: "$user",
          totalPayments: { $sum: 1 },
          totalAmount: { $sum: "$amount" }
        }
      },
      { $sort: { totalAmount: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "user"
        }
      },
      { $unwind: "$user" },
      {
        $project: {
          _id: 1,
          totalPayments: 1,
          totalAmount: 1,
          userName: "$user.name",
          userPhone: "$user.phone",
          businessName: "$user.businessName"
        }
      }
    ]);

    // Recent payments
    const recentPayments = await Payment.find({ status: "completed" })
      .populate('user', 'name businessName')
      .select('paymentNumber amount method paymentDate')
      .sort({ paymentDate: -1 })
      .limit(5);

    res.status(200).json({
      success: true,
      data: {
        stats: stats[0] || { totalPayments: 0, totalAmount: 0, avgPaymentAmount: 0 },
        byMethod,
        dailyTrend,
        topCustomers,
        recentPayments
      }
    });

  } catch (error) {
    console.error("Admin Get Payment Stats Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch payment statistics",
      error: process.env.NODE_ENV === "development" ? error.message : undefined
    });
  }
};

/**
 * @desc    Get user's payment history (Admin)
 * @route   GET /api/admin/users/:userId/payments
 * @access  Private/Admin
 */
exports.adminGetUserPayments = async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 20 } = req.query;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID"
      });
    }

    const payments = await Payment.find({ user: userId })
      .populate('order', 'orderNumber totalAmount')
      .populate('recordedBy', 'name')
      .sort({ paymentDate: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Payment.countDocuments({ user: userId });
    const summary = await Payment.getUserPaymentSummary(userId);

    // Get user credit info
    const user = await User.findById(userId).select('name phone businessName creditLimit pendingAmount totalPaid');

    res.status(200).json({
      success: true,
      data: {
        user: user ? {
          _id: user._id,
          name: user.name,
          phone: user.phone,
          businessName: user.businessName,
          creditLimit: user.creditLimit,
          pendingAmount: user.pendingAmount,
          totalPaid: user.totalPaid
        } : null,
        payments,
        summary,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / limit),
          total
        }
      }
    });

  } catch (error) {
    console.error("Admin Get User Payments Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch user payments",
      error: process.env.NODE_ENV === "development" ? error.message : undefined
    });
  }
};

/**
 * @desc    Update user credit limit (Admin)
 * @route   PUT /api/admin/users/:userId/credit-limit
 * @access  Private/Admin
 */
exports.adminUpdateCreditLimit = async (req, res) => {
  try {
    const { userId } = req.params;
    const { creditLimit, paymentTerms } = req.body;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID"
      });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    if (creditLimit !== undefined) {
      if (creditLimit < 0) {
        return res.status(400).json({
          success: false,
          message: "Credit limit cannot be negative"
        });
      }
      user.creditLimit = creditLimit;
    }

    if (paymentTerms !== undefined) {
      if (paymentTerms < 0 || paymentTerms > 365) {
        return res.status(400).json({
          success: false,
          message: "Payment terms must be between 0 and 365 days"
        });
      }
      user.paymentTerms = paymentTerms;
    }

    await user.save();

    console.log(`💳 Credit limit updated for user ${user.phone}: ₹${user.creditLimit}`);

    res.status(200).json({
      success: true,
      message: "Credit settings updated successfully",
      data: {
        user: {
          _id: user._id,
          name: user.name,
          phone: user.phone,
          creditLimit: user.creditLimit,
          paymentTerms: user.paymentTerms,
          pendingAmount: user.pendingAmount,
          availableCredit: user.availableCredit
        }
      }
    });

  } catch (error) {
    console.error("Update Credit Limit Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update credit limit",
      error: process.env.NODE_ENV === "development" ? error.message : undefined
    });
  }
};

/**
 * @desc    Block/Unblock user credit (Admin)
 * @route   PUT /api/admin/users/:userId/credit-block
 * @access  Private/Admin
 */
exports.adminToggleCreditBlock = async (req, res) => {
  try {
    const { userId } = req.params;
    const { block, reason } = req.body;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID"
      });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    if (block) {
      if (!reason) {
        return res.status(400).json({
          success: false,
          message: "Reason is required when blocking credit"
        });
      }
      user.isCreditBlocked = true;
      user.creditBlockedReason = reason;
      user.creditBlockedAt = new Date();
      user.creditBlockedBy = req.user._id;
    } else {
      user.isCreditBlocked = false;
      user.creditBlockedReason = null;
      user.creditBlockedAt = null;
      user.creditBlockedBy = null;
    }

    await user.save();

    console.log(`💳 Credit ${block ? 'blocked' : 'unblocked'} for user ${user.phone}`);

    res.status(200).json({
      success: true,
      message: `Credit ${block ? 'blocked' : 'unblocked'} successfully`,
      data: {
        user: {
          _id: user._id,
          name: user.name,
          phone: user.phone,
          isCreditBlocked: user.isCreditBlocked,
          creditBlockedReason: user.creditBlockedReason
        }
      }
    });

  } catch (error) {
    console.error("Toggle Credit Block Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update credit block status",
      error: process.env.NODE_ENV === "development" ? error.message : undefined
    });
  }
};

/**
 * @desc    Get overdue payments report (Admin)
 * @route   GET /api/admin/payments/overdue
 * @access  Private/Admin
 */
exports.adminGetOverdueReport = async (req, res) => {
  try {
    const { daysOverdue = 0 } = req.query;

    // Get all users with their payment terms
    const users = await User.find({ role: "customer" })
      .select('_id name phone businessName paymentTerms pendingAmount');

    const overdueOrders = [];

    for (const user of users) {
      const paymentTerms = user.paymentTerms || 30;
      const overdueDate = new Date();
      overdueDate.setDate(overdueDate.getDate() - paymentTerms - parseInt(daysOverdue));

      const orders = await Order.find({
        user: user._id,
        status: { $ne: "cancelled" },
        paymentStatus: { $ne: "paid" },
        createdAt: { $lt: overdueDate }
      }).select('orderNumber totalAmount payment createdAt');

      for (const order of orders) {
        const dueDate = new Date(order.createdAt);
        dueDate.setDate(dueDate.getDate() + paymentTerms);
        const daysOverdueCalc = Math.floor((new Date() - dueDate) / (1000 * 60 * 60 * 24));

        overdueOrders.push({
          user: {
            _id: user._id,
            name: user.name,
            phone: user.phone,
            businessName: user.businessName
          },
          order: {
            _id: order._id,
            orderNumber: order.orderNumber,
            totalAmount: order.totalAmount,
            amountPaid: order.payment?.amountPaid || 0,
            outstanding: order.totalAmount - (order.payment?.amountPaid || 0)
          },
          orderDate: order.createdAt,
          dueDate,
          daysOverdue: daysOverdueCalc
        });
      }
    }

    // Sort by days overdue (most overdue first)
    overdueOrders.sort((a, b) => b.daysOverdue - a.daysOverdue);

    // Calculate summary
    const totalOverdueAmount = overdueOrders.reduce((sum, o) => sum + o.order.outstanding, 0);
    const uniqueCustomers = [...new Set(overdueOrders.map(o => o.user._id.toString()))].length;

    res.status(200).json({
      success: true,
      data: {
        overdueOrders,
        summary: {
          totalOrders: overdueOrders.length,
          totalOverdueAmount,
          uniqueCustomers,
          avgDaysOverdue: overdueOrders.length > 0 
            ? Math.round(overdueOrders.reduce((sum, o) => sum + o.daysOverdue, 0) / overdueOrders.length)
            : 0
        }
      }
    });

  } catch (error) {
    console.error("Get Overdue Report Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch overdue report",
      error: process.env.NODE_ENV === "development" ? error.message : undefined
    });
  }
};