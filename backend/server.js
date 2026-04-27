const express = require("express");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

const connectDB = require("./config/db");

const app = express();

// CORS
app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? ["https://your-frontend.onrender.com"]
    : "*",
  credentials: true
}));

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Static (temporary only)
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ROUTES
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/products", require("./routes/productRoutes"));
app.use("/api/categories", require("./routes/categoryRoutes"));
app.use("/api/locations", require("./routes/locationRoutes"));
app.use("/api/cart", require("./routes/cartRoutes"));
app.use("/api/orders", require("./routes/orderRoutes"));
app.use("/api/payments", require("./routes/paymentRoutes"));
app.use("/api/notifications", require("./routes/notificationRoutes"));

app.use("/api/admin", require("./routes/adminRoutes"));
app.use("/api/admin/admins", require("./routes/adminManagementRoutes"));
app.use("/api/admin/customers", require("./routes/adminCustomerRoutes"));
app.use("/api/admin/orders", require("./routes/adminOrderRoutes"));
app.use("/api/admin/payments", require("./routes/adminPaymentRoutes"));
app.use("/api/admin/dashboard", require("./routes/adminDashboardRoutes"));
app.use("/api/admin/carts", require("./routes/adminCartRoutes"));
app.use("/api/admin/notifications", require("./routes/adminNotificationRoutes"));
app.use("/api/admin/images", require("./routes/adminImageRoutes"));

// Health
app.get("/api/health", (req, res) => {
  res.json({ success: true, message: "API Running" });
});

// 404
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Not found: ${req.method} ${req.originalUrl}`
  });
});

// Error
app.use((err, req, res, next) => {
  console.error(err.message);
  res.status(500).json({
    success: false,
    message: err.message
  });
});

// START
const PORT = process.env.PORT || 5000;

connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`✅ Server running on port ${PORT}`);
    });
  })
  .catch(err => {
    console.error("❌ DB connection failed:", err.message);
    process.exit(1);
  });