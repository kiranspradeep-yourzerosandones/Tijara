// backend/routes/productRoutes.js
const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const { adminOnly, checkPermission } = require("../middleware/adminAuth");
const upload = require("../middleware/upload");

const {
  createProduct,
  getAllProducts,
  getProduct,
  getProductBySlug,
  updateProduct,
  deleteProduct,
  searchProducts,
  getLowStockProducts,
  updateStock
} = require("../controllers/productController");

// Public routes
router.get("/search", searchProducts);
router.get("/slug/:slug", getProductBySlug);
router.get("/", getAllProducts);
router.get("/:id", getProduct);

// Admin-only routes with permission checks
router.post("/", protect, adminOnly, checkPermission("manageProducts"), upload.array("images", 5), createProduct);
router.put("/:id", protect, adminOnly, checkPermission("manageProducts"), upload.array("images", 5), updateProduct);
router.delete("/:id", protect, adminOnly, checkPermission("manageProducts"), deleteProduct);
router.get("/admin/low-stock", protect, adminOnly, checkPermission("manageProducts"), getLowStockProducts);
router.put("/:id/stock", protect, adminOnly, checkPermission("manageProducts"), updateStock);

module.exports = router;