const express = require("express");
const router = express.Router();

const {
  getMyPayments,
  getPayment,
  getMyCreditSummary,
  getOrderPayments,
  getOutstandingPayments
} = require("../controllers/paymentController");

const { protect } = require("../middleware/auth");

// All routes require authentication
router.use(protect);

// Credit summary
router.get("/credit-summary", getMyCreditSummary);

// Outstanding payments
router.get("/outstanding", getOutstandingPayments);

// Order payments
router.get("/order/:orderId", getOrderPayments);

// Payment history
router.get("/", getMyPayments);
router.get("/:id", getPayment);

module.exports = router;