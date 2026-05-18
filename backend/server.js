// backend/server.js
const express = require("express");
const cors = require("cors");
const path = require("path");
const helmet = require("helmet");
const compression = require("compression");
const rateLimit = require("express-rate-limit");
const mongoSanitize = require("./middleware/sanitize");
const hpp = require("hpp");
require("dotenv").config();

const connectDB = require("./config/db");

const app = express();

// ============================================================
// SECURITY MIDDLEWARE
// ============================================================

// ✅ Security headers
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
}));

// ✅ Compress responses
app.use(compression());

// ✅ Sanitize MongoDB queries (prevent injection)
app.use(mongoSanitize());

// ✅ Prevent HTTP parameter pollution
app.use(hpp());

// ✅ Global rate limiter
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  message: {
    success: false,
    message: "Too many requests. Please try again later."
  },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use("/api", globalLimiter);

// ✅ Strict rate limiter for auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  message: {
    success: false,
    message: "Too many auth attempts. Please try again in 15 minutes."
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// ✅ OTP rate limiter (very strict)
const otpLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  message: {
    success: false,
    message: "Too many OTP requests. Please try again in 1 hour."
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// ============================================================
// CORS
// ============================================================
app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? ["https://your-frontend.onrender.com"]
    : "*",
  credentials: true
}));

// ============================================================
// BODY PARSING
// ============================================================
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// ============================================================
// STATIC FILES
// ============================================================
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ============================================================
// ROUTES
// ============================================================

// Auth routes with rate limiting
app.use("/api/auth", authLimiter, require("./routes/authRoutes"));

// OTP routes with strict limiting
app.use("/api/auth/register/send-otp", otpLimiter);
app.use("/api/auth/login/send-otp", otpLimiter);
app.use("/api/auth/forgot-password/send-otp", otpLimiter);

// Other routes
app.use("/api/products", require("./routes/productRoutes"));
app.use("/api/categories", require("./routes/categoryRoutes"));
app.use("/api/locations", require("./routes/locationRoutes"));
app.use("/api/cart", require("./routes/cartRoutes"));
app.use("/api/orders", require("./routes/orderRoutes"));
app.use("/api/payments", require("./routes/paymentRoutes"));
app.use("/api/notifications", require("./routes/notificationRoutes"));

// Admin routes
app.use("/api/admin", require("./routes/adminRoutes"));
app.use("/api/admin/admins", require("./routes/adminManagementRoutes"));
app.use("/api/admin/customers", require("./routes/adminCustomerRoutes"));
app.use("/api/admin/orders", require("./routes/adminOrderRoutes"));
app.use("/api/admin/payments", require("./routes/adminPaymentRoutes"));
app.use("/api/admin/dashboard", require("./routes/adminDashboardRoutes"));
app.use("/api/admin/carts", require("./routes/adminCartRoutes"));
app.use("/api/admin/notifications", require("./routes/adminNotificationRoutes"));
app.use("/api/admin/images", require("./routes/adminImageRoutes"));

// ============================================================
// HEALTH CHECK
// ============================================================
app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "API Running",
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString()
  });
});

// ============================================================
// 404 HANDLER
// ============================================================
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`
  });
});

// ============================================================
// GLOBAL ERROR HANDLER
// ============================================================
app.use((err, req, res, next) => {
  console.error("❌ Unhandled Error:", err);

  // Mongoose validation error
  if (err.name === "ValidationError") {
    const messages = Object.values(err.errors).map(e => e.message);
    return res.status(400).json({
      success: false,
      message: messages.join(", ")
    });
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return res.status(400).json({
      success: false,
      message: `${field} already exists`
    });
  }

  // JWT errors
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

  // Default
  res.status(err.status || 500).json({
    success: false,
    message: process.env.NODE_ENV === "development"
      ? err.message
      : "Something went wrong"
  });
});

// ============================================================
// START SERVER
// ============================================================
const PORT = process.env.PORT || 5000;

connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`✅ Server running on port ${PORT}`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV}`);
    });
  })
  .catch(err => {
    console.error("❌ DB connection failed:", err.message);
    process.exit(1);
  });