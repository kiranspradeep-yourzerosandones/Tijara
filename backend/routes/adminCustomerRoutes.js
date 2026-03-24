// backend/routes/adminCustomerRoutes.js
const express = require("express");
const router = express.Router();
const upload = require("../middleware/upload");

const {
  getAllCustomers,
  getCustomer,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  resetCustomerPassword,
  toggleCustomerStatus,
  updateCreditSettings,
  getCustomerStats,
  sendPasswordResetToCustomer,
  exportCustomers
} = require("../controllers/adminCustomerController");

const { protect } = require("../middleware/auth");
const { adminOnly, checkPermission } = require("../middleware/adminAuth");

// All routes require admin authentication
router.use(protect);
router.use(adminOnly);

// Customer statistics & export - viewReports or manageCustomers
router.get("/stats", checkPermission("viewReports"), getCustomerStats);
router.get("/export", checkPermission("manageCustomers"), exportCustomers);

// Customer CRUD with profile image upload - manageCustomers permission
router.get("/", checkPermission("manageCustomers"), getAllCustomers);
router.get("/:id", checkPermission("manageCustomers"), getCustomer);
router.post("/", checkPermission("manageCustomers"), upload.single("profileImage"), createCustomer);
router.put("/:id", checkPermission("manageCustomers"), upload.single("profileImage"), updateCustomer);
router.delete("/:id", checkPermission("manageCustomers"), deleteCustomer);

// Customer actions - manageCustomers permission
router.put("/:id/reset-password", checkPermission("manageCustomers"), resetCustomerPassword);
router.put("/:id/toggle-status", checkPermission("manageCustomers"), toggleCustomerStatus);
router.put("/:id/credit", checkPermission("managePayments"), updateCreditSettings);
router.post("/:id/send-reset-email", checkPermission("manageCustomers"), sendPasswordResetToCustomer);

module.exports = router;