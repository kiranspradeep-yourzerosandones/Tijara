// backend/routes/adminLocationRoutes.js
const express = require("express");
const router = express.Router();

const {
  adminGetAllLocations,
  adminGetLocation,
  adminGetUserLocations
} = require("../controllers/locationController");

const { protect } = require("../middleware/auth");
const { adminOnly, checkPermission } = require("../middleware/adminAuth");

// All routes require admin authentication
router.use(protect);
router.use(adminOnly);

// Admin location routes
router.get("/", checkPermission("manageCustomers"), adminGetAllLocations);
router.get("/:id", checkPermission("manageCustomers"), adminGetLocation);

module.exports = router;