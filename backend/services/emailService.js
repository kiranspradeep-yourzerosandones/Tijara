const nodemailer = require("nodemailer");

class EmailService {
  constructor() {
    this.transporter = null;
    this.isConfigured = false;
    this.init();
  }

  init() {
    try {
      // Check if SMTP is configured
      if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
        console.log("📧 Email service not configured (SMTP settings missing)");
        console.log("   Required: SMTP_HOST, SMTP_USER, SMTP_PASS");
        return;
      }

      // Create transporter
      this.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT) || 587,
        secure: process.env.SMTP_SECURE === "true", // true for 465, false for other ports
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        },
        // Gmail specific settings
        ...(process.env.SMTP_HOST === "smtp.gmail.com" && {
          tls: {
            rejectUnauthorized: false
          }
        })
      });

      this.isConfigured = true;
      console.log("📧 Email service initialized (Nodemailer)");

      // Verify connection on startup (optional)
      this.verify().then(result => {
        if (result.success) {
          console.log("📧 SMTP connection verified");
        } else {
          console.warn("📧 SMTP verification failed:", result.message);
        }
      });

    } catch (error) {
      console.error("📧 Email service initialization failed:", error.message);
    }
  }

  /**
   * Get sender address
   */
  getSender() {
    const name = process.env.EMAIL_FROM_NAME || "Tijara";
    const address = process.env.EMAIL_FROM_ADDRESS || process.env.SMTP_USER;
    return `${name} <${address}>`;
  }

  /**
   * Send email
   * @param {Object} options
   * @param {string|Array} options.to - Recipient email(s)
   * @param {string} options.subject - Email subject
   * @param {string} options.text - Plain text body
   * @param {string} options.html - HTML body (optional)
   * @param {Array} options.attachments - Attachments (optional)
   */
  async sendEmail({ to, subject, text, html, attachments = [] }) {
    try {
      // Development mode - log instead of sending
      if (process.env.NODE_ENV === "development" && !this.isConfigured) {
        console.log("========================================");
        console.log("📧 EMAIL (Dev Mode - Not Sent)");
        console.log(`To: ${Array.isArray(to) ? to.join(", ") : to}`);
        console.log(`Subject: ${subject}`);
        console.log(`Body: ${text?.substring(0, 200)}...`);
        console.log("========================================");
        return { 
          success: true, 
          message: "Email logged (dev mode - SMTP not configured)",
          devMode: true
        };
      }

      if (!this.isConfigured) {
        console.warn("📧 Email not sent - service not configured");
        return { 
          success: false, 
          message: "Email service not configured" 
        };
      }

      const mailOptions = {
        from: this.getSender(),
        to: Array.isArray(to) ? to.join(", ") : to,
        subject,
        text,
        html: html || this.textToHtml(text),
        attachments
      };

      const info = await this.transporter.sendMail(mailOptions);

      console.log(`📧 Email sent successfully`);
      console.log(`   To: ${mailOptions.to}`);
      console.log(`   Subject: ${subject}`);
      console.log(`   MessageId: ${info.messageId}`);

      return {
        success: true,
        messageId: info.messageId,
        message: "Email sent successfully"
      };

    } catch (error) {
      console.error("📧 Email send error:", error.message);
      
      // Provide helpful error messages
      let friendlyMessage = error.message;
      if (error.code === "EAUTH") {
        friendlyMessage = "SMTP authentication failed. Check username/password.";
      } else if (error.code === "ESOCKET") {
        friendlyMessage = "Could not connect to SMTP server. Check host/port.";
      }

      return {
        success: false,
        message: friendlyMessage,
        error: error.message
      };
    }
  }

  /**
   * Convert plain text to basic HTML
   */
  textToHtml(text) {
    if (!text) return "";
    return `<p>${text.replace(/\n/g, "<br>")}</p>`;
  }

  /**
   * Send notification email with Tijara branding
   */
  async sendNotificationEmail({ to, title, message, actionUrl, actionText = "View Details" }) {
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      margin: 0;
      padding: 0;
      background-color: #f5f5f5;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background: #ffffff;
    }
    .header {
      background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
      color: white;
      padding: 30px 20px;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      font-size: 28px;
      font-weight: 700;
    }
    .content {
      padding: 30px 20px;
      background: #ffffff;
    }
    .content h2 {
      color: #1f2937;
      margin-top: 0;
      margin-bottom: 15px;
      font-size: 22px;
    }
    .content p {
      color: #4b5563;
      margin-bottom: 20px;
      font-size: 16px;
    }
    .button {
      display: inline-block;
      padding: 14px 28px;
      background: #2563eb;
      color: #ffffff !important;
      text-decoration: none;
      border-radius: 8px;
      font-weight: 600;
      font-size: 16px;
      margin-top: 10px;
    }
    .button:hover {
      background: #1d4ed8;
    }
    .footer {
      padding: 20px;
      text-align: center;
      font-size: 13px;
      color: #9ca3af;
      background: #f9fafb;
      border-top: 1px solid #e5e7eb;
    }
    .footer a {
      color: #6b7280;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Tijara</h1>
    </div>
    <div class="content">
      <h2>${title}</h2>
      <p>${message.replace(/\n/g, "<br>")}</p>
      ${actionUrl ? `<a href="${actionUrl}" class="button">${actionText}</a>` : ""}
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} Tijara. All rights reserved.</p>
      <p>This is an automated message. Please do not reply directly to this email.</p>
    </div>
  </div>
</body>
</html>
    `;

    return this.sendEmail({
      to,
      subject: title,
      text: message,
      html
    });
  }

  /**
   * Send order confirmation email
   */
  async sendOrderEmail({ to, orderNumber, items, total, deliveryAddress }) {
    const itemsHtml = items.map(item => `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">${item.productSnapshot?.title || item.productTitle}</td>
        <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; text-align: center;">${item.quantity}</td>
        <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; text-align: right;">₹${item.subtotal.toLocaleString('en-IN')}</td>
      </tr>
    `).join("");

    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Order Confirmation - ${orderNumber}</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background: #f5f5f5;">
  <div style="max-width: 600px; margin: 0 auto; background: #fff;">
    <div style="background: #2563eb; color: white; padding: 30px 20px; text-align: center;">
      <h1 style="margin: 0;">Tijara</h1>
    </div>
    <div style="padding: 30px 20px;">
      <h2 style="color: #059669; margin-top: 0;">✅ Order Confirmed!</h2>
      <p>Thank you for your order. Here are your order details:</p>
      
      <div style="background: #f9fafb; padding: 15px; border-radius: 8px; margin: 20px 0;">
        <strong>Order Number:</strong> ${orderNumber}
      </div>

      <h3>Order Items</h3>
      <table style="width: 100%; border-collapse: collapse;">
        <thead>
          <tr style="background: #f3f4f6;">
            <th style="padding: 10px; text-align: left;">Product</th>
            <th style="padding: 10px; text-align: center;">Qty</th>
            <th style="padding: 10px; text-align: right;">Subtotal</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml}
        </tbody>
        <tfoot>
          <tr>
            <td colspan="2" style="padding: 15px 10px; text-align: right; font-weight: bold;">Total:</td>
            <td style="padding: 15px 10px; text-align: right; font-weight: bold; font-size: 18px;">₹${total.toLocaleString('en-IN')}</td>
          </tr>
        </tfoot>
      </table>

      <h3>Delivery Address</h3>
      <div style="background: #f9fafb; padding: 15px; border-radius: 8px;">
        <strong>${deliveryAddress.shopName}</strong><br>
        ${deliveryAddress.addressLine1}<br>
        ${deliveryAddress.addressLine2 ? deliveryAddress.addressLine2 + "<br>" : ""}
        ${deliveryAddress.city}, ${deliveryAddress.state} - ${deliveryAddress.pincode}<br>
        Phone: ${deliveryAddress.contactPhone}
      </div>

      <p style="margin-top: 30px;">We'll notify you when your order is shipped.</p>
    </div>
    <div style="padding: 20px; text-align: center; font-size: 13px; color: #9ca3af; background: #f9fafb;">
      <p>© ${new Date().getFullYear()} Tijara. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
    `;

    return this.sendEmail({
      to,
      subject: `Order Confirmed - ${orderNumber}`,
      text: `Your order ${orderNumber} has been confirmed. Total: ₹${total}`,
      html
    });
  }

  /**
   * Send payment receipt email
   */
  async sendPaymentReceiptEmail({ to, paymentNumber, orderNumber, amount, method, date }) {
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Payment Receipt - ${paymentNumber}</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background: #f5f5f5;">
  <div style="max-width: 600px; margin: 0 auto; background: #fff;">
    <div style="background: #2563eb; color: white; padding: 30px 20px; text-align: center;">
      <h1 style="margin: 0;">Tijara</h1>
    </div>
    <div style="padding: 30px 20px;">
      <h2 style="color: #059669; margin-top: 0;">💰 Payment Received</h2>
      <p>Thank you for your payment. Here's your receipt:</p>
      
      <table style="width: 100%; margin: 20px 0; border-collapse: collapse;">
        <tr>
          <td style="padding: 10px; background: #f9fafb; width: 40%;">Receipt Number</td>
          <td style="padding: 10px; font-weight: bold;">${paymentNumber}</td>
        </tr>
        <tr>
          <td style="padding: 10px; background: #f9fafb;">Order Number</td>
          <td style="padding: 10px;">${orderNumber}</td>
        </tr>
        <tr>
          <td style="padding: 10px; background: #f9fafb;">Amount</td>
          <td style="padding: 10px; font-weight: bold; font-size: 18px; color: #059669;">₹${amount.toLocaleString('en-IN')}</td>
        </tr>
        <tr>
          <td style="padding: 10px; background: #f9fafb;">Payment Method</td>
          <td style="padding: 10px;">${method}</td>
        </tr>
        <tr>
          <td style="padding: 10px; background: #f9fafb;">Date</td>
          <td style="padding: 10px;">${new Date(date).toLocaleDateString('en-IN', { dateStyle: 'long' })}</td>
        </tr>
      </table>

      <p>If you have any questions, please contact our support team.</p>
    </div>
    <div style="padding: 20px; text-align: center; font-size: 13px; color: #9ca3af; background: #f9fafb;">
      <p>© ${new Date().getFullYear()} Tijara. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
    `;

    return this.sendEmail({
      to,
      subject: `Payment Receipt - ${paymentNumber}`,
      text: `Payment of ₹${amount} received for order ${orderNumber}. Receipt: ${paymentNumber}`,
      html
    });
  }

  /**
   * Verify SMTP connection
   */
  async verify() {
    if (!this.isConfigured) {
      return { success: false, message: "Not configured" };
    }

    try {
      await this.transporter.verify();
      return { success: true, message: "SMTP connection verified" };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }
}

module.exports = new EmailService();