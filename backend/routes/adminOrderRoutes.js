const express = require("express");
const router = express.Router();

const {
  adminGetAllOrders,
  adminGetOrder,
  adminUpdateOrderStatus,
  adminUpdatePaymentStatus,
  adminAddNote,
  adminGetOrderStats,
  adminGenerateDeliveryOtp,
  adminVerifyDeliveryOtp
} = require("../controllers/orderController");

const { protect } = require("../middleware/auth");
const { adminOnly } = require("../middleware/adminAuth");

// All routes require admin authentication
router.use(protect);
router.use(adminOnly);

// Order statistics
router.get("/stats", adminGetOrderStats);

// Order CRUD
router.get("/", adminGetAllOrders);
router.get("/:id", adminGetOrder);

// Order actions
router.put("/:id/status", adminUpdateOrderStatus);
router.put("/:id/payment", adminUpdatePaymentStatus);
router.put("/:id/notes", adminAddNote);

// Delivery OTP
router.post("/:id/delivery-otp", adminGenerateDeliveryOtp);
router.post("/:id/verify-delivery", adminVerifyDeliveryOtp);

module.exports = router;