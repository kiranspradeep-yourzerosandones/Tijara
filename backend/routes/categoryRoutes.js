// backend/routes/categoryRoutes.js
const express = require("express");
const router = express.Router();
const Category = require("../models/Category");
const upload = require("../middleware/upload");
const { deleteImage } = require("../utils/imageCleanup");

const uploadSingle = (req, res, next) => {
  upload.single("image")(req, res, (err) => {
    if (err) {
      return res.status(400).json({
        success: false,
        message: err.message || "File upload error"
      });
    }
    next();
  });
};

// GET ALL
router.get("/", async (req, res) => {
  try {
    const { sortBy = "sortOrder", sortOrder = "asc" } = req.query;
    const allowedSortFields = ["sortOrder", "name", "createdAt"];
    const field = allowedSortFields.includes(sortBy) ? sortBy : "sortOrder";
    const order = sortOrder === "desc" ? -1 : 1;
    const categories = await Category.find().sort({ [field]: order, createdAt: -1 });
    res.json({ success: true, categories });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// CREATE
router.post("/", uploadSingle, async (req, res) => {
  try {
    const { name, description } = req.body;
    if (!name) {
      if (req.file) deleteImage(`/uploads/${req.file.filename}`);
      return res.status(400).json({ success: false, message: "Category name is required" });
    }
    const lastCategory = await Category.findOne().sort({ sortOrder: -1 });
    const sortOrder = lastCategory ? lastCategory.sortOrder + 1 : 0;
    const image = req.file ? `/uploads/${req.file.filename}` : null;
    const category = new Category({ name, description, image, sortOrder });
    await category.save();
    res.status(201).json({ success: true, category });
  } catch (error) {
    if (req.file) deleteImage(`/uploads/${req.file.filename}`);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ✅ REORDER — PUT /categories/reorder
// ⚠️ MUST be registered BEFORE PUT /:id
router.put("/reorder", async (req, res) => {
  try {
    const { orderedIds } = req.body;
    if (!Array.isArray(orderedIds) || orderedIds.length === 0) {
      return res.status(400).json({ success: false, message: "orderedIds array is required" });
    }
    const bulkOps = orderedIds.map((id, index) => ({
      updateOne: {
        filter: { _id: id },
        update: { $set: { sortOrder: index } }
      }
    }));
    await Category.bulkWrite(bulkOps);
    res.json({ success: true, message: "Order saved" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// UPDATE — PUT /categories/:id
// ⚠️ MUST be registered AFTER /reorder
router.put("/:id", uploadSingle, async (req, res) => {
  try {
    const { name, description, removeImage } = req.body;
    const category = await Category.findById(req.params.id);
    if (!category) {
      if (req.file) deleteImage(`/uploads/${req.file.filename}`);
      return res.status(404).json({ success: false, message: "Category not found" });
    }
    if (req.file) {
      if (category.image) deleteImage(category.image);
      category.image = `/uploads/${req.file.filename}`;
    } else if (removeImage === "true") {
      if (category.image) deleteImage(category.image);
      category.image = null;
    }
    if (name) category.name = name;
    if (description !== undefined) category.description = description;
    await category.save();
    res.json({ success: true, category });
  } catch (error) {
    if (req.file) deleteImage(`/uploads/${req.file.filename}`);
    res.status(500).json({ success: false, message: error.message });
  }
});

// DELETE
router.delete("/:id", async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ success: false, message: "Category not found" });
    }
    if (category.image) deleteImage(category.image);
    await Category.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Category deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;