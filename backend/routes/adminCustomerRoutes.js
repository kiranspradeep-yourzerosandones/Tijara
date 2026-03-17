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
const { adminOnly } = require("../middleware/adminAuth");

// All routes require admin authentication
router.use(protect);
router.use(adminOnly);

// Customer statistics & export
router.get("/stats", getCustomerStats);
router.get("/export", exportCustomers);

// Customer CRUD with profile image upload
router.get("/", getAllCustomers);
router.get("/:id", getCustomer);
router.post("/", upload.single("profileImage"), createCustomer);
router.put("/:id", upload.single("profileImage"), updateCustomer);
router.delete("/:id", deleteCustomer);

// Customer actions
router.put("/:id/reset-password", resetCustomerPassword);
router.put("/:id/toggle-status", toggleCustomerStatus);
router.put("/:id/credit", updateCreditSettings);
router.post("/:id/send-reset-email", sendPasswordResetToCustomer);

module.exports = router;