const axios = require("axios");

class PushService {
  constructor() {
    this.isConfigured = false;
    this.fcmUrl = "https://fcm.googleapis.com/fcm/send";
    this.init();
  }

  init() {
    if (process.env.FCM_SERVER_KEY) {
      this.isConfigured = true;
      console.log("🔔 Push notification service initialized");
    } else {
      console.log("🔔 Push service not configured (FCM_SERVER_KEY missing)");
    }
  }

  /**
   * Send push notification to single device
   * @param {Object} options
   * @param {string} options.token - FCM device token
   * @param {string} options.title - Notification title
   * @param {string} options.body - Notification body
   * @param {Object} options.data - Additional data payload
   * @param {string} options.imageUrl - Image URL (optional)
   */
  async sendToDevice({ token, title, body, data = {}, imageUrl }) {
    try {
      if (!token) {
        return { success: false, message: "No FCM token provided" };
      }

      // Development mode
      if (process.env.NODE_ENV === "development" && !this.isConfigured) {
        console.log("========================================");
        console.log("🔔 PUSH NOTIFICATION (Dev Mode)");
        console.log(`Token: ${token.substring(0, 20)}...`);
        console.log(`Title: ${title}`);
        console.log(`Body: ${body}`);
        console.log("========================================");
        return { success: true, message: "Push logged (dev mode)" };
      }

      if (!this.isConfigured) {
        return { success: false, message: "Push service not configured" };
      }

      const payload = {
        to: token,
        notification: {
          title,
          body,
          sound: "default",
          badge: 1
        },
        data: {
          ...data,
          click_action: "FLUTTER_NOTIFICATION_CLICK"
        }
      };

      if (imageUrl) {
        payload.notification.image = imageUrl;
      }

      const response = await axios.post(this.fcmUrl, payload, {
        headers: {
          "Authorization": `key=${process.env.FCM_SERVER_KEY}`,
          "Content-Type": "application/json"
        },
        timeout: 10000
      });

      console.log(`🔔 Push sent to token: ${token.substring(0, 20)}...`);

      return {
        success: response.data.success === 1,
        messageId: response.data.results?.[0]?.message_id,
        message: "Push notification sent"
      };

    } catch (error) {
      console.error("🔔 Push send error:", error.message);
      return {
        success: false,
        message: error.response?.data?.error || error.message
      };
    }
  }

  /**
   * Send push notification to multiple devices
   * @param {Array} tokens - Array of FCM tokens
   * @param {Object} notification - Notification content
   */
  async sendToMultiple({ tokens, title, body, data = {}, imageUrl }) {
    try {
      if (!tokens || tokens.length === 0) {
        return { success: false, message: "No tokens provided" };
      }

      // Development mode
      if (process.env.NODE_ENV === "development" && !this.isConfigured) {
        console.log("========================================");
        console.log("🔔 BULK PUSH NOTIFICATION (Dev Mode)");
        console.log(`Tokens: ${tokens.length}`);
        console.log(`Title: ${title}`);
        console.log(`Body: ${body}`);
        console.log("========================================");
        return { 
          success: true, 
          message: "Push logged (dev mode)",
          sent: tokens.length,
          failed: 0
        };
      }

      if (!this.isConfigured) {
        return { success: false, message: "Push service not configured" };
      }

      const payload = {
        registration_ids: tokens,
        notification: {
          title,
          body,
          sound: "default"
        },
        data: {
          ...data,
          click_action: "FLUTTER_NOTIFICATION_CLICK"
        }
      };

      if (imageUrl) {
        payload.notification.image = imageUrl;
      }

      const response = await axios.post(this.fcmUrl, payload, {
        headers: {
          "Authorization": `key=${process.env.FCM_SERVER_KEY}`,
          "Content-Type": "application/json"
        },
        timeout: 30000
      });

      console.log(`🔔 Bulk push sent: ${response.data.success} success, ${response.data.failure} failed`);

      return {
        success: true,
        sent: response.data.success,
        failed: response.data.failure,
        results: response.data.results
      };

    } catch (error) {
      console.error("🔔 Bulk push error:", error.message);
      return {
        success: false,
        message: error.response?.data?.error || error.message
      };
    }
  }
}

module.exports = new PushService();