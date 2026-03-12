const Notification = require("../models/Notification");
const NotificationTemplate = require("../models/NotificationTemplate");
const User = require("../models/User");
const notificationService = require("../services/notificationService");
const mongoose = require("mongoose");

// ============================================================
// CUSTOMER NOTIFICATION VIEWS
// ============================================================

/**
 * @desc    Get my notifications (in-app)
 * @route   GET /api/notifications
 * @access  Private
 */
exports.getMyNotifications = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      unreadOnly = false 
    } = req.query;

    const query = {
      "recipients.user": req.user._id,
      status: { $in: ["sent", "partial"] }
    };

    // Build aggregation to get user's notifications with their read status
    const notifications = await Notification.aggregate([
      { $match: query },
      { $unwind: "$recipients" },
      { $match: { "recipients.user": new mongoose.Types.ObjectId(req.user._id) } },
      ...(unreadOnly === "true" ? [{ $match: { "recipients.isRead": false } }] : []),
      { $sort: { createdAt: -1 } },
      { $skip: (parseInt(page) - 1) * parseInt(limit) },
      { $limit: parseInt(limit) },
      {
        $project: {
          _id: 1,
          title: 1,
          message: 1,
          type: 1,
          priority: 1,
          actionUrl: 1,
          imageUrl: 1,
          createdAt: 1,
          isRead: "$recipients.isRead",
          readAt: "$recipients.readAt"
        }
      }
    ]);

    // Get total count
    const totalPipeline = [
      { $match: query },
      { $unwind: "$recipients" },
      { $match: { "recipients.user": new mongoose.Types.ObjectId(req.user._id) } },
      ...(unreadOnly === "true" ? [{ $match: { "recipients.isRead": false } }] : []),
      { $count: "total" }
    ];

    const totalResult = await Notification.aggregate(totalPipeline);
    const total = totalResult[0]?.total || 0;

    // Get unread count
    const unreadCountPipeline = [
      { $match: query },
      { $unwind: "$recipients" },
      { 
        $match: { 
          "recipients.user": new mongoose.Types.ObjectId(req.user._id),
          "recipients.isRead": false 
        } 
      },
      { $count: "unread" }
    ];

    const unreadResult = await Notification.aggregate(unreadCountPipeline);
    const unreadCount = unreadResult[0]?.unread || 0;

    res.status(200).json({
      success: true,
      data: {
        notifications,
        unreadCount,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / limit),
          total
        }
      }
    });

  } catch (error) {
    console.error("Get Notifications Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch notifications",
      error: process.env.NODE_ENV === "development" ? error.message : undefined
    });
  }
};

/**
 * @desc    Mark notification as read
 * @route   PUT /api/notifications/:id/read
 * @access  Private
 */
exports.markAsRead = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid notification ID"
      });
    }

    const notification = await Notification.findOneAndUpdate(
      {
        _id: id,
        "recipients.user": req.user._id
      },
      {
        $set: {
          "recipients.$.isRead": true,
          "recipients.$.readAt": new Date()
        }
      },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found"
      });
    }

    // Update stats
    notification.updateStats();
    await notification.save();

    res.status(200).json({
      success: true,
      message: "Notification marked as read"
    });

  } catch (error) {
    console.error("Mark As Read Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to mark notification as read",
      error: process.env.NODE_ENV === "development" ? error.message : undefined
    });
  }
};

/**
 * @desc    Mark all notifications as read
 * @route   PUT /api/notifications/read-all
 * @access  Private
 */
exports.markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      {
        "recipients.user": req.user._id,
        "recipients.isRead": false
      },
      {
        $set: {
          "recipients.$[elem].isRead": true,
          "recipients.$[elem].readAt": new Date()
        }
      },
      {
        arrayFilters: [{ "elem.user": req.user._id }]
      }
    );

    res.status(200).json({
      success: true,
      message: "All notifications marked as read"
    });

  } catch (error) {
    console.error("Mark All As Read Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to mark notifications as read",
      error: process.env.NODE_ENV === "development" ? error.message : undefined
    });
  }
};

/**
 * @desc    Get unread count
 * @route   GET /api/notifications/unread-count
 * @access  Private
 */
exports.getUnreadCount = async (req, res) => {
  try {
    const result = await Notification.aggregate([
      {
        $match: {
          "recipients.user": new mongoose.Types.ObjectId(req.user._id),
          status: { $in: ["sent", "partial"] }
        }
      },
      { $unwind: "$recipients" },
      {
        $match: {
          "recipients.user": new mongoose.Types.ObjectId(req.user._id),
          "recipients.isRead": false
        }
      },
      { $count: "unread" }
    ]);

    res.status(200).json({
      success: true,
      data: {
        unreadCount: result[0]?.unread || 0
      }
    });

  } catch (error) {
    console.error("Get Unread Count Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get unread count",
      error: process.env.NODE_ENV === "development" ? error.message : undefined
    });
  }
};

// ============================================================
// ADMIN NOTIFICATION OPERATIONS
// ============================================================

/**
 * @desc    Create and send notification (Admin)
 * @route   POST /api/admin/notifications
 * @access  Private/Admin
 */
exports.adminCreateNotification = async (req, res) => {
  try {
    const {
      title,
      message,
      shortMessage,
      type = "custom",
      priority = "normal",
      channels = { push: true, inApp: true },
      targetType = "selected",
      userIds,
      segmentFilters,
      actionUrl,
      imageUrl,
      scheduledAt,
      templateId
    } = req.body;

    // Validate required fields
    if (!title) {
      return res.status(400).json({
        success: false,
        message: "Title is required"
      });
    }

    if (!message) {
      return res.status(400).json({
        success: false,
        message: "Message is required"
      });
    }

    // Get recipients based on target type
    let recipients = [];

    if (targetType === "all") {
      // All active customers
      const users = await User.find({ role: "customer", isActive: true })
        .select('_id');
      recipients = users.map(u => ({ user: u._id, channels: {} }));

    } else if (targetType === "selected" && userIds && userIds.length > 0) {
      // Selected users
      recipients = userIds.map(id => ({ user: id, channels: {} }));

    } else if (targetType === "segment" && segmentFilters) {
      // Segment-based
      const users = await notificationService.getUsersBySegment(segmentFilters);
      recipients = users.map(u => ({ user: u._id, channels: {} }));

    } else {
      return res.status(400).json({
        success: false,
        message: "Please specify recipients (userIds for selected, or filters for segment)"
      });
    }

    if (recipients.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No recipients found matching the criteria"
      });
    }

    // Create notification
    const notification = new Notification({
      title,
      message,
      shortMessage: shortMessage || message.substring(0, 160),
      type,
      priority,
      channels,
      targetType,
      segmentFilters,
      recipients,
      actionUrl,
      imageUrl,
      scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
      template: templateId,
      createdBy: req.user._id,
      status: scheduledAt ? "scheduled" : "draft"
    });

    await notification.save();

    console.log(`📢 Notification created: ${notification._id} with ${recipients.length} recipients`);

    // If not scheduled, process immediately
    if (!scheduledAt) {
      // Process in background
      setImmediate(async () => {
        try {
          await notificationService.processNotification(notification._id);
        } catch (err) {
          console.error("Background notification processing error:", err);
        }
      });
    }

    res.status(201).json({
      success: true,
      message: scheduledAt 
        ? `Notification scheduled for ${recipients.length} recipients`
        : `Notification being sent to ${recipients.length} recipients`,
      data: {
        notification: {
          _id: notification._id,
          title: notification.title,
          type: notification.type,
          status: notification.status,
          recipientCount: recipients.length,
          channels: notification.channels,
          scheduledAt: notification.scheduledAt
        }
      }
    });

  } catch (error) {
    console.error("Create Notification Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create notification",
      error: process.env.NODE_ENV === "development" ? error.message : undefined
    });
  }
};

/**
 * @desc    Get all notifications (Admin)
 * @route   GET /api/admin/notifications
 * @access  Private/Admin
 */
exports.adminGetAllNotifications = async (req, res) => {
  try {
    const {
      type,
      status,
      startDate,
      endDate,
      page = 1,
      limit = 20
    } = req.query;

    const query = {};

    if (type) query.type = type;
    if (status) query.status = status;

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const notifications = await Notification.find(query)
      .populate('createdBy', 'name')
      .select('-recipients')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Notification.countDocuments(query);

    res.status(200).json({
      success: true,
      data: {
        notifications,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / limit),
          total
        }
      }
    });

  } catch (error) {
    console.error("Admin Get Notifications Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch notifications",
      error: process.env.NODE_ENV === "development" ? error.message : undefined
    });
  }
};

/**
 * @desc    Get single notification with details (Admin)
 * @route   GET /api/admin/notifications/:id
 * @access  Private/Admin
 */
exports.adminGetNotification = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid notification ID"
      });
    }

    const notification = await Notification.findById(id)
      .populate('createdBy', 'name')
      .populate('recipients.user', 'name phone email')
      .populate('template', 'name slug')
      .populate('relatedOrder', 'orderNumber')
      .populate('relatedPayment', 'paymentNumber')
      .populate('relatedProduct', 'title');

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found"
      });
    }

    res.status(200).json({
      success: true,
      data: { notification }
    });

  } catch (error) {
    console.error("Admin Get Notification Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch notification",
      error: process.env.NODE_ENV === "development" ? error.message : undefined
    });
  }
};

/**
 * @desc    Cancel scheduled notification (Admin)
 * @route   PUT /api/admin/notifications/:id/cancel
 * @access  Private/Admin
 */
exports.adminCancelNotification = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid notification ID"
      });
    }

    const notification = await Notification.findById(id);

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found"
      });
    }

    if (!["draft", "scheduled"].includes(notification.status)) {
      return res.status(400).json({
        success: false,
        message: "Only draft or scheduled notifications can be cancelled"
      });
    }

    notification.status = "cancelled";
    await notification.save();

    res.status(200).json({
      success: true,
      message: "Notification cancelled"
    });

  } catch (error) {
    console.error("Cancel Notification Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to cancel notification",
      error: process.env.NODE_ENV === "development" ? error.message : undefined
    });
  }
};

/**
 * @desc    Resend notification (Admin)
 * @route   POST /api/admin/notifications/:id/resend
 * @access  Private/Admin
 */
exports.adminResendNotification = async (req, res) => {
  try {
    const { id } = req.params;
    const { failedOnly = true } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid notification ID"
      });
    }

    const notification = await Notification.findById(id)
      .populate('recipients.user', 'name phone email fcmToken');

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found"
      });
    }

    // Process recipients
    let processCount = 0;
    for (const recipient of notification.recipients) {
      // Skip if failedOnly and no failures
      if (failedOnly) {
        const hasFailed = 
          recipient.channels.sms?.failed ||
          recipient.channels.email?.failed ||
          recipient.channels.whatsapp?.failed ||
          recipient.channels.push?.failed;
        
        if (!hasFailed) continue;
      }

      const results = await notificationService.sendToUser({
        user: recipient.user,
        notification,
        channels: notification.channels
      });

      // Update recipient status
      recipient.channels = results;
      processCount++;
    }

    notification.updateStats();
    await notification.save();

    res.status(200).json({
      success: true,
      message: `Notification resent to ${processCount} recipients`,
      data: {
        stats: notification.stats
      }
    });

  } catch (error) {
    console.error("Resend Notification Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to resend notification",
      error: process.env.NODE_ENV === "development" ? error.message : undefined
    });
  }
};

/**
 * @desc    Get notification statistics (Admin)
 * @route   GET /api/admin/notifications/stats
 * @access  Private/Admin
 */
exports.adminGetNotificationStats = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const matchQuery = {};
    
    if (startDate || endDate) {
      matchQuery.createdAt = {};
      if (startDate) matchQuery.createdAt.$gte = new Date(startDate);
      if (endDate) matchQuery.createdAt.$lte = new Date(endDate);
    }

    // Overall stats
    const stats = await Notification.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: null,
          totalNotifications: { $sum: 1 },
          totalRecipients: { $sum: "$stats.totalRecipients" },
          totalSmsSent: { $sum: "$stats.smsSent" },
          totalEmailSent: { $sum: "$stats.emailSent" },
          totalWhatsappSent: { $sum: "$stats.whatsappSent" },
          totalPushSent: { $sum: "$stats.pushSent" },
          totalInAppRead: { $sum: "$stats.inAppRead" }
        }
      }
    ]);

    // By type
    const byType = await Notification.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: "$type",
          count: { $sum: 1 },
          totalRecipients: { $sum: "$stats.totalRecipients" }
        }
      },
      { $sort: { count: -1 } }
    ]);

    // By status
    const byStatus = await Notification.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 }
        }
      }
    ]);

    // Recent notifications
    const recentNotifications = await Notification.find(matchQuery)
      .select('title type status stats.totalRecipients createdAt')
      .sort({ createdAt: -1 })
      .limit(5);

    res.status(200).json({
      success: true,
      data: {
        stats: stats[0] || {
          totalNotifications: 0,
          totalRecipients: 0,
          totalSmsSent: 0,
          totalEmailSent: 0,
          totalWhatsappSent: 0,
          totalPushSent: 0,
          totalInAppRead: 0
        },
        byType,
        byStatus,
        recentNotifications
      }
    });

  } catch (error) {
    console.error("Get Notification Stats Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch notification statistics",
      error: process.env.NODE_ENV === "development" ? error.message : undefined
    });
  }
};

/**
 * @desc    Send quick notification to user (Admin)
 * @route   POST /api/admin/notifications/quick-send
 * @access  Private/Admin
 */
exports.adminQuickSend = async (req, res) => {
  try {
    const {
      userId,
      title,
      message,
      channels = { sms: false, push: true, inApp: true }
    } = req.body;

    if (!userId || !title || !message) {
      return res.status(400).json({
        success: false,
        message: "userId, title, and message are required"
      });
    }

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

    // Create and send notification
    const notification = new Notification({
      title,
      message,
      shortMessage: message.substring(0, 160),
      type: "custom",
      channels,
      targetType: "selected",
      recipients: [{ user: userId, channels: {} }],
      createdBy: req.user._id,
      status: "draft"
    });

    await notification.save();
    await notificationService.processNotification(notification._id);

    res.status(200).json({
      success: true,
      message: "Notification sent",
      data: {
        notificationId: notification._id
      }
    });

  } catch (error) {
    console.error("Quick Send Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to send notification",
      error: process.env.NODE_ENV === "development" ? error.message : undefined
    });
  }
};

/**
 * @desc    Send payment reminder to user (Admin)
 * @route   POST /api/admin/notifications/payment-reminder
 * @access  Private/Admin
 */
exports.adminSendPaymentReminder = async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: "Valid userId is required"
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    if (user.pendingAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: "User has no pending payments"
      });
    }

    // Calculate days overdue (simplified)
    const daysOverdue = 0; // Could calculate based on oldest unpaid order

    const notification = await notificationService.createPaymentReminder(
      user,
      user.pendingAmount,
      daysOverdue,
      req.user._id
    );

    res.status(200).json({
      success: true,
      message: "Payment reminder sent",
      data: {
        notificationId: notification._id
      }
    });

  } catch (error) {
    console.error("Send Payment Reminder Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to send payment reminder",
      error: process.env.NODE_ENV === "development" ? error.message : undefined
    });
  }
};

// ============================================================
// NOTIFICATION TEMPLATES
// ============================================================

/**
 * @desc    Create notification template (Admin)
 * @route   POST /api/admin/notification-templates
 * @access  Private/Admin
 */
exports.adminCreateTemplate = async (req, res) => {
  try {
    const {
      name,
      description,
      type,
      titleTemplate,
      messageTemplate,
      shortMessageTemplate,
      emailSubjectTemplate,
      emailBodyTemplate,
      whatsappTemplateName,
      variables,
      defaultChannels
    } = req.body;

    if (!name || !type || !titleTemplate || !messageTemplate) {
      return res.status(400).json({
        success: false,
        message: "name, type, titleTemplate, and messageTemplate are required"
      });
    }

    const template = await NotificationTemplate.create({
      name,
      description,
      type,
      titleTemplate,
      messageTemplate,
      shortMessageTemplate,
      emailSubjectTemplate,
      emailBodyTemplate,
      whatsappTemplateName,
      variables,
      defaultChannels,
      createdBy: req.user._id
    });

    res.status(201).json({
      success: true,
      message: "Template created",
      data: { template }
    });

  } catch (error) {
    console.error("Create Template Error:", error);
    
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Template with this name already exists"
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to create template",
      error: process.env.NODE_ENV === "development" ? error.message : undefined
    });
  }
};

/**
 * @desc    Get all templates (Admin)
 * @route   GET /api/admin/notification-templates
 * @access  Private/Admin
 */
exports.adminGetTemplates = async (req, res) => {
  try {
    const { type, isActive } = req.query;

    const query = {};
    if (type) query.type = type;
    if (isActive !== undefined) query.isActive = isActive === "true";

    const templates = await NotificationTemplate.find(query)
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: { templates }
    });

  } catch (error) {
    console.error("Get Templates Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch templates",
      error: process.env.NODE_ENV === "development" ? error.message : undefined
    });
  }
};

/**
 * @desc    Update template (Admin)
 * @route   PUT /api/admin/notification-templates/:id
 * @access  Private/Admin
 */
exports.adminUpdateTemplate = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid template ID"
      });
    }

    const template = await NotificationTemplate.findByIdAndUpdate(
      id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!template) {
      return res.status(404).json({
        success: false,
        message: "Template not found"
      });
    }

    res.status(200).json({
      success: true,
      message: "Template updated",
      data: { template }
    });

  } catch (error) {
    console.error("Update Template Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update template",
      error: process.env.NODE_ENV === "development" ? error.message : undefined
    });
  }
};

/**
 * @desc    Delete template (Admin)
 * @route   DELETE /api/admin/notification-templates/:id
 * @access  Private/Admin
 */
exports.adminDeleteTemplate = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid template ID"
      });
    }

    const template = await NotificationTemplate.findByIdAndDelete(id);

    if (!template) {
      return res.status(404).json({
        success: false,
        message: "Template not found"
      });
    }

    res.status(200).json({
      success: true,
      message: "Template deleted"
    });

  } catch (error) {
    console.error("Delete Template Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete template",
      error: process.env.NODE_ENV === "development" ? error.message : undefined
    });
  }
};