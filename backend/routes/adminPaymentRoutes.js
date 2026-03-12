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
const { adminOnly } = require("../middleware/adminAuth");

// All routes require admin authentication
router.use(protect);
router.use(adminOnly);

// Payment statistics
router.get("/stats", adminGetPaymentStats);

// Overdue report
router.get("/overdue", adminGetOverdueReport);

// Payment CRUD
router.post("/", adminRecordPayment);
router.get("/", adminGetAllPayments);
router.get("/:id", adminGetPayment);
router.put("/:id", adminUpdatePayment);
router.put("/:id/cancel", adminCancelPayment);

module.exports = router;