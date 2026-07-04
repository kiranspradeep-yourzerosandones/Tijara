// backend/services/pushService.js
const axios = require("axios");

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";
const EXPO_RECEIPTS_URL = "https://exp.host/--/api/v2/push/getReceipts";

class PushService {
  constructor() {
    this.isConfigured = true;
    this.accessToken = process.env.EXPO_ACCESS_TOKEN || null;
    console.log("🔔 Push notification service initialized (Expo Push API)");
    if (this.accessToken) {
      console.log("🔔 Expo access token loaded ✅");
    } else {
      console.warn("⚠️  EXPO_ACCESS_TOKEN not set — push may fail for dev builds");
    }
  }

  // ── Build auth headers ─────────────────────────────────────
  getHeaders() {
    const headers = {
      "Accept":          "application/json",
      "Accept-Encoding": "gzip, deflate",
      "Content-Type":    "application/json",
    };
    if (this.accessToken) {
      headers["Authorization"] = `Bearer ${this.accessToken}`;
    }
    return headers;
  }

  // ── Validate Expo push token ───────────────────────────────
  isValidExpoToken(token) {
    return (
      token &&
      typeof token === "string" &&
      token.startsWith("ExponentPushToken[")
    );
  }

  // ── Send to single device ──────────────────────────────────
  async sendToDevice({ token, title, body, data = {}, sound = "default" }) {
    try {
      if (!token) {
        return { success: false, message: "No push token provided" };
      }

      if (process.env.NODE_ENV === "development") {
        console.log("========================================");
        console.log("🔔 PUSH NOTIFICATION");
        console.log(`Token: ${token.substring(0, 30)}...`);
        console.log(`Title: ${title}`);
        console.log(`Body:  ${body}`);
        console.log("========================================");
      }

      if (!this.isValidExpoToken(token)) {
        console.warn(`⚠️ Invalid Expo push token: ${token?.substring(0, 20)}`);
        return { success: false, message: "Invalid push token format" };
      }

      const message = {
        to:        token,
        title,
        body,
        data,
        sound,
        priority:  "high",
        channelId: data?.channelId || "default",
      };

      const response = await axios.post(
        EXPO_PUSH_URL,
        message,
        {
          headers: this.getHeaders(),
          timeout: 10000,
        }
      );

      const result = response.data?.data;

      if (result?.status === "error") {
        console.error("🔔 Expo push error:", result.message);
        return {
          success: false,
          message: result.message,
          details: result.details,
        };
      }

      console.log(`🔔 Push sent successfully to ${token.substring(0, 30)}...`);

      return {
        success:  true,
        message:  "Push notification sent",
        ticketId: result?.id,
      };

    } catch (error) {
      const errMsg = error.response?.data?.error || error.message;
      console.error("🔔 Push send error:", error.response?.data || error.message);
      return { success: false, message: errMsg };
    }
  }

  // ── Send to multiple devices (batch) ──────────────────────
  async sendToMultiple({ tokens, title, body, data = {} }) {
    try {
      if (!tokens || tokens.length === 0) {
        return { success: false, message: "No tokens provided" };
      }

      const validTokens = tokens.filter((t) => this.isValidExpoToken(t));

      if (validTokens.length === 0) {
        return { success: false, message: "No valid Expo push tokens" };
      }

      if (process.env.NODE_ENV === "development") {
        console.log(`🔔 Sending bulk push to ${validTokens.length} devices`);
      }

      const messages = validTokens.map((token) => ({
        to:       token,
        title,
        body,
        data,
        sound:    "default",
        priority: "high",
      }));

      // Expo limit: 100 per request
      const CHUNK_SIZE = 100;
      const results = { sent: 0, failed: 0, details: [] };

      for (let i = 0; i < messages.length; i += CHUNK_SIZE) {
        const chunk = messages.slice(i, i + CHUNK_SIZE);

        const response = await axios.post(
          EXPO_PUSH_URL,
          chunk,
          {
            headers: this.getHeaders(),
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
              error: ticket.message,
            });
          }
        });
      }

      console.log(
        `🔔 Bulk push: ${results.sent} sent, ${results.failed} failed`
      );

      return {
        success: true,
        sent:    results.sent,
        failed:  results.failed,
        details: results.details,
      };

    } catch (error) {
      console.error("🔔 Bulk push error:", error.message);
      return { success: false, message: error.message };
    }
  }

  // ── Check push receipts ────────────────────────────────────
  async checkReceipts(ticketIds) {
    try {
      if (!ticketIds || ticketIds.length === 0) return null;

      const response = await axios.post(
        EXPO_RECEIPTS_URL,
        { ids: ticketIds },
        {
          headers: this.getHeaders(),
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