// backend/controllers/bannerController.js
const Banner = require("../models/Banner");
const Product = require("../models/Product");
const { deleteImage } = require("../utils/imageCleanup");

const MAX_BANNERS = 4;

// ── Shared populate fields ────────────────────────────────────
// Enough for ProductDetail screen to render fully without a
// second fetch — includes stock, pricing, brand, category, etc.
const PRODUCT_POPULATE_FIELDS =
  "_id title slug images price compareAtPrice brand category " +
  "inStock trackQuantity stockQuantity lowStockThreshold " +
  "unit minOrderQuantity maxOrderQuantity shortDescription " +
  "description applications storage isActive";

// ─────────────────────────────────────────────────────────────
// PUBLIC: GET active banners (mobile)
// GET /api/banners
// ─────────────────────────────────────────────────────────────
exports.getActiveBanners = async (req, res) => {
  try {
    const banners = await Banner.find({ isActive: true })
      .sort({ order: 1, createdAt: 1 })
      .limit(MAX_BANNERS)
      .populate("actionProductId", PRODUCT_POPULATE_FIELDS);

    res.json({
      success: true,
      banners,
    });
  } catch (error) {
    console.error("getActiveBanners error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────
// ADMIN: GET all banners (including inactive)
// GET /api/banners/admin
// ─────────────────────────────────────────────────────────────
exports.getAllBanners = async (req, res) => {
  try {
    const banners = await Banner.find()
      .sort({ order: 1, createdAt: 1 })
      .populate("actionProductId", PRODUCT_POPULATE_FIELDS);

    res.json({
      success: true,
      count: banners.length,
      banners,
    });
  } catch (error) {
    console.error("getAllBanners error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────
// ADMIN: GET single banner
// GET /api/banners/admin/:id
// ─────────────────────────────────────────────────────────────
exports.getBanner = async (req, res) => {
  try {
    const banner = await Banner.findById(req.params.id).populate(
      "actionProductId",
      PRODUCT_POPULATE_FIELDS
    );

    if (!banner) {
      return res
        .status(404)
        .json({ success: false, message: "Banner not found" });
    }

    res.json({ success: true, banner });
  } catch (error) {
    console.error("getBanner error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────
// ADMIN: CREATE banner
// POST /api/banners/admin
// ─────────────────────────────────────────────────────────────
exports.createBanner = async (req, res) => {
  try {
    // Enforce max 4 banners
    const currentCount = await Banner.countDocuments();
    if (currentCount >= MAX_BANNERS) {
      if (req.file) deleteImage(`/uploads/${req.file.filename}`);
      return res.status(400).json({
        success: false,
        message: `Maximum ${MAX_BANNERS} banners allowed. Delete one before adding.`,
      });
    }

    const {
      title,
      subtitle,
      backgroundColor,
      actionType,
      actionProductId,
      actionCategory,
      actionScreen,
      actionUrl,
      isActive,
      order,
    } = req.body;

    if (!title) {
      if (req.file) deleteImage(`/uploads/${req.file.filename}`);
      return res
        .status(400)
        .json({ success: false, message: "Title is required" });
    }

    // Validate action fields
    const validationError = validateAction(
      actionType,
      actionProductId,
      actionCategory,
      actionScreen,
      actionUrl
    );
    if (validationError) {
      if (req.file) deleteImage(`/uploads/${req.file.filename}`);
      return res.status(400).json({ success: false, message: validationError });
    }

    // Verify product exists if needed
    if (actionType === "product" && actionProductId) {
      const product = await Product.findById(actionProductId);
      if (!product) {
        if (req.file) deleteImage(`/uploads/${req.file.filename}`);
        return res
          .status(404)
          .json({ success: false, message: "Selected product not found" });
      }
    }

    // Determine next order value if not provided
    let bannerOrder = order !== undefined ? parseInt(order) : 0;
    if (order === undefined) {
      const last = await Banner.findOne().sort({ order: -1 });
      bannerOrder = last ? last.order + 1 : 0;
    }

    const bannerData = {
      title:           title.trim(),
      subtitle:        subtitle ? subtitle.trim() : "",
      backgroundColor: backgroundColor || "#2D5A27",
      image:           req.file ? `/uploads/${req.file.filename}` : null,
      actionType:      actionType || "none",
      actionProductId: actionType === "product" ? actionProductId || null : null,
      actionCategory:  actionType === "category" ? actionCategory || null : null,
      actionScreen:    actionType === "screen"   ? actionScreen   || null : null,
      actionUrl:       actionType === "url"       ? actionUrl      || null : null,
      isActive:        isActive !== "false" && isActive !== false,
      order:           bannerOrder,
    };

    const banner = new Banner(bannerData);
    await banner.save();

    await banner.populate("actionProductId", PRODUCT_POPULATE_FIELDS);

    res.status(201).json({
      success: true,
      message: "Banner created successfully",
      banner,
    });
  } catch (error) {
    console.error("createBanner error:", error);
    if (req.file) deleteImage(`/uploads/${req.file.filename}`);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────
// ADMIN: UPDATE banner
// PUT /api/banners/admin/:id
// ─────────────────────────────────────────────────────────────
exports.updateBanner = async (req, res) => {
  try {
    const banner = await Banner.findById(req.params.id);
    if (!banner) {
      if (req.file) deleteImage(`/uploads/${req.file.filename}`);
      return res
        .status(404)
        .json({ success: false, message: "Banner not found" });
    }

    const {
      title,
      subtitle,
      backgroundColor,
      actionType,
      actionProductId,
      actionCategory,
      actionScreen,
      actionUrl,
      isActive,
      order,
      removeImage,
    } = req.body;

    // Validate action
    const resolvedActionType = actionType || banner.actionType;
    const validationError = validateAction(
      resolvedActionType,
      actionProductId,
      actionCategory,
      actionScreen,
      actionUrl
    );
    if (validationError) {
      if (req.file) deleteImage(`/uploads/${req.file.filename}`);
      return res.status(400).json({ success: false, message: validationError });
    }

    // Verify product exists if needed
    if (resolvedActionType === "product" && actionProductId) {
      const product = await Product.findById(actionProductId);
      if (!product) {
        if (req.file) deleteImage(`/uploads/${req.file.filename}`);
        return res
          .status(404)
          .json({ success: false, message: "Selected product not found" });
      }
    }

    // ── Handle image ────────────────────────────────────────
    let newImage = banner.image;

    if (req.file) {
      if (banner.image) deleteImage(banner.image);
      newImage = `/uploads/${req.file.filename}`;
    } else if (removeImage === "true" && banner.image) {
      deleteImage(banner.image);
      newImage = null;
    }

    // ── Apply updates ───────────────────────────────────────
    if (title !== undefined)           banner.title           = title.trim();
    if (subtitle !== undefined)        banner.subtitle        = subtitle.trim();
    if (backgroundColor !== undefined) banner.backgroundColor = backgroundColor;
    if (isActive !== undefined)        banner.isActive        = isActive === "true" || isActive === true;
    if (order !== undefined)           banner.order           = parseInt(order);

    banner.image           = newImage;
    banner.actionType      = resolvedActionType;
    banner.actionProductId = resolvedActionType === "product"  ? actionProductId || null : null;
    banner.actionCategory  = resolvedActionType === "category" ? actionCategory  || null : null;
    banner.actionScreen    = resolvedActionType === "screen"   ? actionScreen    || null : null;
    banner.actionUrl       = resolvedActionType === "url"      ? actionUrl       || null : null;

    await banner.save();
    await banner.populate("actionProductId", PRODUCT_POPULATE_FIELDS);

    res.json({
      success: true,
      message: "Banner updated successfully",
      banner,
    });
  } catch (error) {
    console.error("updateBanner error:", error);
    if (req.file) deleteImage(`/uploads/${req.file.filename}`);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────
// ADMIN: DELETE banner
// DELETE /api/banners/admin/:id
// ─────────────────────────────────────────────────────────────
exports.deleteBanner = async (req, res) => {
  try {
    const banner = await Banner.findById(req.params.id);
    if (!banner) {
      return res
        .status(404)
        .json({ success: false, message: "Banner not found" });
    }

    if (banner.image) {
      deleteImage(banner.image);
    }

    await Banner.findByIdAndDelete(req.params.id);

    res.json({ success: true, message: "Banner deleted successfully" });
  } catch (error) {
    console.error("deleteBanner error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────
// ADMIN: REORDER banners
// PUT /api/banners/admin/reorder
// Body: { orderedIds: ["id1","id2","id3","id4"] }
// ─────────────────────────────────────────────────────────────
exports.reorderBanners = async (req, res) => {
  try {
    const { orderedIds } = req.body;

    if (!Array.isArray(orderedIds) || orderedIds.length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "orderedIds array is required" });
    }

    // Bulk update orders
    const updates = orderedIds.map((id, index) =>
      Banner.findByIdAndUpdate(id, { order: index }, { new: true })
    );

    await Promise.all(updates);

    const banners = await Banner.find()
      .sort({ order: 1 })
      .populate("actionProductId", PRODUCT_POPULATE_FIELDS);

    res.json({
      success: true,
      message: "Banners reordered successfully",
      banners,
    });
  } catch (error) {
    console.error("reorderBanners error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────
// ADMIN: TOGGLE active status
// PATCH /api/banners/admin/:id/toggle
// ─────────────────────────────────────────────────────────────
exports.toggleBanner = async (req, res) => {
  try {
    const banner = await Banner.findById(req.params.id);
    if (!banner) {
      return res
        .status(404)
        .json({ success: false, message: "Banner not found" });
    }

    banner.isActive = !banner.isActive;
    await banner.save();

    res.json({
      success: true,
      message: `Banner ${banner.isActive ? "activated" : "deactivated"}`,
      isActive: banner.isActive,
      banner,
    });
  } catch (error) {
    console.error("toggleBanner error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────
// Helper: validate action fields
// ─────────────────────────────────────────────────────────────
function validateAction(
  actionType,
  actionProductId,
  actionCategory,
  actionScreen,
  actionUrl
) {
  if (!actionType || actionType === "none") return null;

  if (actionType === "product" && !actionProductId) {
    return "A product must be selected for action type 'product'";
  }
  if (actionType === "category" && !actionCategory) {
    return "A category must be provided for action type 'category'";
  }
  if (actionType === "screen" && !actionScreen) {
    return "A screen must be selected for action type 'screen'";
  }
  if (actionType === "url") {
    if (!actionUrl) return "A URL must be provided for action type 'url'";
    try {
      new URL(actionUrl);
    } catch {
      return "Invalid URL format";
    }
  }
  return null;
}