const express = require("express");
const router = express.Router();

const {
  adminGetAllCarts,
  adminGetUserCart
} = require("../controllers/cartController");

const { protect } = require("../middleware/auth");
const { adminOnly } = require("../middleware/adminAuth");

// All routes require admin authentication
router.use(protect);
router.use(adminOnly);

// Admin cart routes
router.get("/", adminGetAllCarts);

module.exports = router;