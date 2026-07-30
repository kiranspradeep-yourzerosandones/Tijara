// backend/routes/bannerRoutes.js
const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const { adminOnly, checkPermission } = require("../middleware/adminAuth");
const upload = require("../middleware/upload");

const {
  getActiveBanners,
  getAllBanners,
  getBanner,
  createBanner,
  updateBanner,
  deleteBanner,
  reorderBanners,
  toggleBanner,
} = require("../controllers/bannerController");

// ── Public (mobile) ───────────────────────────────────────────
router.get("/", getActiveBanners);

// ── Admin ─────────────────────────────────────────────────────
router.get(
  "/admin",
  protect,
  adminOnly,
  checkPermission("manageProducts"),
  getAllBanners
);

router.get(
  "/admin/:id",
  protect,
  adminOnly,
  checkPermission("manageProducts"),
  getBanner
);

router.post(
  "/admin",
  protect,
  adminOnly,
  checkPermission("manageProducts"),
  upload.single("image"),
  createBanner
);

router.put(
  "/admin/reorder",
  protect,
  adminOnly,
  checkPermission("manageProducts"),
  reorderBanners
);

router.put(
  "/admin/:id",
  protect,
  adminOnly,
  checkPermission("manageProducts"),
  upload.single("image"),
  updateBanner
);

router.patch(
  "/admin/:id/toggle",
  protect,
  adminOnly,
  checkPermission("manageProducts"),
  toggleBanner
);

router.delete(
  "/admin/:id",
  protect,
  adminOnly,
  checkPermission("manageProducts"),
  deleteBanner
);

module.exports = router;