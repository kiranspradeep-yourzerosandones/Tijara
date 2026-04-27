// backend/controllers/imageController.js
const {
  findOrphanedImages,
  cleanupOrphanedImages,
  deleteSpecificImages,
  getStorageStats,
  getImageDetails,
  getAllUploadedImages,
  getUsedImages
} = require("../utils/imageCleanup");

// @desc    Get storage statistics
// @route   GET /api/admin/images/stats
// @access  Private/Admin
exports.getStats = async (req, res) => {
  try {
    const stats = await getStorageStats();

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error("Get Storage Stats Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get storage stats",
      error: error.message
    });
  }
};

// @desc    Get orphaned images
// @route   GET /api/admin/images/orphaned
// @access  Private/Admin
exports.getOrphanedImages = async (req, res) => {
  try {
    const result = await findOrphanedImages();

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error("Get Orphaned Images Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get orphaned images",
      error: error.message
    });
  }
};

// @desc    Delete all orphaned images
// @route   DELETE /api/admin/images/cleanup
// @access  Private/SuperAdmin
exports.cleanupAll = async (req, res) => {
  try {
    const result = await cleanupOrphanedImages();

    res.json({
      success: true,
      message: `Cleaned up ${result.deleted} orphaned images`,
      data: result
    });
  } catch (error) {
    console.error("Cleanup Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to cleanup images",
      error: error.message
    });
  }
};

// @desc    Delete specific images
// @route   POST /api/admin/images/delete
// @access  Private/Admin
exports.deleteSelected = async (req, res) => {
  try {
    const { filenames } = req.body;

    if (!filenames || !Array.isArray(filenames) || filenames.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Please provide filenames array"
      });
    }

    const result = await deleteSpecificImages(filenames);

    res.json({
      success: true,
      message: `Deleted ${result.deleted} images`,
      data: result
    });
  } catch (error) {
    console.error("Delete Selected Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete images",
      error: error.message
    });
  }
};

// @desc    Get all images with usage info
// @route   GET /api/admin/images/all
// @access  Private/Admin
exports.getAllImages = async (req, res) => {
  try {
    const allImages = getAllUploadedImages();
    const usedImages = await getUsedImages();

    const images = allImages.map(filename => {
      const details = getImageDetails(filename);
      return {
        ...details,
        isUsed: usedImages.includes(filename)
      };
    }).filter(Boolean);

    // Sort: orphaned first, then by date
    images.sort((a, b) => {
      if (a.isUsed !== b.isUsed) return a.isUsed ? 1 : -1;
      return new Date(b.createdAt) - new Date(a.createdAt);
    });

    res.json({
      success: true,
      data: {
        images,
        total: images.length,
        used: images.filter(i => i.isUsed).length,
        orphaned: images.filter(i => !i.isUsed).length
      }
    });
  } catch (error) {
    console.error("Get All Images Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get images",
      error: error.message
    });
  }
};

module.exports = exports;