// backend/routes/adminOrderRoutes.js
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
const { adminOnly, checkPermission } = require("../middleware/adminAuth");

// All routes require admin authentication
router.use(protect);
router.use(adminOnly);

// Order statistics - viewReports permission
router.get("/stats", checkPermission("viewReports"), adminGetOrderStats);

// Order CRUD - manageOrders permission
router.get("/", checkPermission("manageOrders"), adminGetAllOrders);
router.get("/:id", checkPermission("manageOrders"), adminGetOrder);

// Order actions - manageOrders permission
router.put("/:id/status", checkPermission("manageOrders"), adminUpdateOrderStatus);
router.put("/:id/payment", checkPermission("managePayments"), adminUpdatePaymentStatus);
router.put("/:id/notes", checkPermission("manageOrders"), adminAddNote);

// Delivery OTP - manageOrders permission
router.post("/:id/delivery-otp", checkPermission("manageOrders"), adminGenerateDeliveryOtp);
router.post("/:id/verify-delivery", checkPermission("manageOrders"), adminVerifyDeliveryOtp);

module.exports = router;