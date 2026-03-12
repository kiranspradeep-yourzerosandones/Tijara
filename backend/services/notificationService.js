const Notification = require("../models/Notification");
const NotificationTemplate = require("../models/NotificationTemplate");
const User = require("../models/User");
const { getMCAuthToken } = require("./messageCentral/token");
const emailService = require("./emailService");
const pushService = require("./pushService");
const whatsappService = require("./whatsappService");
const axios = require("axios");

class NotificationService {
  /**
   * Send SMS using Message Central
   */
  async sendSMS(phone, message) {
    try {
      // Format phone
      let formattedPhone = phone.replace(/\D/g, "");
      if (formattedPhone.length === 10) {
        formattedPhone = "91" + formattedPhone;
      }

      // Development mode
      if (process.env.NODE_ENV === "development") {
        console.log("========================================");
        console.log(`📱 SMS (Dev Mode)`);
        console.log(`To: ${formattedPhone}`);
        console.log(`Message: ${message}`);
        console.log("========================================");
        return { success: true, message: "SMS logged (dev mode)", devMode: true };
      }

      // Check if Message Central is configured
      if (!process.env.MC_CUSTOMER || !process.env.MC_PASSWORD) {
        console.warn("📱 SMS not sent - Message Central not configured");
        return { success: false, message: "SMS service not configured" };
      }

      // Get auth token
      const authToken = await getMCAuthToken(
        process.env.MC_CUSTOMER,
        process.env.MC_PASSWORD
      );

      // Send SMS via Message Central
      const url = "https://cpaas.messagecentral.com/verification/v2/send";
      
      const response = await axios.post(url, null, {
        params: {
          customerId: process.env.MC_CUSTOMER,
          mobileNumber: formattedPhone,
          message: message,
          flowType: "SMS",
          type: "TRANSACTIONAL"
        },
        headers: { authToken },
        timeout: 10000
      });

      console.log(`📱 SMS sent to ${formattedPhone}`);

      return {
        success: true,
        message: "SMS sent successfully"
      };

    } catch (error) {
      console.error("📱 SMS error:", error.response?.data || error.message);
      return {
        success: false,
        message: error.message
      };
    }
  }

  /**
   * Send notification through all specified channels
   */
  async sendToUser({ user, notification, channels }) {
    const results = {
      sms: { sent: false, delivered: false, failed: false, failedReason: null },
      email: { sent: false, delivered: false, failed: false, failedReason: null },
      whatsapp: { sent: false, delivered: false, failed: false, failedReason: null },
      push: { sent: false, delivered: false, failed: false, failedReason: null }
    };

    // SMS (Message Central)
    if (channels.sms && user.phone) {
      try {
        const smsResult = await this.sendSMS(
          user.phone,
          notification.shortMessage || notification.message.substring(0, 160)
        );
        results.sms.sent = smsResult.success;
        results.sms.sentAt = new Date();
        if (smsResult.success && !smsResult.devMode) {
          results.sms.delivered = true;
          results.sms.deliveredAt = new Date();
        } else if (!smsResult.success) {
          results.sms.failed = true;
          results.sms.failedReason = smsResult.message;
        }
      } catch (error) {
        results.sms.failed = true;
        results.sms.failedReason = error.message;
      }
    }

    // Email (Nodemailer)
    if (channels.email && user.email) {
      try {
        const emailResult = await emailService.sendNotificationEmail({
          to: user.email,
          title: notification.title,
          message: notification.message,
          actionUrl: notification.actionUrl
        });
        results.email.sent = emailResult.success;
        results.email.sentAt = new Date();
        if (emailResult.success && !emailResult.devMode) {
          results.email.delivered = true;
          results.email.deliveredAt = new Date();
        } else if (!emailResult.success) {
          results.email.failed = true;
          results.email.failedReason = emailResult.message;
        }
      } catch (error) {
        results.email.failed = true;
        results.email.failedReason = error.message;
      }
    }

    // WhatsApp (MSG91)
    if (channels.whatsapp && user.phone) {
      try {
        const waResult = await whatsappService.sendNotification({
          phone: user.phone,
          title: notification.title,
          message: notification.message,
          // Use template if configured
          templateName: notification.whatsappTemplate,
          templateVariables: {
            body: [notification.title, notification.message]
          }
        });
        results.whatsapp.sent = waResult.success;
        results.whatsapp.sentAt = new Date();
        if (waResult.success && !waResult.devMode) {
          results.whatsapp.delivered = true;
          results.whatsapp.deliveredAt = new Date();
        } else if (!waResult.success) {
          results.whatsapp.failed = true;
          results.whatsapp.failedReason = waResult.message;
        }
      } catch (error) {
        results.whatsapp.failed = true;
        results.whatsapp.failedReason = error.message;
      }
    }

    // Push Notification (FCM)
    if (channels.push && user.fcmToken) {
      try {
        const pushResult = await pushService.sendToDevice({
          token: user.fcmToken,
          title: notification.title,
          body: notification.shortMessage || notification.message.substring(0, 200),
          data: {
            notificationId: notification._id?.toString(),
            type: notification.type,
            actionUrl: notification.actionUrl
          },
          imageUrl: notification.imageUrl
        });
        results.push.sent = pushResult.success;
        results.push.sentAt = new Date();
        if (pushResult.success && !pushResult.devMode) {
          results.push.delivered = true;
          results.push.deliveredAt = new Date();
        } else if (!pushResult.success) {
          results.push.failed = true;
          results.push.failedReason = pushResult.message;
        }
      } catch (error) {
        results.push.failed = true;
        results.push.failedReason = error.message;
      }
    }

    return results;
  }

  /**
   * Process and send a notification
   */
  async processNotification(notificationId) {
    try {
      const notification = await Notification.findById(notificationId)
        .populate('recipients.user', 'name phone email fcmToken');

      if (!notification) {
        throw new Error("Notification not found");
      }

      if (notification.status !== "draft" && notification.status !== "scheduled") {
        throw new Error("Notification already processed");
      }

      // Update status to sending
      notification.status = "sending";
      notification.sentAt = new Date();
      await notification.save();

      let hasFailures = false;
      let successCount = 0;

      // Process each recipient
      for (let i = 0; i < notification.recipients.length; i++) {
        const recipient = notification.recipients[i];
        const user = recipient.user;

        if (!user) continue;

        try {
          const results = await this.sendToUser({
            user,
            notification,
            channels: notification.channels
          });

          // Update recipient status
          notification.recipients[i].channels = results;

          // Check for failures
          const channelResults = Object.values(results);
          const hasSent = channelResults.some(r => r.sent);
          const hasFailed = channelResults.some(r => r.failed);

          if (hasSent) successCount++;
          if (hasFailed) hasFailures = true;

        } catch (error) {
          console.error(`Error sending to user ${user._id}:`, error);
          hasFailures = true;
        }

        // Save progress every 10 recipients
        if (i % 10 === 0) {
          await notification.save();
        }
      }

      // Update final status and stats
      notification.updateStats();
      
      if (successCount === 0) {
        notification.status = "failed";
      } else if (hasFailures) {
        notification.status = "partial";
      } else {
        notification.status = "sent";
      }
      
      notification.completedAt = new Date();
      await notification.save();

      console.log(`📢 Notification ${notification._id} processed:`);
      console.log(`   Recipients: ${notification.stats.totalRecipients}`);
      console.log(`   Status: ${notification.status}`);
      console.log(`   SMS: ${notification.stats.smsSent} sent, ${notification.stats.smsFailed} failed`);
      console.log(`   Email: ${notification.stats.emailSent} sent, ${notification.stats.emailFailed} failed`);
      console.log(`   WhatsApp: ${notification.stats.whatsappSent} sent, ${notification.stats.whatsappFailed} failed`);
      console.log(`   Push: ${notification.stats.pushSent} sent, ${notification.stats.pushFailed} failed`);

      return notification;

    } catch (error) {
      console.error("Process notification error:", error);
      
      // Mark as failed
      await Notification.findByIdAndUpdate(notificationId, {
        status: "failed",
        notes: error.message
      });

      throw error;
    }
  }

  /**
   * Get users based on segment filters
   */
  async getUsersBySegment(filters) {
    const query = { role: "customer", isActive: true };

    if (filters.businessTypes && filters.businessTypes.length > 0) {
      query.businessType = { $in: filters.businessTypes };
    }

    if (filters.hasPendingPayment === true) {
      query.pendingAmount = { $gt: 0 };
    }

    if (filters.isCreditBlocked === true) {
      query.isCreditBlocked = true;
    }

    if (filters.registeredAfter) {
      query.createdAt = { ...query.createdAt, $gte: new Date(filters.registeredAfter) };
    }

    if (filters.registeredBefore) {
      query.createdAt = { ...query.createdAt, $lte: new Date(filters.registeredBefore) };
    }

    // Filter users with email if email channel is required
    if (filters.hasEmail) {
      query.email = { $exists: true, $ne: null, $ne: "" };
    }

    // Filter users with FCM token if push channel is required
    if (filters.hasFcmToken) {
      query.fcmToken = { $exists: true, $ne: null, $ne: "" };
    }

    const users = await User.find(query).select('_id name phone email fcmToken');
    return users;
  }

  /**
   * Render template with variables
   */
  renderTemplate(template, variables) {
    return NotificationTemplate.render(template, variables);
  }

  /**
   * Create quick notification for order updates
   */
  async createOrderNotification(order, status, adminId) {
    const statusMessages = {
      confirmed: "Your order {{orderNumber}} has been confirmed! We're preparing it now.",
      packed: "Great news! Your order {{orderNumber}} is packed and ready for shipping.",
      shipped: "Your order {{orderNumber}} has been shipped! Track your delivery.",
      on_the_way: "Your order {{orderNumber}} is out for delivery. It will arrive soon!",
      delivered: "Your order {{orderNumber}} has been delivered. Thank you for shopping with us!",
      cancelled: "Your order {{orderNumber}} has been cancelled. Contact us for any queries."
    };

    const message = this.renderTemplate(statusMessages[status] || "Order {{orderNumber}} status updated.", {
      orderNumber: order.orderNumber
    });

    const notification = new Notification({
      title: `Order ${status.charAt(0).toUpperCase() + status.slice(1).replace(/_/g, ' ')}`,
      message,
      shortMessage: message.substring(0, 160),
      type: "order_update",
      channels: { sms: true, push: true, inApp: true },
      targetType: "selected",
      recipients: [{
        user: order.user,
        channels: {}
      }],
      relatedOrder: order._id,
      createdBy: adminId,
      status: "draft"
    });

    await notification.save();

    // Process immediately
    await this.processNotification(notification._id);

    return notification;
  }

  /**
   * Create payment reminder notification
   */
  async createPaymentReminder(user, outstandingAmount, daysOverdue, adminId) {
    const message = daysOverdue > 0 
      ? `Hi {{name}}, your payment of ₹{{amount}} is overdue by {{days}} days. Please clear it to continue ordering.`
      : `Hi {{name}}, you have an outstanding payment of ₹{{amount}}. Please clear it at your earliest convenience.`;

    const renderedMessage = this.renderTemplate(message, {
      name: user.name,
      amount: outstandingAmount.toLocaleString('en-IN'),
      days: daysOverdue.toString()
    });

    const channels = {
      sms: true,
      push: true,
      inApp: true,
      whatsapp: daysOverdue > 7, // WhatsApp for overdue > 7 days
      email: !!user.email
    };

    const notification = new Notification({
      title: daysOverdue > 0 ? "Payment Overdue" : "Payment Reminder",
      message: renderedMessage,
      shortMessage: renderedMessage.substring(0, 160),
      type: "payment_reminder",
      priority: daysOverdue > 7 ? "high" : "normal",
      channels,
      targetType: "selected",
      recipients: [{
        user: user._id,
        channels: {}
      }],
      createdBy: adminId,
      status: "draft"
    });

    await notification.save();
    await this.processNotification(notification._id);

    return notification;
  }

  /**
   * Send payment received notification
   */
  async createPaymentReceivedNotification(payment, user, order, adminId) {
    const message = `Thank you! We received your payment of ₹${payment.amount.toLocaleString('en-IN')} for order ${order.orderNumber}.`;

    const notification = new Notification({
      title: "Payment Received 🙏",
      message,
      shortMessage: message.substring(0, 160),
      type: "payment_received",
      channels: { sms: true, push: true, inApp: true, email: !!user.email },
      targetType: "selected",
      recipients: [{
        user: user._id,
        channels: {}
      }],
      relatedPayment: payment._id,
      relatedOrder: order._id,
      createdBy: adminId,
      status: "draft"
    });

    await notification.save();
    await this.processNotification(notification._id);

    // Also send email receipt if email exists
    if (user.email) {
      await emailService.sendPaymentReceiptEmail({
        to: user.email,
        paymentNumber: payment.paymentNumber,
        orderNumber: order.orderNumber,
        amount: payment.amount,
        method: payment.method,
        date: payment.paymentDate
      });
    }

    return notification;
  }
}

module.exports = new NotificationService();