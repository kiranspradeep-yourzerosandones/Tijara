// backend/routes/adminNotificationRoutes.js
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
const { adminOnly, checkPermission } = require("../middleware/adminAuth");

// ── All routes require admin auth ──────────────────────────
router.use(protect);
router.use(adminOnly);

// ── Stats (manageNotifications) ────────────────────────────
router.get(
  "/stats",
  checkPermission("manageNotifications"),
  adminGetNotificationStats
);

// ── Quick actions ──────────────────────────────────────────
router.post(
  "/quick-send",
  checkPermission("manageNotifications"),
  adminQuickSend
);
router.post(
  "/payment-reminder",
  checkPermission("manageNotifications"),
  adminSendPaymentReminder
);

// ── Notification CRUD ──────────────────────────────────────
router.post(
  "/",
  checkPermission("manageNotifications"),
  adminCreateNotification
);
router.get(
  "/",
  checkPermission("manageNotifications"),
  adminGetAllNotifications
);
router.get(
  "/:id",
  checkPermission("manageNotifications"),
  adminGetNotification
);
router.put(
  "/:id/cancel",
  checkPermission("manageNotifications"),
  adminCancelNotification
);
router.post(
  "/:id/resend",
  checkPermission("manageNotifications"),
  adminResendNotification
);

// ── Templates ──────────────────────────────────────────────
router.post(
  "/templates",
  checkPermission("manageNotifications"),
  adminCreateTemplate
);
router.get(
  "/templates",
  checkPermission("manageNotifications"),
  adminGetTemplates
);
router.put(
  "/templates/:id",
  checkPermission("manageNotifications"),
  adminUpdateTemplate
);
router.delete(
  "/templates/:id",
  checkPermission("manageNotifications"),
  adminDeleteTemplate
);

module.exports = router;