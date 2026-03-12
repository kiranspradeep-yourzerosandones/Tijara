const express = require("express");
const router = express.Router();

const {
  getDashboardOverview,
  getRecentActivities,
  getOrderAnalytics,
  getRevenueAnalytics,
  getCustomerAnalytics,
  getProductAnalytics,
  getSalesReport,
  getPaymentReport,
  getOutstandingReport,
  getQuickStats
} = require("../controllers/dashboardController");

const { protect } = require("../middleware/auth");
const { adminOnly } = require("../middleware/adminAuth");

// All routes require admin authentication
router.use(protect);
router.use(adminOnly);

// Main dashboard
router.get("/", getDashboardOverview);
router.get("/quick-stats", getQuickStats);
router.get("/activities", getRecentActivities);

// Analytics
router.get("/orders/analytics", getOrderAnalytics);
router.get("/revenue/analytics", getRevenueAnalytics);
router.get("/customers/analytics", getCustomerAnalytics);
router.get("/products/analytics", getProductAnalytics);

// Reports
router.get("/reports/sales", getSalesReport);
router.get("/reports/payments", getPaymentReport);
router.get("/reports/outstanding", getOutstandingReport);

module.exports = router;