const express = require("express");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

const connectDB = require("./config/db");

const app = express();

// Middleware
app.use(cors({
  origin: process.env.NODE_ENV === "production" 
    ? process.env.FRONTEND_URL 
    : ["http://localhost:3000", "http://localhost:3001", "http://127.0.0.1:3000"],
  credentials: true
}));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Static files
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Helper function to safely load routes
const loadRoute = (routePath, routeName) => {
  try {
    const route = require(routePath);
    if (typeof route === 'function') {
      return route;
    } else {
      console.error(`❌ ${routeName}: Not a valid router (got ${typeof route})`);
      return null;
    }
  } catch (error) {
    console.error(`❌ Error loading ${routeName}:`, error.message);
    return null;
  }
};

// Load all routes
const routes = {
  auth: loadRoute("./routes/authRoutes", "authRoutes"),
  admin: loadRoute("./routes/adminRoutes", "adminRoutes"),
  adminDashboard: loadRoute("./routes/adminDashboardRoutes", "adminDashboardRoutes"),
  adminCustomers: loadRoute("./routes/adminCustomerRoutes", "adminCustomerRoutes"),
  products: loadRoute("./routes/productRoutes", "productRoutes"),
  categories: loadRoute("./routes/categoryRoutes", "categoryRoutes"),
  locations: loadRoute("./routes/locationRoutes", "locationRoutes"),
  adminLocations: loadRoute("./routes/adminLocationRoutes", "adminLocationRoutes"),
  cart: loadRoute("./routes/cartRoutes", "cartRoutes"),
  adminCarts: loadRoute("./routes/adminCartRoutes", "adminCartRoutes"),
  orders: loadRoute("./routes/orderRoutes", "orderRoutes"),
  adminOrders: loadRoute("./routes/adminOrderRoutes", "adminOrderRoutes"),
  payments: loadRoute("./routes/paymentRoutes", "paymentRoutes"),
  adminPayments: loadRoute("./routes/adminPaymentRoutes", "adminPaymentRoutes"),
  notifications: loadRoute("./routes/notificationRoutes", "notificationRoutes"),
  adminNotifications: loadRoute("./routes/adminNotificationRoutes", "adminNotificationRoutes")
};

// Register routes (only if loaded successfully)
if (routes.auth) app.use("/api/auth", routes.auth);
if (routes.admin) app.use("/api/admin", routes.admin);
if (routes.adminDashboard) app.use("/api/admin/dashboard", routes.adminDashboard);
if (routes.adminCustomers) app.use("/api/admin/customers", routes.adminCustomers);
if (routes.adminLocations) app.use("/api/admin/locations", routes.adminLocations);
if (routes.adminCarts) app.use("/api/admin/carts", routes.adminCarts);
if (routes.adminOrders) app.use("/api/admin/orders", routes.adminOrders);
if (routes.adminPayments) app.use("/api/admin/payments", routes.adminPayments);
if (routes.adminNotifications) app.use("/api/admin/notifications", routes.adminNotifications);
if (routes.products) app.use("/api/products", routes.products);
if (routes.categories) app.use("/api/categories", routes.categories);
if (routes.locations) app.use("/api/locations", routes.locations);
if (routes.cart) app.use("/api/cart", routes.cart);
if (routes.orders) app.use("/api/orders", routes.orders);
if (routes.payments) app.use("/api/payments", routes.payments);
if (routes.notifications) app.use("/api/notifications", routes.notifications);

// Health check
app.get("/api/health", (req, res) => {
  res.json({ 
    success: true, 
    message: "Tijara API is running",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development"
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error("Server Error:", err);
  
  if (err.name === "ValidationError") {
    const messages = Object.values(err.errors).map(e => e.message);
    return res.status(400).json({
      success: false,
      message: messages.join(", ")
    });
  }

  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return res.status(400).json({
      success: false,
      message: `${field} already exists`
    });
  }

  if (err.name === "JsonWebTokenError") {
    return res.status(401).json({
      success: false,
      message: "Invalid token"
    });
  }

  if (err.name === "TokenExpiredError") {
    return res.status(401).json({
      success: false,
      message: "Token expired"
    });
  }

  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal server error",
    error: process.env.NODE_ENV === "development" ? err.stack : undefined
  });
});

// Start server
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();

    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📍 Environment: ${process.env.NODE_ENV || "development"}`);
      console.log(`🔗 API URL: http://localhost:${PORT}/api`);
    });
  } catch (error) {
    console.error("Failed to start server:", error.message);
    process.exit(1);
  }
};

startServer();