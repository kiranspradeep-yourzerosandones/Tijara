const express = require("express");
const router = express.Router();

const {
  getAllAdmins,
  getAdmin,
  updateAdmin,
  deleteAdmin,
  toggleAdminStatus,
} = require("../controllers/adminManagementController");

const { protect } = require("../middleware/auth");
const { superAdminOnly } = require("../middleware/adminAuth");

// All routes require superadmin
router.use(protect);
router.use(superAdminOnly);

router.get("/", getAllAdmins);
router.get("/:id", getAdmin);
router.put("/:id", updateAdmin);
router.put("/:id/toggle-status", toggleAdminStatus);
router.delete("/:id", deleteAdmin);

module.exports = router;