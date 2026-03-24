// backend/services/emailService.js
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
          console.log("✅ SMTP connection verified");
        } else {
          console.warn("⚠️ SMTP verification failed:", result.message);
        }
      });

    } catch (error) {
      console.error("❌ Email service initialization failed:", error.message);
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
   * Send password reset email
   */
  async sendPasswordResetEmail({ email, name, resetURL, expiresIn = "15 minutes" }) {
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Password Reset Request</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f5f5f5;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" style="width: 100%; max-width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.07);">
          
          <!-- Header with Gradient -->
          <tr>
            <td style="padding: 40px 40px 30px; background: linear-gradient(135deg, #f59e0b 0%, #ea580c 100%); text-align: center;">
              <div style="display: inline-block; width: 56px; height: 56px; background: rgba(255,255,255,0.2); border-radius: 14px; margin-bottom: 16px;">
                <table role="presentation" style="width: 100%; height: 100%;">
                  <tr>
                    <td align="center" valign="middle">
                      <span style="font-size: 28px; font-weight: 900; color: #ffffff;">T</span>
                    </td>
                  </tr>
                </table>
              </div>
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 700; letter-spacing: -0.5px;">Password Reset Request</h1>
              <p style="margin: 8px 0 0; color: rgba(255,255,255,0.9); font-size: 14px;">Tijara Admin Panel</p>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <p style="margin: 0 0 24px; color: #1f2937; font-size: 16px; line-height: 1.6;">
                Hello <strong style="color: #111827;">${name}</strong>,
              </p>
              
              <p style="margin: 0 0 24px; color: #4b5563; font-size: 15px; line-height: 1.7;">
                We received a request to reset your password for your Tijara Admin account. 
                Click the button below to create a new password:
              </p>

              <!-- CTA Button -->
              <table role="presentation" style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td align="center" style="padding: 24px 0;">
                    <a href="${resetURL}" 
                       style="display: inline-block; 
                              padding: 16px 32px; 
                              background: linear-gradient(135deg, #f59e0b 0%, #ea580c 100%); 
                              color: #ffffff; 
                              text-decoration: none; 
                              font-size: 15px; 
                              font-weight: 600; 
                              border-radius: 10px; 
                              box-shadow: 0 4px 14px rgba(245, 158, 11, 0.4);
                              transition: all 0.3s ease;">
                      🔒 Reset Password
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Info Box -->
              <div style="margin: 24px 0; padding: 16px; background: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 8px;">
                <p style="margin: 0; color: #92400e; font-size: 13px; line-height: 1.6;">
                  <strong>⏰ This link will expire in ${expiresIn}.</strong>
                </p>
              </div>

              <p style="margin: 0 0 16px; color: #6b7280; font-size: 14px; line-height: 1.6;">
                If you didn't request this password reset, please ignore this email or 
                <a href="mailto:support@tijara.com" style="color: #f59e0b; text-decoration: none; font-weight: 500;">contact support</a> 
                if you have concerns.
              </p>

              <!-- Divider -->
              <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 32px 0;">

              <!-- Manual Link -->
              <p style="margin: 0 0 8px; color: #9ca3af; font-size: 12px; line-height: 1.5;">
                If the button doesn't work, copy and paste this link into your browser:
              </p>
              <p style="margin: 0; padding: 12px; background: #f9fafb; border-radius: 8px; word-break: break-all;">
                <a href="${resetURL}" style="color: #f59e0b; font-size: 12px; text-decoration: none;">${resetURL}</a>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 32px 40px; background: #f9fafb; border-top: 1px solid #e5e7eb;">
              <table role="presentation" style="width: 100%;">
                <tr>
                  <td align="center">
                    <p style="margin: 0 0 8px; color: #6b7280; font-size: 13px; font-weight: 500;">
                      Tijara - Admin Panel
                    </p>
                    <p style="margin: 0 0 12px; color: #9ca3af; font-size: 12px;">
                      © ${new Date().getFullYear()} Yourzerosandones Pvt. Ltd. All rights reserved.
                    </p>
                    <p style="margin: 0; color: #9ca3af; font-size: 11px;">
                      This is an automated message, please do not reply directly to this email.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;

    const text = `
Password Reset Request - Tijara Admin

Hello ${name},

We received a request to reset your password for your Tijara Admin account.

Click the link below to create a new password:
${resetURL}

This link will expire in ${expiresIn}.

If you didn't request this password reset, please ignore this email.

---
© ${new Date().getFullYear()} Yourzerosandones Pvt. Ltd.
This is an automated message, please do not reply.
    `;

    return this.sendEmail({
      to: email,
      subject: "🔒 Password Reset Request - Tijara Admin",
      text,
      html
    });
  }

  /**
   * Send password changed confirmation email
   */
  async sendPasswordChangedEmail({ email, name }) {
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Password Changed Successfully</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f5f5f5;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" style="width: 100%; max-width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.07);">
          
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 30px; background: linear-gradient(135deg, #10b981 0%, #059669 100%); text-align: center;">
              <div style="display: inline-block; width: 56px; height: 56px; background: rgba(255,255,255,0.2); border-radius: 50%; margin-bottom: 16px;">
                <table role="presentation" style="width: 100%; height: 100%;">
                  <tr>
                    <td align="center" valign="middle">
                      <span style="font-size: 32px;">✓</span>
                    </td>
                  </tr>
                </table>
              </div>
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 700;">Password Changed</h1>
              <p style="margin: 8px 0 0; color: rgba(255,255,255,0.9); font-size: 14px;">Your account is now secure</p>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <p style="margin: 0 0 24px; color: #1f2937; font-size: 16px; line-height: 1.6;">
                Hello <strong style="color: #111827;">${name}</strong>,
              </p>
              
              <p style="margin: 0 0 24px; color: #4b5563; font-size: 15px; line-height: 1.7;">
                Your password has been successfully changed. If you made this change, no further action is needed.
              </p>

              <!-- Security Notice -->
              <div style="margin: 24px 0; padding: 20px; background: #fef2f2; border-left: 4px solid #ef4444; border-radius: 8px;">
                <p style="margin: 0 0 8px; color: #991b1b; font-size: 14px; font-weight: 600;">
                  ⚠️ Didn't make this change?
                </p>
                <p style="margin: 0; color: #991b1b; font-size: 13px; line-height: 1.6;">
                  If you did not change your password, please 
                  <a href="mailto:support@tijara.com" style="color: #dc2626; text-decoration: none; font-weight: 600;">contact support immediately</a> 
                  and secure your account.
                </p>
              </div>

              <p style="margin: 0; color: #6b7280; font-size: 14px; line-height: 1.6;">
                Changed at: <strong>${new Date().toLocaleString('en-IN', { 
                  dateStyle: 'long', 
                  timeStyle: 'short' 
                })}</strong>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 32px 40px; background: #f9fafb; border-top: 1px solid #e5e7eb;">
              <table role="presentation" style="width: 100%;">
                <tr>
                  <td align="center">
                    <p style="margin: 0 0 8px; color: #6b7280; font-size: 13px; font-weight: 500;">
                      Tijara - Admin Panel
                    </p>
                    <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                      © ${new Date().getFullYear()} Yourzerosandones Pvt. Ltd. All rights reserved.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;

    const text = `
Password Changed Successfully - Tijara Admin

Hello ${name},

Your password has been successfully changed. If you made this change, no further action is needed.

Changed at: ${new Date().toLocaleString('en-IN', { dateStyle: 'long', timeStyle: 'short' })}

⚠️ SECURITY ALERT
If you did not make this change, please contact support immediately at support@tijara.com

---
© ${new Date().getFullYear()} Yourzerosandones Pvt. Ltd.
    `;

    return this.sendEmail({
      to: email,
      subject: "✓ Password Changed Successfully - Tijara Admin",
      text,
      html
    });
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
      background: linear-gradient(135deg, #f59e0b 0%, #ea580c 100%);
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
      background: linear-gradient(135deg, #f59e0b 0%, #ea580c 100%);
      color: #ffffff !important;
      text-decoration: none;
      border-radius: 8px;
      font-weight: 600;
      font-size: 16px;
      margin-top: 10px;
    }
    .button:hover {
      background: linear-gradient(135deg, #d97706 0%, #c2410c 100%);
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
      <p>© ${new Date().getFullYear()} Yourzerosandones Pvt. Ltd. All rights reserved.</p>
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
    <div style="background: linear-gradient(135deg, #f59e0b 0%, #ea580c 100%); color: white; padding: 30px 20px; text-align: center;">
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
      <p>© ${new Date().getFullYear()} Yourzerosandones Pvt. Ltd. All rights reserved.</p>
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
    <div style="background: linear-gradient(135deg, #f59e0b 0%, #ea580c 100%); color: white; padding: 30px 20px; text-align: center;">
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
      <p>© ${new Date().getFullYear()} Yourzerosandones Pvt. Ltd. All rights reserved.</p>
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