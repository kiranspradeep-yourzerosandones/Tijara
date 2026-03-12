const axios = require("axios");

class WhatsAppService {
  constructor() {
    this.isConfigured = false;
    this.baseUrl = "https://api.msg91.com/api/v5/whatsapp";
    this.init();
  }

  init() {
    if (process.env.MSG91_AUTH_KEY) {
      this.isConfigured = true;
      this.authKey = process.env.MSG91_AUTH_KEY;
      this.integratedNumber = process.env.MSG91_INTEGRATED_NUMBER;
      console.log("💬 WhatsApp service initialized (MSG91)");
    } else {
      console.log("💬 WhatsApp service not configured (MSG91_AUTH_KEY missing)");
    }
  }

  /**
   * Format phone number for WhatsApp (add country code)
   */
  formatPhone(phone) {
    // Remove all non-digits
    let cleaned = phone.replace(/\D/g, "");
    
    // Remove leading 0 if present
    if (cleaned.startsWith("0")) {
      cleaned = cleaned.substring(1);
    }
    
    // Add country code if 10 digits (Indian number)
    if (cleaned.length === 10) {
      cleaned = "91" + cleaned;
    }
    
    return cleaned;
  }

  /**
   * Send WhatsApp template message via MSG91
   * @param {Object} options
   * @param {string} options.phone - Phone number (10 digits or with country code)
   * @param {string} options.templateName - MSG91 approved template name
   * @param {Object} options.variables - Template variables
   */
  async sendTemplateMessage({ phone, templateName, variables = {} }) {
    try {
      const formattedPhone = this.formatPhone(phone);

      // Development mode
      if (process.env.NODE_ENV === "development" && !this.isConfigured) {
        console.log("========================================");
        console.log("💬 WHATSAPP TEMPLATE (Dev Mode - Not Sent)");
        console.log(`Phone: ${formattedPhone}`);
        console.log(`Template: ${templateName}`);
        console.log(`Variables: ${JSON.stringify(variables)}`);
        console.log("========================================");
        return { 
          success: true, 
          message: "WhatsApp logged (dev mode)",
          devMode: true
        };
      }

      if (!this.isConfigured) {
        console.warn("💬 WhatsApp not sent - service not configured");
        return { 
          success: false, 
          message: "WhatsApp service not configured" 
        };
      }

      // MSG91 WhatsApp API payload
      const payload = {
        integrated_number: this.integratedNumber,
        content_type: "template",
        payload: {
          to: formattedPhone,
          type: "template",
          template: {
            name: templateName,
            language: {
              code: "en",
              policy: "deterministic"
            },
            components: this.buildTemplateComponents(variables)
          }
        }
      };

      console.log("💬 Sending WhatsApp template:", templateName);
      console.log("   Payload:", JSON.stringify(payload, null, 2));

      const response = await axios.post(
        `${this.baseUrl}/whatsapp/outbound/send/`,
        payload,
        {
          headers: {
            "authkey": this.authKey,
            "Content-Type": "application/json"
          },
          timeout: 15000
        }
      );

      console.log("💬 MSG91 Response:", response.data);

      if (response.data && (response.data.type === "success" || response.status === 200)) {
        console.log(`💬 WhatsApp sent to ${formattedPhone}`);
        return {
          success: true,
          messageId: response.data.data?.id || response.data.request_id,
          message: "WhatsApp message sent"
        };
      }

      return {
        success: false,
        message: response.data?.message || "Failed to send WhatsApp"
      };

    } catch (error) {
      console.error("💬 WhatsApp error:", error.response?.data || error.message);
      return {
        success: false,
        message: error.response?.data?.message || error.message
      };
    }
  }

  /**
   * Build template components for MSG91
   */
  buildTemplateComponents(variables) {
    const components = [];

    // Header variables (if any)
    if (variables.header) {
      components.push({
        type: "header",
        parameters: Array.isArray(variables.header) 
          ? variables.header.map(v => ({ type: "text", text: String(v) }))
          : [{ type: "text", text: String(variables.header) }]
      });
    }

    // Body variables
    if (variables.body && Object.keys(variables.body).length > 0) {
      const bodyParams = Object.values(variables.body).map(v => ({
        type: "text",
        text: String(v)
      }));
      
      components.push({
        type: "body",
        parameters: bodyParams
      });
    }

    // If variables is a simple array, treat as body params
    if (Array.isArray(variables)) {
      components.push({
        type: "body",
        parameters: variables.map(v => ({ type: "text", text: String(v) }))
      });
    }

    return components;
  }

  /**
   * Send simple text message via MSG91 (session message)
   * Note: This only works within 24-hour session window
   * @param {Object} options
   * @param {string} options.phone - Phone number
   * @param {string} options.message - Text message
   */
  async sendTextMessage({ phone, message }) {
    try {
      const formattedPhone = this.formatPhone(phone);

      // Development mode
      if (process.env.NODE_ENV === "development" && !this.isConfigured) {
        console.log("========================================");
        console.log("💬 WHATSAPP TEXT (Dev Mode - Not Sent)");
        console.log(`Phone: ${formattedPhone}`);
        console.log(`Message: ${message}`);
        console.log("========================================");
        return { 
          success: true, 
          message: "WhatsApp logged (dev mode)",
          devMode: true
        };
      }

      if (!this.isConfigured) {
        return { 
          success: false, 
          message: "WhatsApp service not configured" 
        };
      }

      const payload = {
        integrated_number: this.integratedNumber,
        content_type: "text",
        payload: {
          to: formattedPhone,
          type: "text",
          text: {
            body: message
          }
        }
      };

      const response = await axios.post(
        `${this.baseUrl}/whatsapp/outbound/send/`,
        payload,
        {
          headers: {
            "authkey": this.authKey,
            "Content-Type": "application/json"
          },
          timeout: 15000
        }
      );

      if (response.data && response.status === 200) {
        console.log(`💬 WhatsApp text sent to ${formattedPhone}`);
        return {
          success: true,
          messageId: response.data.data?.id,
          message: "WhatsApp message sent"
        };
      }

      return {
        success: false,
        message: response.data?.message || "Failed to send WhatsApp"
      };

    } catch (error) {
      console.error("💬 WhatsApp text error:", error.response?.data || error.message);
      return {
        success: false,
        message: error.response?.data?.message || error.message
      };
    }
  }

  /**
   * Send notification via WhatsApp
   * Uses template if available, falls back to text
   */
  async sendNotification({ phone, title, message, templateName, templateVariables }) {
    // If template is provided, use template message
    if (templateName) {
      return this.sendTemplateMessage({
        phone,
        templateName,
        variables: templateVariables || { body: [title, message] }
      });
    }

    // Otherwise, try text message (only works in session)
    return this.sendTextMessage({
      phone,
      message: `*${title}*\n\n${message}`
    });
  }

  /**
   * Send order update notification
   */
  async sendOrderUpdate({ phone, orderNumber, status, message }) {
    // Use a pre-approved template for order updates
    // You need to create this template in MSG91 dashboard first
    return this.sendTemplateMessage({
      phone,
      templateName: "order_update", // Create this template in MSG91
      variables: {
        body: [orderNumber, status, message]
      }
    });
  }

  /**
   * Send payment reminder
   */
  async sendPaymentReminder({ phone, customerName, amount, dueDate }) {
    return this.sendTemplateMessage({
      phone,
      templateName: "payment_reminder", // Create this template in MSG91
      variables: {
        body: [customerName, amount, dueDate]
      }
    });
  }

  /**
   * Send bulk WhatsApp messages
   */
  async sendBulk({ phones, templateName, variables }) {
    const results = {
      sent: 0,
      failed: 0,
      details: []
    };

    for (const phone of phones) {
      try {
        const result = await this.sendTemplateMessage({
          phone,
          templateName,
          variables
        });

        if (result.success) {
          results.sent++;
        } else {
          results.failed++;
        }

        results.details.push({
          phone,
          ...result
        });

        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 200));

      } catch (error) {
        results.failed++;
        results.details.push({
          phone,
          success: false,
          message: error.message
        });
      }
    }

    return results;
  }

  /**
   * Check if service is configured and ready
   */
  isReady() {
    return this.isConfigured;
  }
}

module.exports = new WhatsAppService();