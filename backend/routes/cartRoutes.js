const express = require("express");
const router = express.Router();

const {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
  getCartSummary,
  syncCartPrices,
  validateCart
} = require("../controllers/cartController");

const { protect } = require("../middleware/auth");

// All routes require authentication
router.use(protect);

// Cart routes
router.get("/", getCart);
router.get("/summary", getCartSummary);
router.get("/validate", validateCart);

router.post("/add", addToCart);
router.put("/update", updateCartItem);
router.put("/sync-prices", syncCartPrices);

router.delete("/remove/:productId", removeFromCart);
router.delete("/clear", clearCart);

module.exports = router;