const express = require("express");
const router = express.Router();

const {
  adminLogin,
  getAllUsers,
  getUser,
  updateUserStatus,
  createAdmin
} = require("../controllers/adminAuthController");

const {
  adminGetUserLocations
} = require("../controllers/locationController");

const {
  adminGetUserCart
} = require("../controllers/cartController");

const {
  adminGetUserOrders
} = require("../controllers/orderController");

const {
  adminGetUserPayments,
  adminUpdateCreditLimit,
  adminToggleCreditBlock
} = require("../controllers/paymentController");

const { protect } = require("../middleware/auth");
const { adminOnly } = require("../middleware/adminAuth");

// Public admin routes
router.post("/login", adminLogin);

// Protected admin routes
router.get("/users", protect, adminOnly, getAllUsers);
router.get("/users/:id", protect, adminOnly, getUser);
router.put("/users/:id/status", protect, adminOnly, updateUserStatus);
router.post("/create-admin", protect, adminOnly, createAdmin);

// User data (admin)
router.get("/users/:userId/locations", protect, adminOnly, adminGetUserLocations);
router.get("/users/:userId/cart", protect, adminOnly, adminGetUserCart);
router.get("/users/:userId/orders", protect, adminOnly, adminGetUserOrders);
router.get("/users/:userId/payments", protect, adminOnly, adminGetUserPayments);

// User credit management (admin)
router.put("/users/:userId/credit-limit", protect, adminOnly, adminUpdateCreditLimit);
router.put("/users/:userId/credit-block", protect, adminOnly, adminToggleCreditBlock);

module.exports = router;