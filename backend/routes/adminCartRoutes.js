// backend/routes/adminCartRoutes.js
const express = require("express");
const router = express.Router();

const {
  adminGetAllCarts,
  adminGetUserCart
} = require("../controllers/cartController");

const { protect } = require("../middleware/auth");
const { adminOnly, checkPermission } = require("../middleware/adminAuth");

// All routes require admin authentication
router.use(protect);
router.use(adminOnly);

// Admin cart routes - manageOrders permission (to see customer carts)
router.get("/", checkPermission("manageOrders"), adminGetAllCarts);

module.exports = router;