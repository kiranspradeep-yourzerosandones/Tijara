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

const { protect } = require("../middleware/auth");
const { adminOnly } = require("../middleware/adminAuth");

// Public admin routes
router.post("/login", adminLogin);

// Protected admin routes
router.get("/users", protect, adminOnly, getAllUsers);
router.get("/users/:id", protect, adminOnly, getUser);
router.put("/users/:id/status", protect, adminOnly, updateUserStatus);
router.post("/create-admin", protect, adminOnly, createAdmin);

// User locations (admin)
router.get("/users/:userId/locations", protect, adminOnly, adminGetUserLocations);

module.exports = router;