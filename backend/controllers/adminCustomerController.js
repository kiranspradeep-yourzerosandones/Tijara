const User = require("../models/User");
const Admin = require("../models/Admin");
const Order = require("../models/Order");
const Payment = require("../models/Payment");
const Location = require("../models/Location");
const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");

// ============================================================
// ADMIN CUSTOMER MANAGEMENT
// ============================================================

/**
 * @desc    Get all customers with filters
 * @route   GET /api/admin/customers
 * @access  Private/Admin
 */
exports.getAllCustomers = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      search,
      status,
      creditStatus,
      hasOrders,
      sortBy = "createdAt",
      sortOrder = "desc",
      businessType,
      city
    } = req.query;

    const query = {}; // ✅ REMOVED role filter since User model is customers only now

    // Search by name, phone, email, business name
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { businessName: { $regex: search, $options: "i" } }
      ];
    }

    // Filter by status
    if (status === "active") {
      query.isActive = true;
    } else if (status === "inactive") {
      query.isActive = false;
    }

    // Filter by credit status
    if (creditStatus === "blocked") {
      query.isCreditBlocked = true;
    } else if (creditStatus === "active") {
      query.isCreditBlocked = false;
    } else if (creditStatus === "overdue") {
      query.pendingAmount = { $gt: 0 };
    }

    // Filter by business type
    if (businessType) {
      query.businessType = { $regex: businessType, $options: "i" };
    }

    // Sort options
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === "asc" ? 1 : -1;

    // Get customers
    const customers = await User.find(query)
      .select('-password -passwordResetToken -passwordResetExpires')
      .sort(sortOptions)
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await User.countDocuments(query);

    // Get order counts for each customer
    const customerIds = customers.map(c => c._id);
    const orderCounts = await Order.aggregate([
      { $match: { user: { $in: customerIds }, status: { $ne: "cancelled" } } },
      { $group: { _id: "$user", orderCount: { $sum: 1 }, totalSpent: { $sum: "$totalAmount" } } }
    ]);

    const orderCountMap = {};
    orderCounts.forEach(oc => {
      orderCountMap[oc._id.toString()] = { orderCount: oc.orderCount, totalSpent: oc.totalSpent };
    });

    // Add order info to customers
    const customersWithOrders = customers.map(customer => {
      const orderInfo = orderCountMap[customer._id.toString()] || { orderCount: 0, totalSpent: 0 };
      return {
        ...customer.toObject(),
        orderCount: orderInfo.orderCount,
        totalSpent: orderInfo.totalSpent
      };
    });

    // Filter by hasOrders if specified
    let filteredCustomers = customersWithOrders;
    if (hasOrders === "true") {
      filteredCustomers = customersWithOrders.filter(c => c.orderCount > 0);
    } else if (hasOrders === "false") {
      filteredCustomers = customersWithOrders.filter(c => c.orderCount === 0);
    }

    res.status(200).json({
      success: true,
      data: {
        customers: filteredCustomers,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / limit),
          total
        }
      }
    });

  } catch (error) {
    console.error("Get All Customers Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch customers",
      error: process.env.NODE_ENV === "development" ? error.message : undefined
    });
  }
};

/**
 * @desc    Get single customer with full details
 * @route   GET /api/admin/customers/:id
 * @access  Private/Admin
 */
exports.getCustomer = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid customer ID"
      });
    }

    const customer = await User.findById(id) // ✅ Removed role check
      .select('-password -passwordResetToken -passwordResetExpires')
      .populate('creditBlockedBy', 'name'); // Will populate from Admin model

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found"
      });
    }

    // Get order summary
    const orderSummary = await Order.aggregate([
      { $match: { user: customer._id } },
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          deliveredOrders: { $sum: { $cond: [{ $eq: ["$status", "delivered"] }, 1, 0] } },
          cancelledOrders: { $sum: { $cond: [{ $eq: ["$status", "cancelled"] }, 1, 0] } },
          totalSpent: { $sum: { $cond: [{ $ne: ["$status", "cancelled"] }, "$totalAmount", 0] } },
          paidAmount: { $sum: { $cond: [{ $eq: ["$paymentStatus", "paid"] }, "$totalAmount", 0] } }
        }
      }
    ]);

    // Get payment summary
    const paymentSummary = await Payment.aggregate([
      { $match: { user: customer._id, status: "completed" } },
      {
        $group: {
          _id: null,
          totalPayments: { $sum: 1 },
          totalAmountPaid: { $sum: "$amount" },
          lastPaymentDate: { $max: "$paymentDate" }
        }
      }
    ]);

    // Get recent orders
    const recentOrders = await Order.find({ user: customer._id })
      .select('orderNumber status totalAmount paymentStatus createdAt')
      .sort({ createdAt: -1 })
      .limit(5);

    // Get locations count
    const locationsCount = await Location.countDocuments({ user: customer._id, isActive: true });

    res.status(200).json({
      success: true,
      data: {
        customer,
        orderSummary: orderSummary[0] || {
          totalOrders: 0,
          deliveredOrders: 0,
          cancelledOrders: 0,
          totalSpent: 0,
          paidAmount: 0
        },
        paymentSummary: paymentSummary[0] || {
          totalPayments: 0,
          totalAmountPaid: 0,
          lastPaymentDate: null
        },
        recentOrders,
        locationsCount
      }
    });

  } catch (error) {
    console.error("Get Customer Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch customer",
      error: process.env.NODE_ENV === "development" ? error.message : undefined
    });
  }
};

/**
 * @desc    Create new customer (by admin)
 * @route   POST /api/admin/customers
 * @access  Private/Admin
 */
exports.createCustomer = async (req, res) => {
  try {
    const {
      name,
      phone,
      email,
      password,
      businessName,
      businessType,
      gstNumber,
      address,
      creditLimit,
      paymentTerms,
      adminNotes
    } = req.body;

    // Validate required fields
    if (!name || !phone || !password) {
      return res.status(400).json({
        success: false,
        message: "Name, phone, and password are required"
      });
    }

    // Validate phone format
    const phoneRegex = /^[6-9]\d{9}$/;
    if (!phoneRegex.test(phone)) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid 10-digit phone number"
      });
    }

    // Check if phone already exists
    const existingUser = await User.findOne({ phone });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "Phone number already registered"
      });
    }

    // Check if email already exists
    if (email) {
      const existingEmail = await User.findOne({ email: email.toLowerCase() });
      if (existingEmail) {
        return res.status(400).json({
          success: false,
          message: "Email already registered"
        });
      }
    }

    // ✅ Handle profile image upload
    let profileImage = null;
    if (req.file) {
      profileImage = `/uploads/${req.file.filename}`;
    }

    // Create customer
    const customer = await User.create({
      name,
      phone,
      email: email?.toLowerCase(),
      password,
      businessName,
      businessType,
      gstNumber,
      address,
      creditLimit: creditLimit || 0,
      paymentTerms: paymentTerms || 30,
      adminNotes,
      profileImage,
      isPhoneVerified: true,
      isActive: true
    });

    console.log(`👤 Customer created by admin: ${customer.phone}`);

    res.status(201).json({
      success: true,
      message: "Customer created successfully",
      data: {
        customer: customer.getPublicProfile()
      }
    });

  } catch (error) {
    console.error("Create Customer Error:", error);

    if (error.code === 11000) {
      const field = Object.keys(error.keyValue)[0];
      return res.status(400).json({
        success: false,
        message: `${field} already exists`
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to create customer",
      error: process.env.NODE_ENV === "development" ? error.message : undefined
    });
  }
};

/**
 * @desc    Update customer
 * @route   PUT /api/admin/customers/:id
 * @access  Private/Admin
 */
exports.updateCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      email,
      businessName,
      businessType,
      gstNumber,
      address,
      creditLimit,
      paymentTerms,
      adminNotes,
      isActive,
      removeProfileImage
    } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid customer ID"
      });
    }

    const customer = await User.findById(id); // ✅ Removed role check

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found"
      });
    }

    // Check email uniqueness if changed
    if (email && email.toLowerCase() !== customer.email) {
      const existingEmail = await User.findOne({ 
        email: email.toLowerCase(), 
        _id: { $ne: id } 
      });
      if (existingEmail) {
        return res.status(400).json({
          success: false,
          message: "Email already registered"
        });
      }
    }

    // ✅ Handle profile image
    if (req.file) {
      // Delete old profile image if exists
      if (customer.profileImage) {
        const oldImagePath = path.join(__dirname, "..", customer.profileImage);
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
      }
      customer.profileImage = `/uploads/${req.file.filename}`;
    }

    // ✅ Remove profile image if requested
    if (removeProfileImage === "true" || removeProfileImage === true) {
      if (customer.profileImage) {
        const oldImagePath = path.join(__dirname, "..", customer.profileImage);
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
      }
      customer.profileImage = null;
    }

    // Update fields
    if (name !== undefined) customer.name = name;
    if (email !== undefined) customer.email = email?.toLowerCase();
    if (businessName !== undefined) customer.businessName = businessName;
    if (businessType !== undefined) customer.businessType = businessType;
    if (gstNumber !== undefined) customer.gstNumber = gstNumber;
    if (address !== undefined) customer.address = address;
    if (creditLimit !== undefined) customer.creditLimit = creditLimit;
    if (paymentTerms !== undefined) customer.paymentTerms = paymentTerms;
    if (adminNotes !== undefined) customer.adminNotes = adminNotes;
    if (isActive !== undefined) customer.isActive = isActive;

    await customer.save();

    console.log(`👤 Customer updated by admin: ${customer.phone}`);

    res.status(200).json({
      success: true,
      message: "Customer updated successfully",
      data: {
        customer: customer.getPublicProfile()
      }
    });

  } catch (error) {
    console.error("Update Customer Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update customer",
      error: process.env.NODE_ENV === "development" ? error.message : undefined
    });
  }
};

/**
 * @desc    Reset customer password (by admin)
 * @route   PUT /api/admin/customers/:id/reset-password
 * @access  Private/Admin
 */
exports.resetCustomerPassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { newPassword, sendEmail = true } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid customer ID"
      });
    }

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters"
      });
    }

    const customer = await User.findById(id); // ✅ Removed role check

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found"
      });
    }

    // Update password
    customer.password = newPassword;
    await customer.save();

    // Send notification email
    if (sendEmail && customer.email) {
      try {
        const emailService = require("../services/emailService");
        await emailService.sendPasswordChangedEmail({
          to: customer.email,
          name: customer.name
        });
      } catch (emailError) {
        console.error("Failed to send password change email:", emailError);
      }
    }

    console.log(`🔑 Password reset by admin for customer: ${customer.phone}`);

    res.status(200).json({
      success: true,
      message: "Customer password reset successfully"
    });

  } catch (error) {
    console.error("Reset Customer Password Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to reset password",
      error: process.env.NODE_ENV === "development" ? error.message : undefined
    });
  }
};

/**
 * @desc    Toggle customer active status
 * @route   PUT /api/admin/customers/:id/toggle-status
 * @access  Private/Admin
 */
exports.toggleCustomerStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid customer ID"
      });
    }

    const customer = await User.findById(id); // ✅ Removed role check

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found"
      });
    }

    // Toggle status
    customer.isActive = !customer.isActive;
    
    // Add note
    const timestamp = new Date().toISOString();
    const action = customer.isActive ? "ACTIVATED" : "DEACTIVATED";
    const note = `[${timestamp}] ${action} by admin${reason ? ': ' + reason : ''}`;
    customer.adminNotes = customer.adminNotes 
      ? `${customer.adminNotes}\n${note}`
      : note;

    await customer.save();

    console.log(`👤 Customer ${action}: ${customer.phone}`);

    res.status(200).json({
      success: true,
      message: `Customer ${customer.isActive ? 'activated' : 'deactivated'} successfully`,
      data: {
        isActive: customer.isActive
      }
    });

  } catch (error) {
    console.error("Toggle Customer Status Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to toggle customer status",
      error: process.env.NODE_ENV === "development" ? error.message : undefined
    });
  }
};

/**
 * @desc    Update customer credit settings
 * @route   PUT /api/admin/customers/:id/credit
 * @access  Private/Admin
 */
exports.updateCreditSettings = async (req, res) => {
  try {
    const { id } = req.params;
    const { creditLimit, paymentTerms, isCreditBlocked, creditBlockedReason } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid customer ID"
      });
    }

    const customer = await User.findById(id); // ✅ Removed role check

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found"
      });
    }

    // Update credit settings
    if (creditLimit !== undefined) {
      if (creditLimit < 0) {
        return res.status(400).json({
          success: false,
          message: "Credit limit cannot be negative"
        });
      }
      customer.creditLimit = creditLimit;
    }

    if (paymentTerms !== undefined) {
      if (paymentTerms < 0 || paymentTerms > 365) {
        return res.status(400).json({
          success: false,
          message: "Payment terms must be between 0 and 365 days"
        });
      }
      customer.paymentTerms = paymentTerms;
    }

    if (isCreditBlocked !== undefined) {
      if (isCreditBlocked && !creditBlockedReason) {
        return res.status(400).json({
          success: false,
          message: "Reason is required when blocking credit"
        });
      }

      customer.isCreditBlocked = isCreditBlocked;
      
      if (isCreditBlocked) {
        customer.creditBlockedReason = creditBlockedReason;
        customer.creditBlockedAt = new Date();
        customer.creditBlockedBy = req.user._id; // ✅ This now references Admin model
      } else {
        customer.creditBlockedReason = null;
        customer.creditBlockedAt = null;
        customer.creditBlockedBy = null;
      }
    }

    await customer.save();

    console.log(`💳 Credit settings updated for customer: ${customer.phone}`);

    res.status(200).json({
      success: true,
      message: "Credit settings updated successfully",
      data: {
        creditLimit: customer.creditLimit,
        paymentTerms: customer.paymentTerms,
        isCreditBlocked: customer.isCreditBlocked,
        availableCredit: customer.availableCredit,
        creditUtilization: customer.creditUtilization
      }
    });

  } catch (error) {
    console.error("Update Credit Settings Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update credit settings",
      error: process.env.NODE_ENV === "development" ? error.message : undefined
    });
  }
};

/**
 * @desc    Get customer statistics
 * @route   GET /api/admin/customers/stats
 * @access  Private/Admin
 */
exports.getCustomerStats = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const thisMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [
      totalCustomers,
      activeCustomers,
      newThisMonth,
      newToday,
      activeInLast30Days,
      withPendingPayments,
      blockedCredit,
      byBusinessType
    ] = await Promise.all([
      User.countDocuments({}), // ✅ Removed role filter
      User.countDocuments({ isActive: true }),
      User.countDocuments({ createdAt: { $gte: thisMonthStart } }),
      User.countDocuments({ createdAt: { $gte: today } }),
      User.countDocuments({ lastLoginAt: { $gte: thirtyDaysAgo } }),
      User.countDocuments({ pendingAmount: { $gt: 0 } }),
      User.countDocuments({ isCreditBlocked: true }),
      User.aggregate([
        { $match: { businessType: { $exists: true, $ne: null, $ne: "" } } }, // ✅ Removed role filter
        { $group: { _id: "$businessType", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ])
    ]);

    // Credit utilization
    const creditStats = await User.aggregate([
      { $match: { creditLimit: { $gt: 0 } } }, // ✅ Removed role filter
      {
        $group: {
          _id: null,
          totalCreditLimit: { $sum: "$creditLimit" },
          totalPendingAmount: { $sum: "$pendingAmount" },
          avgCreditLimit: { $avg: "$creditLimit" },
          customersWithCredit: { $sum: 1 }
        }
      }
    ]);

    // Top customers by revenue
    const topCustomers = await Order.aggregate([
      { $match: { status: "delivered" } },
      {
        $group: {
          _id: "$user",
          totalRevenue: { $sum: "$totalAmount" },
          orderCount: { $sum: 1 }
        }
      },
      { $sort: { totalRevenue: -1 } },
      { $limit: 5 },
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
          totalRevenue: 1,
          orderCount: 1,
          name: "$user.name",
          phone: "$user.phone",
          businessName: "$user.businessName"
        }
      }
    ]);

    res.status(200).json({
      success: true,
      data: {
        overview: {
          totalCustomers,
          activeCustomers,
          inactiveCustomers: totalCustomers - activeCustomers,
          newThisMonth,
          newToday,
          activeInLast30Days
        },
        creditStatus: {
          withPendingPayments,
          blockedCredit,
          totalCreditLimit: creditStats[0]?.totalCreditLimit || 0,
          totalPendingAmount: creditStats[0]?.totalPendingAmount || 0,
          avgCreditLimit: Math.round(creditStats[0]?.avgCreditLimit || 0),
          customersWithCredit: creditStats[0]?.customersWithCredit || 0
        },
        byBusinessType,
        topCustomers
      }
    });

  } catch (error) {
    console.error("Get Customer Stats Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch customer statistics",
      error: process.env.NODE_ENV === "development" ? error.message : undefined
    });
  }
};

/**
 * @desc    Send password reset email to customer (by admin)
 * @route   POST /api/admin/customers/:id/send-reset-email
 * @access  Private/Admin
 */
exports.sendPasswordResetToCustomer = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid customer ID"
      });
    }

    const customer = await User.findById(id); // ✅ Removed role check

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found"
      });
    }

    if (!customer.email) {
      return res.status(400).json({
        success: false,
        message: "Customer does not have an email address"
      });
    }

    // Generate reset token
    const resetToken = customer.generatePasswordResetToken();
    await customer.save({ validateBeforeSave: false });

    // Create reset URL
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password/${resetToken}`;

    // Send email
    const emailService = require("../services/emailService");
    const emailResult = await emailService.sendPasswordResetEmail({
      to: customer.email,
      name: customer.name,
      resetUrl,
      expiresIn: "1 hour"
    });

    if (!emailResult.success && !emailResult.devMode) {
      customer.passwordResetToken = undefined;
      customer.passwordResetExpires = undefined;
      await customer.save({ validateBeforeSave: false });

      return res.status(500).json({
        success: false,
        message: "Failed to send reset email"
      });
    }

    console.log(`📧 Password reset email sent to customer ${customer.phone} by admin`);

    res.status(200).json({
      success: true,
      message: "Password reset email sent successfully"
    });

  } catch (error) {
    console.error("Send Password Reset To Customer Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to send reset email",
      error: process.env.NODE_ENV === "development" ? error.message : undefined
    });
  }
};

/**
 * @desc    Export customers to CSV
 * @route   GET /api/admin/customers/export
 * @access  Private/Admin
 */
exports.exportCustomers = async (req, res) => {
  try {
    const { status, creditStatus } = req.query;

    const query = {}; // ✅ Removed role filter

    if (status === "active") query.isActive = true;
    if (status === "inactive") query.isActive = false;
    if (creditStatus === "blocked") query.isCreditBlocked = true;

    const customers = await User.find(query)
      .select('name phone email businessName businessType gstNumber creditLimit pendingAmount isActive createdAt')
      .sort({ createdAt: -1 });

    // Create CSV content
    const headers = [
      "Name",
      "Phone",
      "Email",
      "Business Name",
      "Business Type",
      "GST Number",
      "Credit Limit",
      "Pending Amount",
      "Status",
      "Registered Date"
    ];

    const csvRows = [headers.join(",")];

    customers.forEach(customer => {
      const row = [
        `"${customer.name || ''}"`,
        customer.phone,
        customer.email || '',
        `"${customer.businessName || ''}"`,
        `"${customer.businessType || ''}"`,
        customer.gstNumber || '',
        customer.creditLimit,
        customer.pendingAmount,
        customer.isActive ? 'Active' : 'Inactive',
        customer.createdAt.toISOString().split('T')[0]
      ];
      csvRows.push(row.join(","));
    });

    const csvContent = csvRows.join("\n");

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=customers_${Date.now()}.csv`);
    res.send(csvContent);

  } catch (error) {
    console.error("Export Customers Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to export customers",
      error: process.env.NODE_ENV === "development" ? error.message : undefined
    });
  }
};

/**
 * @desc    Delete customer (soft delete by default)
 * @route   DELETE /api/admin/customers/:id
 * @access  Private/Admin
 */
exports.deleteCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    const { hardDelete = false, reason } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid customer ID"
      });
    }

    const customer = await User.findById(id); // ✅ Removed role check

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found"
      });
    }

    // Check if customer has orders
    const orderCount = await Order.countDocuments({ user: id });
    const pendingOrders = await Order.countDocuments({ 
      user: id, 
      status: { $in: ["pending", "confirmed", "processing", "shipped"] } 
    });

    if (hardDelete && pendingOrders > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot permanently delete customer with ${pendingOrders} pending orders.`
      });
    }

    if (hardDelete) {
      if (orderCount > 0) {
        return res.status(400).json({
          success: false,
          message: `Cannot permanently delete customer with ${orderCount} orders. Use soft delete instead.`
        });
      }

      // Delete profile image if exists
      if (customer.profileImage) {
        const imagePath = path.join(__dirname, "..", customer.profileImage);
        if (fs.existsSync(imagePath)) {
          fs.unlinkSync(imagePath);
        }
      }

      // Delete related data
      await Promise.all([
        Location.deleteMany({ user: id }),
        Payment.deleteMany({ user: id })
      ]);

      await User.deleteOne({ _id: id });

      console.log(`🗑️ HARD DELETE: Customer ${customer.phone} permanently deleted`);

      return res.status(200).json({
        success: true,
        message: "Customer permanently deleted"
      });
    }

    // SOFT DELETE
    customer.isActive = false;
    
    const timestamp = new Date().toISOString();
    const deleteNote = `[${timestamp}] DELETED (soft) by admin${reason ? ': ' + reason : ''}`;
    customer.adminNotes = customer.adminNotes 
      ? `${customer.adminNotes}\n${deleteNote}`
      : deleteNote;

    await customer.save();

    console.log(`🚫 SOFT DELETE: Customer ${customer.phone} deactivated`);

    res.status(200).json({
      success: true,
      message: "Customer deactivated successfully",
      data: {
        customerId: customer._id,
        isActive: customer.isActive
      }
    });

  } catch (error) {
    console.error("Delete Customer Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete customer",
      error: process.env.NODE_ENV === "development" ? error.message : undefined
    });
  }
};

module.exports = exports;