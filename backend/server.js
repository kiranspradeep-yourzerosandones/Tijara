// backend/server.js
const express = require("express");
const cors = require("cors");
const path = require("path");
const helmet = require("helmet");
const compression = require("compression");
const rateLimit = require("express-rate-limit");
const mongoSanitize = require("./middleware/sanitize");
const hpp = require("hpp");
const mongoose = require("mongoose");
require("dotenv").config();

const connectDB = require("./config/db");

const app = express();
app.set('trust proxy', 1);

// ============================================================
// SECURITY MIDDLEWARE
// ============================================================
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
}));

app.use((req, res, next) => {
  if (req.path === "/api/admin/sse" || req.originalUrl.startsWith("/api/admin/sse")) {
    return next();
  }
  return compression()(req, res, next);
});

app.use(mongoSanitize());

app.use((req, res, next) => {
  if (req.path === "/api/admin/sse" || req.originalUrl.startsWith("/api/admin/sse")) {
    return next();
  }
  return hpp()(req, res, next);
});

// ============================================================
// CORS
// ============================================================
const getAllowedOrigins = () => {
  if (process.env.NODE_ENV === "development") {
    return true;
  }
  return [
    "https://yourdomain.com",
    "https://admin.yourdomain.com",
  ];
};

app.use(cors({
  origin: getAllowedOrigins(),
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "Accept",
    "X-Requested-With",
  ],
  credentials: true,
  optionsSuccessStatus: 200,
}));

app.options(/.*/, cors());

// SSE route — before any rate limiters
app.use("/api/admin/sse", require("./routes/adminSseRoutes"));

// ============================================================
// RATE LIMITERS
// ============================================================

// Global limiter — generous, just stops floods
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 min
  max: 500,                   // 500 per window
  message: { success: false, message: "Too many requests. Please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) =>
    req.path === "/api/admin/sse" ||
    req.originalUrl.startsWith("/api/admin/sse"),
});
app.use("/api", globalLimiter);

// OTP limiter — tight limit on actual OTP sends (costs money)
const otpLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,  // 1 hour
  max: 20,                    // ← was 5, now 20 (flood protection only)
  message: {
    success: false,
    message: "Too many OTP requests from this network. Please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Auth limiter — only for sensitive non-OTP auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 min
  max: 50,
  message: { success: false, message: "Too many auth attempts. Please try again in 15 minutes." },
  standardHeaders: true,
  legacyHeaders: false,
});

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

// ── OTP routes — tight limit ──────────────────────────────────
app.use("/api/auth/register/send-otp",        otpLimiter);
app.use("/api/auth/login/send-otp",           otpLimiter);
app.use("/api/auth/forgot-password/send-otp", otpLimiter);

// ── Auth routes ───────────────────────────────────────────────
app.use("/api/auth", authLimiter, require("./routes/authRoutes"));

// ── Public routes ─────────────────────────────────────────────
app.use("/api/products",      require("./routes/productRoutes"));
app.use("/api/categories",    require("./routes/categoryRoutes"));
app.use("/api/locations",     require("./routes/locationRoutes"));
app.use("/api/cart",          require("./routes/cartRoutes"));
app.use("/api/orders",        require("./routes/orderRoutes"));
app.use("/api/payments",      require("./routes/paymentRoutes"));
app.use("/api/notifications", require("./routes/notificationRoutes"));

// ── Banners (public GET + admin CRUD) ─────────────────────────
app.use("/api/banners",       require("./routes/bannerRoutes"));

// ── Admin routes ──────────────────────────────────────────────
app.use("/api/admin",                       require("./routes/adminRoutes"));
app.use("/api/admin/admins",                require("./routes/adminManagementRoutes"));
app.use("/api/admin/customers",             require("./routes/adminCustomerRoutes"));
app.use("/api/admin/orders",                require("./routes/adminOrderRoutes"));
app.use("/api/admin/payments",              require("./routes/adminPaymentRoutes"));
app.use("/api/admin/dashboard",             require("./routes/adminDashboardRoutes"));
app.use("/api/admin/carts",                 require("./routes/adminCartRoutes"));
app.use("/api/admin/notifications",         require("./routes/adminNotificationRoutes"));
app.use("/api/admin/images",                require("./routes/adminImageRoutes"));

// ============================================================
// HEALTH CHECK
// ============================================================
app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "API Running",
    environment: process.env.NODE_ENV,
    mongoState: mongoose.connection.readyState,
    timestamp: new Date().toISOString(),
  });
});

// ============================================================
// 404 HANDLER
// ============================================================
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

// ============================================================
// GLOBAL ERROR HANDLER
// ============================================================
app.use((err, req, res, next) => {
  console.error("❌ Unhandled Error:", err);

  if (err.name === "ValidationError") {
    const messages = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({ success: false, message: messages.join(", ") });
  }
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return res.status(400).json({
      success: false,
      message: `${field} already exists`,
    });
  }
  if (err.name === "JsonWebTokenError") {
    return res.status(401).json({ success: false, message: "Invalid token" });
  }
  if (err.name === "TokenExpiredError") {
    return res.status(401).json({ success: false, message: "Token expired" });
  }

  res.status(err.status || 500).json({
    success: false,
    message:
      process.env.NODE_ENV === "development"
        ? err.message
        : "Something went wrong",
  });
});

// ============================================================
// START SERVER
// ============================================================
const PORT = process.env.PORT || 5000;
const HOST = "0.0.0.0";

connectDB()
  .then(() => {
    app.listen(PORT, HOST, () => {
      console.log(`✅ Server running on port ${PORT}`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV}`);
      console.log(`📱 Local:   http://localhost:${PORT}`);
      console.log(`📱 Network: http://192.168.29.69:${PORT}`);
      console.log(
        process.env.NODE_ENV === "development"
          ? "🔓 CORS: Open for all origins (development)"
          : "🔒 CORS: Restricted to allowed origins (production)"
      );
    });
  })
  .catch((err) => {
    console.error("❌ DB connection failed:", err.message);
    process.exit(1);
  });

// ============================================================
// PROCESS STABILITY
// ============================================================
process.on("unhandledRejection", (reason) => {
  console.error("⚠️  Unhandled Rejection:", reason);
});

process.on("uncaughtException", (err) => {
  console.error("⚠️  Uncaught Exception:", err.message);
});

mongoose.connection.on("disconnected", () => {
  console.log("🔄 MongoDB disconnected — reconnecting in 5s...");
  setTimeout(() => {
    mongoose
      .connect(process.env.MONGO_URI)
      .then(() => console.log("✅ MongoDB reconnected"))
      .catch((err) =>
        console.error("❌ MongoDB reconnect failed:", err.message)
      );
  }, 5000);
});

mongoose.connection.on("error", (err) => {
  console.error("❌ MongoDB connection error:", err.message);
});