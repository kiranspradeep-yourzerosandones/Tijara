// backend/services/pushService.js
const axios = require("axios");

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";

class PushService {
  constructor() {
    this.isConfigured = true; // Expo push needs no extra config
    console.log("🔔 Push notification service initialized (Expo Push API)");
  }

  /**
   * Check if token is valid Expo push token
   */
  isValidExpoToken(token) {
    return token && 
      typeof token === "string" && 
      token.startsWith("ExponentPushToken[");
  }

  /**
   * Send to single device
   */
  async sendToDevice({ token, title, body, data = {}, sound = "default" }) {
    try {
      if (!token) {
        return { success: false, message: "No push token provided" };
      }

      // Development mode log
      if (process.env.NODE_ENV === "development") {
        console.log("========================================");
        console.log("🔔 PUSH NOTIFICATION");
        console.log(`Token: ${token.substring(0, 30)}...`);
        console.log(`Title: ${title}`);
        console.log(`Body: ${body}`);
        console.log("========================================");
      }

      if (!this.isValidExpoToken(token)) {
        console.warn(`⚠️ Invalid Expo push token format: ${token?.substring(0, 20)}`);
        return { success: false, message: "Invalid push token format" };
      }

      const message = {
        to: token,
        title,
        body,
        data,
        sound,
        priority: "high",
        channelId: data?.channelId || "default",
      };

      const response = await axios.post(
        EXPO_PUSH_URL,
        message,
        {
          headers: {
            "Accept": "application/json",
            "Accept-Encoding": "gzip, deflate",
            "Content-Type": "application/json",
          },
          timeout: 10000,
        }
      );

      const result = response.data?.data;

      if (result?.status === "error") {
        console.error("🔔 Expo push error:", result.message);
        return { 
          success: false, 
          message: result.message,
          details: result.details
        };
      }

      console.log(`🔔 Push sent successfully to ${token.substring(0, 20)}...`);

      return {
        success: true,
        message: "Push notification sent",
        ticketId: result?.id
      };

    } catch (error) {
      console.error("🔔 Push send error:", error.response?.data || error.message);
      return {
        success: false,
        message: error.response?.data?.error || error.message
      };
    }
  }

  /**
   * Send to multiple devices (batch)
   */
  async sendToMultiple({ tokens, title, body, data = {} }) {
    try {
      if (!tokens || tokens.length === 0) {
        return { success: false, message: "No tokens provided" };
      }

      // Filter valid tokens only
      const validTokens = tokens.filter(t => this.isValidExpoToken(t));

      if (validTokens.length === 0) {
        return { success: false, message: "No valid Expo push tokens" };
      }

      if (process.env.NODE_ENV === "development") {
        console.log(`🔔 Sending bulk push to ${validTokens.length} devices`);
      }

      // Expo push API accepts array of messages
      const messages = validTokens.map(token => ({
        to: token,
        title,
        body,
        data,
        sound: "default",
        priority: "high",
      }));

      // Send in chunks of 100 (Expo limit)
      const CHUNK_SIZE = 100;
      const results = { sent: 0, failed: 0, details: [] };

      for (let i = 0; i < messages.length; i += CHUNK_SIZE) {
        const chunk = messages.slice(i, i + CHUNK_SIZE);

        const response = await axios.post(
          EXPO_PUSH_URL,
          chunk,
          {
            headers: {
              "Accept": "application/json",
              "Content-Type": "application/json",
            },
            timeout: 30000,
          }
        );

        const ticketData = response.data?.data || [];

        ticketData.forEach((ticket, index) => {
          if (ticket.status === "ok") {
            results.sent++;
          } else {
            results.failed++;
            results.details.push({
              token: chunk[index].to,
              error: ticket.message
            });
          }
        });
      }

      console.log(`🔔 Bulk push: ${results.sent} sent, ${results.failed} failed`);

      return {
        success: true,
        sent: results.sent,
        failed: results.failed,
        details: results.details
      };

    } catch (error) {
      console.error("🔔 Bulk push error:", error.message);
      return {
        success: false,
        message: error.message
      };
    }
  }

  /**
   * Check push receipts (verify delivery)
   */
  async checkReceipts(ticketIds) {
    try {
      if (!ticketIds || ticketIds.length === 0) return null;

      const response = await axios.post(
        "https://exp.host/--/api/v2/push/getReceipts",
        { ids: ticketIds },
        {
          headers: {
            "Accept": "application/json",
            "Content-Type": "application/json",
          },
          timeout: 10000,
        }
      );

      return response.data?.data;
    } catch (error) {
      console.error("🔔 Receipt check error:", error.message);
      return null;
    }
  }

  isReady() {
    return this.isConfigured;
  }
}

module.exports = new PushService();