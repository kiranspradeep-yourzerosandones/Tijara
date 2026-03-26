// backend/routes/notificationRoutes.js
const express = require("express");
const router = express.Router();

const {
  getMyNotifications,
  markAsRead,
  markAllAsRead,
  getUnreadCount
} = require("../controllers/notificationController");

const { protect } = require("../middleware/auth");

console.log("📢 Loading notification routes...");
console.log("✅ getUnreadCount function:", typeof getUnreadCount);

// All routes require authentication
router.use(protect);

// Notification routes - ORDER MATTERS!
router.get("/unread-count", (req, res, next) => {
  console.log("🔔 /unread-count route hit!");
  next();
}, getUnreadCount);

router.get("/", getMyNotifications);
router.put("/read-all", markAllAsRead);
router.put("/:id/read", markAsRead);

console.log("📢 Notification routes loaded successfully");

module.exports = router;