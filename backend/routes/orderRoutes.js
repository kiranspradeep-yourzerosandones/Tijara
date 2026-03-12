const express = require("express");
const router = express.Router();

const {
  placeOrder,
  getMyOrders,
  getOrder,
  getOrderByNumber,
  cancelOrder,
  getMyOrderStats,
  reorder
} = require("../controllers/orderController");

const { protect } = require("../middleware/auth");

// All routes require authentication
router.use(protect);

// Order statistics
router.get("/stats", getMyOrderStats);

// Order by number (before /:id to avoid conflict)
router.get("/number/:orderNumber", getOrderByNumber);

// CRUD Routes
router.post("/", placeOrder);
router.get("/", getMyOrders);
router.get("/:id", getOrder);

// Order actions
router.put("/:id/cancel", cancelOrder);
router.post("/:id/reorder", reorder);

module.exports = router;