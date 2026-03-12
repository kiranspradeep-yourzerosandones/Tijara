const Order = require("../models/Order");
const User = require("../models/User");
const Product = require("../models/Product");
const Payment = require("../models/Payment");
const Notification = require("../models/Notification");
const Location = require("../models/Location");
const Cart = require("../models/Cart");
const mongoose = require("mongoose");

// ============================================================
// MAIN DASHBOARD
// ============================================================

/**
 * @desc    Get dashboard overview statistics
 * @route   GET /api/admin/dashboard
 * @access  Private/Admin
 */
exports.getDashboardOverview = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const thisMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);

    // Parallel queries for performance
    const [
      // Order stats
      totalOrders,
      todayOrders,
      thisMonthOrders,
      pendingOrders,
      
      // Revenue stats
      totalRevenue,
      todayRevenue,
      thisMonthRevenue,
      lastMonthRevenue,
      
      // Customer stats
      totalCustomers,
      newCustomersToday,
      newCustomersThisMonth,
      activeCustomers,
      
      // Product stats
      totalProducts,
      activeProducts,
      lowStockProducts,
      
      // Payment stats
      pendingPaymentsAmount,
      todayPayments,
      
      // Other stats
      totalLocations
    ] = await Promise.all([
      // Orders
      Order.countDocuments({ status: { $ne: "cancelled" } }),
      Order.countDocuments({ createdAt: { $gte: today }, status: { $ne: "cancelled" } }),
      Order.countDocuments({ createdAt: { $gte: thisMonthStart }, status: { $ne: "cancelled" } }),
      Order.countDocuments({ status: "pending" }),
      
      // Revenue
      Order.aggregate([
        { $match: { status: "delivered" } },
        { $group: { _id: null, total: { $sum: "$totalAmount" } } }
      ]),
      Order.aggregate([
        { $match: { status: "delivered", deliveredAt: { $gte: today } } },
        { $group: { _id: null, total: { $sum: "$totalAmount" } } }
      ]),
      Order.aggregate([
        { $match: { status: "delivered", deliveredAt: { $gte: thisMonthStart } } },
        { $group: { _id: null, total: { $sum: "$totalAmount" } } }
      ]),
      Order.aggregate([
        { $match: { status: "delivered", deliveredAt: { $gte: lastMonthStart, $lte: lastMonthEnd } } },
        { $group: { _id: null, total: { $sum: "$totalAmount" } } }
      ]),
      
      // Customers
      User.countDocuments({ role: "customer" }),
      User.countDocuments({ role: "customer", createdAt: { $gte: today } }),
      User.countDocuments({ role: "customer", createdAt: { $gte: thisMonthStart } }),
      User.countDocuments({ role: "customer", isActive: true, lastLoginAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } }),
      
      // Products
      Product.countDocuments(),
      Product.countDocuments({ isActive: true, inStock: true }),
      Product.countDocuments({ inStock: false }),
      
      // Payments
      User.aggregate([
        { $match: { role: "customer", pendingAmount: { $gt: 0 } } },
        { $group: { _id: null, total: { $sum: "$pendingAmount" } } }
      ]),
      Payment.aggregate([
        { $match: { status: "completed", paymentDate: { $gte: today } } },
        { $group: { _id: null, total: { $sum: "$amount" } } }
      ]),
      
      // Locations
      Location.countDocuments({ isActive: true })
    ]);

    // Calculate growth percentages
    const thisMonthRevenueVal = thisMonthRevenue[0]?.total || 0;
    const lastMonthRevenueVal = lastMonthRevenue[0]?.total || 0;
    const revenueGrowth = lastMonthRevenueVal > 0 
      ? Math.round(((thisMonthRevenueVal - lastMonthRevenueVal) / lastMonthRevenueVal) * 100)
      : 0;

    res.status(200).json({
      success: true,
      data: {
        overview: {
          orders: {
            total: totalOrders,
            today: todayOrders,
            thisMonth: thisMonthOrders,
            pending: pendingOrders
          },
          revenue: {
            total: totalRevenue[0]?.total || 0,
            today: todayRevenue[0]?.total || 0,
            thisMonth: thisMonthRevenueVal,
            lastMonth: lastMonthRevenueVal,
            growth: revenueGrowth
          },
          customers: {
            total: totalCustomers,
            newToday: newCustomersToday,
            newThisMonth: newCustomersThisMonth,
            active: activeCustomers
          },
          products: {
            total: totalProducts,
            active: activeProducts,
            outOfStock: lowStockProducts
          },
          payments: {
            pendingAmount: pendingPaymentsAmount[0]?.total || 0,
            receivedToday: todayPayments[0]?.total || 0
          },
          locations: totalLocations
        },
        generatedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error("Dashboard Overview Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch dashboard data",
      error: process.env.NODE_ENV === "development" ? error.message : undefined
    });
  }
};

/**
 * @desc    Get recent activities
 * @route   GET /api/admin/dashboard/activities
 * @access  Private/Admin
 */
exports.getRecentActivities = async (req, res) => {
  try {
    const { limit = 20 } = req.query;

    // Get recent orders
    const recentOrders = await Order.find()
      .select('orderNumber status totalAmount customerSnapshot.name createdAt')
      .sort({ createdAt: -1 })
      .limit(5);

    // Get recent payments
    const recentPayments = await Payment.find({ status: "completed" })
      .populate('user', 'name phone')
      .select('paymentNumber amount method paymentDate')
      .sort({ paymentDate: -1 })
      .limit(5);

    // Get recent customers
    const recentCustomers = await User.find({ role: "customer" })
      .select('name phone businessName createdAt')
      .sort({ createdAt: -1 })
      .limit(5);

    // Get recent notifications
    const recentNotifications = await Notification.find({ status: "sent" })
      .select('title type stats.totalRecipients createdAt')
      .sort({ createdAt: -1 })
      .limit(5);

    // Combine and sort all activities
    const activities = [];

    recentOrders.forEach(order => {
      activities.push({
        type: "order",
        title: `New order ${order.orderNumber}`,
        description: `${order.customerSnapshot.name} placed an order of ₹${order.totalAmount.toLocaleString('en-IN')}`,
        status: order.status,
        timestamp: order.createdAt,
        data: { orderId: order._id, orderNumber: order.orderNumber }
      });
    });

    recentPayments.forEach(payment => {
      activities.push({
        type: "payment",
        title: `Payment received`,
        description: `₹${payment.amount.toLocaleString('en-IN')} received from ${payment.user?.name || 'Customer'} via ${payment.method}`,
        timestamp: payment.paymentDate,
        data: { paymentId: payment._id, paymentNumber: payment.paymentNumber }
      });
    });

    recentCustomers.forEach(customer => {
      activities.push({
        type: "customer",
        title: `New customer registered`,
        description: `${customer.name}${customer.businessName ? ` (${customer.businessName})` : ''} joined`,
        timestamp: customer.createdAt,
        data: { userId: customer._id }
      });
    });

    // Sort by timestamp
    activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    res.status(200).json({
      success: true,
      data: {
        activities: activities.slice(0, parseInt(limit))
      }
    });

  } catch (error) {
    console.error("Recent Activities Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch recent activities",
      error: process.env.NODE_ENV === "development" ? error.message : undefined
    });
  }
};

// ============================================================
// ORDER ANALYTICS
// ============================================================

/**
 * @desc    Get order analytics
 * @route   GET /api/admin/dashboard/orders/analytics
 * @access  Private/Admin
 */
exports.getOrderAnalytics = async (req, res) => {
  try {
    const { period = "30days" } = req.query;

    // Calculate date range
    let startDate = new Date();
    switch (period) {
      case "7days":
        startDate.setDate(startDate.getDate() - 7);
        break;
      case "30days":
        startDate.setDate(startDate.getDate() - 30);
        break;
      case "90days":
        startDate.setDate(startDate.getDate() - 90);
        break;
      case "year":
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
      default:
        startDate.setDate(startDate.getDate() - 30);
    }

    // Orders by status
    const ordersByStatus = await Order.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
          totalAmount: { $sum: "$totalAmount" }
        }
      }
    ]);

    // Daily orders trend
    const dailyOrders = await Order.aggregate([
      { $match: { createdAt: { $gte: startDate }, status: { $ne: "cancelled" } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          count: { $sum: 1 },
          revenue: { $sum: "$totalAmount" }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Orders by city
    const ordersByCity = await Order.aggregate([
      { $match: { createdAt: { $gte: startDate }, status: { $ne: "cancelled" } } },
      {
        $group: {
          _id: "$deliveryAddress.city",
          count: { $sum: 1 },
          totalAmount: { $sum: "$totalAmount" }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    // Average order value
    const avgOrderValue = await Order.aggregate([
      { $match: { createdAt: { $gte: startDate }, status: { $ne: "cancelled" } } },
      {
        $group: {
          _id: null,
          avgValue: { $avg: "$totalAmount" },
          minValue: { $min: "$totalAmount" },
          maxValue: { $max: "$totalAmount" }
        }
      }
    ]);

    // Top products ordered
    const topProducts = await Order.aggregate([
      { $match: { createdAt: { $gte: startDate }, status: { $ne: "cancelled" } } },
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.product",
          productTitle: { $first: "$items.productSnapshot.title" },
          totalQuantity: { $sum: "$items.quantity" },
          totalRevenue: { $sum: "$items.subtotal" },
          orderCount: { $sum: 1 }
        }
      },
      { $sort: { totalRevenue: -1 } },
      { $limit: 10 }
    ]);

    res.status(200).json({
      success: true,
      data: {
        period,
        startDate,
        ordersByStatus,
        dailyOrders,
        ordersByCity,
        averageOrder: avgOrderValue[0] || { avgValue: 0, minValue: 0, maxValue: 0 },
        topProducts
      }
    });

  } catch (error) {
    console.error("Order Analytics Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch order analytics",
      error: process.env.NODE_ENV === "development" ? error.message : undefined
    });
  }
};

// ============================================================
// REVENUE ANALYTICS
// ============================================================

/**
 * @desc    Get revenue analytics
 * @route   GET /api/admin/dashboard/revenue/analytics
 * @access  Private/Admin
 */
exports.getRevenueAnalytics = async (req, res) => {
  try {
    const { period = "30days" } = req.query;

    let startDate = new Date();
    switch (period) {
      case "7days":
        startDate.setDate(startDate.getDate() - 7);
        break;
      case "30days":
        startDate.setDate(startDate.getDate() - 30);
        break;
      case "90days":
        startDate.setDate(startDate.getDate() - 90);
        break;
      case "year":
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
      default:
        startDate.setDate(startDate.getDate() - 30);
    }

    // Daily revenue
    const dailyRevenue = await Order.aggregate([
      { $match: { status: "delivered", deliveredAt: { $gte: startDate } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$deliveredAt" } },
          revenue: { $sum: "$totalAmount" },
          orders: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Monthly revenue (for year view)
    const monthlyRevenue = await Order.aggregate([
      { $match: { status: "delivered", deliveredAt: { $gte: new Date(new Date().getFullYear(), 0, 1) } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m", date: "$deliveredAt" } },
          revenue: { $sum: "$totalAmount" },
          orders: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Revenue by payment method
    const revenueByPaymentMethod = await Payment.aggregate([
      { $match: { status: "completed", paymentDate: { $gte: startDate } } },
      {
        $group: {
          _id: "$method",
          total: { $sum: "$amount" },
          count: { $sum: 1 }
        }
      },
      { $sort: { total: -1 } }
    ]);

    // Top customers by revenue
    const topCustomers = await Order.aggregate([
      { $match: { status: "delivered", deliveredAt: { $gte: startDate } } },
      {
        $group: {
          _id: "$user",
          customerName: { $first: "$customerSnapshot.name" },
          businessName: { $first: "$customerSnapshot.businessName" },
          totalRevenue: { $sum: "$totalAmount" },
          orderCount: { $sum: 1 }
        }
      },
      { $sort: { totalRevenue: -1 } },
      { $limit: 10 }
    ]);

    // Total revenue summary
    const totalRevenue = dailyRevenue.reduce((sum, day) => sum + day.revenue, 0);
    const totalOrders = dailyRevenue.reduce((sum, day) => sum + day.orders, 0);

    res.status(200).json({
      success: true,
      data: {
        period,
        startDate,
        summary: {
          totalRevenue,
          totalOrders,
          averageOrderValue: totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0
        },
        dailyRevenue,
        monthlyRevenue,
        revenueByPaymentMethod,
        topCustomers
      }
    });

  } catch (error) {
    console.error("Revenue Analytics Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch revenue analytics",
      error: process.env.NODE_ENV === "development" ? error.message : undefined
    });
  }
};

// ============================================================
// CUSTOMER ANALYTICS
// ============================================================

/**
 * @desc    Get customer analytics
 * @route   GET /api/admin/dashboard/customers/analytics
 * @access  Private/Admin
 */
exports.getCustomerAnalytics = async (req, res) => {
  try {
    const { period = "30days" } = req.query;

    let startDate = new Date();
    switch (period) {
      case "7days":
        startDate.setDate(startDate.getDate() - 7);
        break;
      case "30days":
        startDate.setDate(startDate.getDate() - 30);
        break;
      case "90days":
        startDate.setDate(startDate.getDate() - 90);
        break;
      default:
        startDate.setDate(startDate.getDate() - 30);
    }

    // New customers trend
    const newCustomersTrend = await User.aggregate([
      { $match: { role: "customer", createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Customer segments
    const customerSegments = {
      active: await User.countDocuments({
        role: "customer",
        lastLoginAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
      }),
      inactive: await User.countDocuments({
        role: "customer",
        $or: [
          { lastLoginAt: { $lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } },
          { lastLoginAt: null }
        ]
      }),
      withPendingPayment: await User.countDocuments({
        role: "customer",
        pendingAmount: { $gt: 0 }
      }),
      blockedCredit: await User.countDocuments({
        role: "customer",
        isCreditBlocked: true
      })
    };

    // Customers by business type
    const customersByBusinessType = await User.aggregate([
      { $match: { role: "customer", businessType: { $exists: true, $ne: null } } },
      {
        $group: {
          _id: "$businessType",
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    // Top customers by orders
    const topOrderingCustomers = await Order.aggregate([
      { $match: { status: { $ne: "cancelled" } } },
      {
        $group: {
          _id: "$user",
          customerName: { $first: "$customerSnapshot.name" },
          businessName: { $first: "$customerSnapshot.businessName" },
          phone: { $first: "$customerSnapshot.phone" },
          orderCount: { $sum: 1 },
          totalSpent: { $sum: "$totalAmount" }
        }
      },
      { $sort: { orderCount: -1 } },
      { $limit: 10 }
    ]);

    // Credit utilization
    const creditStats = await User.aggregate([
      { $match: { role: "customer", creditLimit: { $gt: 0 } } },
      {
        $group: {
          _id: null,
          totalCreditLimit: { $sum: "$creditLimit" },
          totalPendingAmount: { $sum: "$pendingAmount" },
          avgCreditLimit: { $avg: "$creditLimit" },
          avgPendingAmount: { $avg: "$pendingAmount" }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      data: {
        period,
        newCustomersTrend,
        customerSegments,
        customersByBusinessType,
        topOrderingCustomers,
        creditStats: creditStats[0] || {
          totalCreditLimit: 0,
          totalPendingAmount: 0,
          avgCreditLimit: 0,
          avgPendingAmount: 0
        }
      }
    });

  } catch (error) {
    console.error("Customer Analytics Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch customer analytics",
      error: process.env.NODE_ENV === "development" ? error.message : undefined
    });
  }
};

// ============================================================
// PRODUCT ANALYTICS
// ============================================================

/**
 * @desc    Get product analytics
 * @route   GET /api/admin/dashboard/products/analytics
 * @access  Private/Admin
 */
exports.getProductAnalytics = async (req, res) => {
  try {
    const { period = "30days" } = req.query;

    let startDate = new Date();
    switch (period) {
      case "7days":
        startDate.setDate(startDate.getDate() - 7);
        break;
      case "30days":
        startDate.setDate(startDate.getDate() - 30);
        break;
      case "90days":
        startDate.setDate(startDate.getDate() - 90);
        break;
      default:
        startDate.setDate(startDate.getDate() - 30);
    }

    // Product overview
    const productOverview = {
      total: await Product.countDocuments(),
      active: await Product.countDocuments({ isActive: true }),
      inStock: await Product.countDocuments({ inStock: true }),
      outOfStock: await Product.countDocuments({ inStock: false })
    };

    // Products by category
    const productsByCategory = await Product.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: "$category",
          count: { $sum: 1 },
          avgPrice: { $avg: "$price" }
        }
      },
      { $sort: { count: -1 } }
    ]);

    // Best selling products
    const bestSelling = await Order.aggregate([
      { $match: { createdAt: { $gte: startDate }, status: { $ne: "cancelled" } } },
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.product",
          productTitle: { $first: "$items.productSnapshot.title" },
          category: { $first: "$items.productSnapshot.category" },
          totalQuantity: { $sum: "$items.quantity" },
          totalRevenue: { $sum: "$items.subtotal" },
          orderCount: { $sum: 1 }
        }
      },
      { $sort: { totalQuantity: -1 } },
      { $limit: 10 }
    ]);

    // Products never ordered
    const orderedProductIds = await Order.distinct("items.product", {
      status: { $ne: "cancelled" }
    });

    const neverOrdered = await Product.find({
      _id: { $nin: orderedProductIds },
      isActive: true
    }).select('title category price').limit(10);

    // Price distribution
    const priceRanges = await Product.aggregate([
      { $match: { isActive: true } },
      {
        $bucket: {
          groupBy: "$price",
          boundaries: [0, 100, 500, 1000, 5000, 10000, Infinity],
          default: "10000+",
          output: {
            count: { $sum: 1 },
            products: { $push: "$title" }
          }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      data: {
        period,
        productOverview,
        productsByCategory,
        bestSelling,
        neverOrdered,
        priceRanges
      }
    });

  } catch (error) {
    console.error("Product Analytics Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch product analytics",
      error: process.env.NODE_ENV === "development" ? error.message : undefined
    });
  }
};

// ============================================================
// REPORTS
// ============================================================

/**
 * @desc    Get sales report
 * @route   GET /api/admin/dashboard/reports/sales
 * @access  Private/Admin
 */
exports.getSalesReport = async (req, res) => {
  try {
    const { startDate, endDate, groupBy = "day" } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: "startDate and endDate are required"
      });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    let dateFormat;
    switch (groupBy) {
      case "day":
        dateFormat = "%Y-%m-%d";
        break;
      case "week":
        dateFormat = "%Y-W%V";
        break;
      case "month":
        dateFormat = "%Y-%m";
        break;
      default:
        dateFormat = "%Y-%m-%d";
    }

    // Sales data
    const salesData = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: start, $lte: end },
          status: { $ne: "cancelled" }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: dateFormat, date: "$createdAt" } },
          orders: { $sum: 1 },
          grossSales: { $sum: "$totalAmount" },
          delivered: {
            $sum: { $cond: [{ $eq: ["$status", "delivered"] }, 1, 0] }
          },
          deliveredAmount: {
            $sum: { $cond: [{ $eq: ["$status", "delivered"] }, "$totalAmount", 0] }
          }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Summary
    const summary = {
      totalOrders: salesData.reduce((sum, d) => sum + d.orders, 0),
      grossSales: salesData.reduce((sum, d) => sum + d.grossSales, 0),
      deliveredOrders: salesData.reduce((sum, d) => sum + d.delivered, 0),
      deliveredAmount: salesData.reduce((sum, d) => sum + d.deliveredAmount, 0)
    };

    res.status(200).json({
      success: true,
      data: {
        reportType: "sales",
        period: { startDate: start, endDate: end },
        groupBy,
        summary,
        data: salesData
      }
    });

  } catch (error) {
    console.error("Sales Report Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to generate sales report",
      error: process.env.NODE_ENV === "development" ? error.message : undefined
    });
  }
};

/**
 * @desc    Get payment collection report
 * @route   GET /api/admin/dashboard/reports/payments
 * @access  Private/Admin
 */
exports.getPaymentReport = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: "startDate and endDate are required"
      });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    // Payment collection data
    const paymentData = await Payment.aggregate([
      {
        $match: {
          paymentDate: { $gte: start, $lte: end },
          status: "completed"
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$paymentDate" } },
          totalCollected: { $sum: "$amount" },
          transactionCount: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // By method
    const byMethod = await Payment.aggregate([
      {
        $match: {
          paymentDate: { $gte: start, $lte: end },
          status: "completed"
        }
      },
      {
        $group: {
          _id: "$method",
          total: { $sum: "$amount" },
          count: { $sum: 1 }
        }
      },
      { $sort: { total: -1 } }
    ]);

    // Summary
    const summary = {
      totalCollected: paymentData.reduce((sum, d) => sum + d.totalCollected, 0),
      totalTransactions: paymentData.reduce((sum, d) => sum + d.transactionCount, 0)
    };

    res.status(200).json({
      success: true,
      data: {
        reportType: "payments",
        period: { startDate: start, endDate: end },
        summary,
        dailyData: paymentData,
        byMethod
      }
    });

  } catch (error) {
    console.error("Payment Report Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to generate payment report",
      error: process.env.NODE_ENV === "development" ? error.message : undefined
    });
  }
};

/**
 * @desc    Get outstanding/receivables report
 * @route   GET /api/admin/dashboard/reports/outstanding
 * @access  Private/Admin
 */
exports.getOutstandingReport = async (req, res) => {
  try {
    // Get all customers with pending amount
    const customersWithDues = await User.find({
      role: "customer",
      pendingAmount: { $gt: 0 }
    })
    .select('name phone businessName pendingAmount creditLimit paymentTerms')
    .sort({ pendingAmount: -1 });

    // Get aging of receivables
    const today = new Date();
    const aging = {
      current: 0,      // 0-30 days
      days30to60: 0,   // 31-60 days
      days60to90: 0,   // 61-90 days
      over90: 0        // 90+ days
    };

    for (const customer of customersWithDues) {
      // Get oldest unpaid order for each customer
      const oldestUnpaidOrder = await Order.findOne({
        user: customer._id,
        status: { $ne: "cancelled" },
        paymentStatus: { $ne: "paid" }
      }).sort({ createdAt: 1 });

      if (oldestUnpaidOrder) {
        const daysSinceOrder = Math.floor(
          (today - oldestUnpaidOrder.createdAt) / (1000 * 60 * 60 * 24)
        );

        if (daysSinceOrder <= 30) {
          aging.current += customer.pendingAmount;
        } else if (daysSinceOrder <= 60) {
          aging.days30to60 += customer.pendingAmount;
        } else if (daysSinceOrder <= 90) {
          aging.days60to90 += customer.pendingAmount;
        } else {
          aging.over90 += customer.pendingAmount;
        }
      }
    }

    // Summary
    const totalOutstanding = customersWithDues.reduce(
      (sum, c) => sum + c.pendingAmount, 0
    );

    res.status(200).json({
      success: true,
      data: {
        reportType: "outstanding",
        generatedAt: new Date(),
        summary: {
          totalOutstanding,
          customersWithDues: customersWithDues.length
        },
        aging,
        customers: customersWithDues.map(c => ({
          _id: c._id,
          name: c.name,
          phone: c.phone,
          businessName: c.businessName,
          pendingAmount: c.pendingAmount,
          creditLimit: c.creditLimit,
          creditUtilization: c.creditLimit > 0 
            ? Math.round((c.pendingAmount / c.creditLimit) * 100)
            : 0
        }))
      }
    });

  } catch (error) {
    console.error("Outstanding Report Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to generate outstanding report",
      error: process.env.NODE_ENV === "development" ? error.message : undefined
    });
  }
};

// ============================================================
// QUICK STATS
// ============================================================

/**
 * @desc    Get quick stats for widgets
 * @route   GET /api/admin/dashboard/quick-stats
 * @access  Private/Admin
 */
exports.getQuickStats = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      pendingOrders,
      todayOrders,
      pendingPayments,
      activeCartsCount
    ] = await Promise.all([
      Order.countDocuments({ status: "pending" }),
      Order.countDocuments({ createdAt: { $gte: today } }),
      User.aggregate([
        { $match: { role: "customer", pendingAmount: { $gt: 0 } } },
        { $group: { _id: null, total: { $sum: "$pendingAmount" }, count: { $sum: 1 } } }
      ]),
      Cart.countDocuments({ "items.0": { $exists: true } })
    ]);

    res.status(200).json({
      success: true,
      data: {
        pendingOrders,
        todayOrders,
        pendingPaymentsAmount: pendingPayments[0]?.total || 0,
        customersWithDues: pendingPayments[0]?.count || 0,
        activeCarts: activeCartsCount
      }
    });

  } catch (error) {
    console.error("Quick Stats Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch quick stats",
      error: process.env.NODE_ENV === "development" ? error.message : undefined
    });
  }
};