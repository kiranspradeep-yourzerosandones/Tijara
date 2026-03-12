const express = require("express");
const router = express.Router();

const {
  adminCreateNotification,
  adminGetAllNotifications,
  adminGetNotification,
  adminCancelNotification,
  adminResendNotification,
  adminGetNotificationStats,
  adminQuickSend,
  adminSendPaymentReminder,
  adminCreateTemplate,
  adminGetTemplates,
  adminUpdateTemplate,
  adminDeleteTemplate
} = require("../controllers/notificationController");

const { protect } = require("../middleware/auth");
const { adminOnly } = require("../middleware/adminAuth");

// All routes require admin authentication
router.use(protect);
router.use(adminOnly);

// Statistics
router.get("/stats", adminGetNotificationStats);

// Quick actions
router.post("/quick-send", adminQuickSend);
router.post("/payment-reminder", adminSendPaymentReminder);

// Notification CRUD
router.post("/", adminCreateNotification);
router.get("/", adminGetAllNotifications);
router.get("/:id", adminGetNotification);
router.put("/:id/cancel", adminCancelNotification);
router.post("/:id/resend", adminResendNotification);

// Templates
router.post("/templates", adminCreateTemplate);
router.get("/templates", adminGetTemplates);
router.put("/templates/:id", adminUpdateTemplate);
router.delete("/templates/:id", adminDeleteTemplate);

module.exports = router;