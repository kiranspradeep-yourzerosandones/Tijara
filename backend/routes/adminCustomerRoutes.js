const express = require("express");
const router = express.Router();

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
} = require("../controllers/customerController");

const { protect } = require("../middleware/auth");
const { adminOnly } = require("../middleware/adminAuth");

// All routes require admin authentication
router.use(protect);
router.use(adminOnly);

// Customer statistics
router.get("/stats", getCustomerStats);

// Export customers
router.get("/export", exportCustomers);

// Customer CRUD
router.get("/", getAllCustomers);
router.get("/:id", getCustomer);
router.post("/", createCustomer);
router.put("/:id", updateCustomer);
router.delete("/:id", deleteCustomer); // ✅ NEW - Delete customer

// Customer actions
router.put("/:id/reset-password", resetCustomerPassword);
router.put("/:id/toggle-status", toggleCustomerStatus);
router.put("/:id/credit", updateCreditSettings);
router.post("/:id/send-reset-email", sendPasswordResetToCustomer);

module.exports = router;