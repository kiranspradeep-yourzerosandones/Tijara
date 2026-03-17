const express = require("express");
const router = express.Router();

const {
  adminLogin,
  getMe,
  createAdmin
} = require("../controllers/adminAuthController");

const { protect } = require("../middleware/auth");
const { adminOnly, superAdminOnly } = require("../middleware/adminAuth");

// Public routes
router.post("/login", adminLogin);

// Protected routes
router.get("/me", protect, adminOnly, getMe);
router.post("/create-admin", protect, superAdminOnly, createAdmin);

module.exports = router;