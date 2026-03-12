// Tijara\backend\routes\productRoutes.js
const express = require("express");
const router = express.Router();

const upload = require("../middleware/upload");

const {
  createProduct,
  getAllProducts,
  getProduct,
  getProductBySlug,
  updateProduct,
  deleteProduct,
  searchProducts
} = require("../controllers/productController");

router.get("/search", searchProducts);
router.get("/slug/:slug", getProductBySlug);
router.post("/", upload.array("images", 5), createProduct);
router.get("/", getAllProducts);
router.get("/:id", getProduct);
router.put("/:id", upload.array("images", 5), updateProduct);
router.delete("/:id", deleteProduct);

module.exports = router;