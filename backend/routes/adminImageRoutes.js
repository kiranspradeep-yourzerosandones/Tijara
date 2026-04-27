// backend/routes/adminImageRoutes.js
const express = require("express");
const router = express.Router();

const {
  getStats,
  getOrphanedImages,
  cleanupAll,
  deleteSelected,
  getAllImages
} = require("../controllers/imageController");

const { protect } = require("../middleware/auth");
const { adminOnly, superAdminOnly } = require("../middleware/adminAuth");

// All routes require admin authentication
router.use(protect);
router.use(adminOnly);

// Get routes
router.get("/stats", getStats);
router.get("/orphaned", getOrphanedImages);
router.get("/all", getAllImages);

// Delete routes
router.post("/delete", deleteSelected);
router.delete("/cleanup", superAdminOnly, cleanupAll); // Only superadmin can bulk delete

module.exports = router;