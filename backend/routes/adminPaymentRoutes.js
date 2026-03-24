// backend/routes/adminPaymentRoutes.js
const express = require("express");
const router = express.Router();

const {
  adminRecordPayment,
  adminGetAllPayments,
  adminGetPayment,
  adminUpdatePayment,
  adminCancelPayment,
  adminGetPaymentStats,
  adminGetOverdueReport
} = require("../controllers/paymentController");

const { protect } = require("../middleware/auth");
const { adminOnly, checkPermission } = require("../middleware/adminAuth");

// All routes require admin authentication
router.use(protect);
router.use(adminOnly);

// Payment statistics - viewReports permission
router.get("/stats", checkPermission("viewReports"), adminGetPaymentStats);

// Overdue report - viewReports permission
router.get("/overdue", checkPermission("viewReports"), adminGetOverdueReport);

// Payment CRUD - managePayments permission
router.post("/", checkPermission("managePayments"), adminRecordPayment);
router.get("/", checkPermission("managePayments"), adminGetAllPayments);
router.get("/:id", checkPermission("managePayments"), adminGetPayment);
router.put("/:id", checkPermission("managePayments"), adminUpdatePayment);
router.put("/:id/cancel", checkPermission("managePayments"), adminCancelPayment);

module.exports = router;