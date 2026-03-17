// backend\routes\api.js
const express = require("express");
const router = express.Router();

// Import route modules
const authRoutes = require("./authRoutes");
const adminRoutes = require("./adminRoutes");
const adminCustomerRoutes = require("./adminCustomerRoutes");
const productRoutes = require("./productRoutes");
const categoryRoutes = require("./categoryRoutes");
const orderRoutes = require("./orderRoutes");
const cartRoutes = require("./cartRoutes");
const locationRoutes = require("./locationRoutes");
const paymentRoutes = require("./paymentRoutes");
const notificationRoutes = require("./notificationRoutes");
const adminOrderRoutes = require("./adminOrderRoutes");
const adminPaymentRoutes = require("./adminPaymentRoutes");
const adminDashboardRoutes = require("./adminDashboardRoutes");
const adminLocationRoutes = require("./adminLocationRoutes");
const adminCartRoutes = require("./adminCartRoutes");
const adminNotificationRoutes = require("./adminNotificationRoutes");

// Mount routes
router.use("/auth", authRoutes); // Customer auth
router.use("/admin", adminRoutes); // Admin auth
router.use("/admin/customers", adminCustomerRoutes);
router.use("/products", productRoutes);
router.use("/categories", categoryRoutes);
router.use("/orders", orderRoutes);
router.use("/cart", cartRoutes);
router.use("/locations", locationRoutes);
router.use("/payments", paymentRoutes);
router.use("/notifications", notificationRoutes);
router.use("/admin/orders", adminOrderRoutes);
router.use("/admin/payments", adminPaymentRoutes);
router.use("/admin/dashboard", adminDashboardRoutes);
router.use("/admin/locations", adminLocationRoutes);
router.use("/admin/carts", adminCartRoutes);
router.use("/admin/notifications", adminNotificationRoutes);

// Health check
router.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "API is running",
    timestamp: new Date().toISOString()
  });
});

module.exports = router;