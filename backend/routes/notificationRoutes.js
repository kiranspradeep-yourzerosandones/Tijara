const express = require("express");
const router = express.Router();

const {
  getMyNotifications,
  markAsRead,
  markAllAsRead,
  getUnreadCount
} = require("../controllers/notificationController");

const { protect } = require("../middleware/auth");

// All routes require authentication
router.use(protect);

// Notification routes
router.get("/", getMyNotifications);
router.get("/unread-count", getUnreadCount);
router.put("/read-all", markAllAsRead);
router.put("/:id/read", markAsRead);

module.exports = router;