// backend/utils/imageCleanup.js
const fs = require("fs");
const path = require("path");
const Product = require("../models/Product");

const uploadsDir = path.join(__dirname, "..", "uploads");

/**
 * Delete a single image file
 * @param {string} imagePath - Path like "/uploads/image.jpg" or just "image.jpg"
 */
const deleteImage = (imagePath) => {
  try {
    if (!imagePath) return false;
    
    // Extract filename from path
    let filename = imagePath;
    if (imagePath.startsWith("/uploads/")) {
      filename = imagePath.replace("/uploads/", "");
    }
    
    const fullPath = path.join(uploadsDir, filename);
    
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
      console.log(`🗑️ Deleted image: ${filename}`);
      return true;
    }
    console.log(`⚠️ Image not found: ${filename}`);
    return false;
  } catch (error) {
    console.error(`❌ Error deleting image ${imagePath}:`, error.message);
    return false;
  }
};

/**
 * Delete multiple images
 * @param {string[]} imagePaths - Array of image paths
 */
const deleteImages = (imagePaths) => {
  if (!Array.isArray(imagePaths) || imagePaths.length === 0) {
    return { deleted: 0, failed: 0, deletedFiles: [], failedFiles: [] };
  }
  
  let deleted = 0;
  let failed = 0;
  const deletedFiles = [];
  const failedFiles = [];
  
  imagePaths.forEach(imagePath => {
    if (deleteImage(imagePath)) {
      deleted++;
      deletedFiles.push(imagePath);
    } else {
      failed++;
      failedFiles.push(imagePath);
    }
  });
  
  return { deleted, failed, deletedFiles, failedFiles };
};

/**
 * Get all image files in uploads directory
 */
const getAllUploadedImages = () => {
  try {
    if (!fs.existsSync(uploadsDir)) {
      console.log("📁 Uploads directory doesn't exist");
      return [];
    }
    
    const files = fs.readdirSync(uploadsDir);
    return files.filter(file => {
      const ext = path.extname(file).toLowerCase();
      return [".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg"].includes(ext);
    });
  } catch (error) {
    console.error("Error reading uploads directory:", error);
    return [];
  }
};

/**
 * Get all images used by products in the database
 */
const getUsedImages = async () => {
  try {
    const products = await Product.find({}, "images");
    
    const usedImages = new Set();
    
    products.forEach(product => {
      if (product.images && Array.isArray(product.images)) {
        product.images.forEach(img => {
          // Extract filename from path
          let filename = img;
          if (img.startsWith("/uploads/")) {
            filename = img.replace("/uploads/", "");
          }
          usedImages.add(filename);
        });
      }
    });
    
    return Array.from(usedImages);
  } catch (error) {
    console.error("Error getting used images:", error);
    return [];
  }
};

/**
 * Find orphaned images (in uploads but not used by any product)
 */
const findOrphanedImages = async () => {
  const allImages = getAllUploadedImages();
  const usedImages = await getUsedImages();
  
  const orphaned = allImages.filter(img => !usedImages.includes(img));
  
  // Get file details for orphaned images
  const orphanedDetails = orphaned.map(filename => getImageDetails(filename)).filter(Boolean);
  
  // Calculate total size
  const totalOrphanedSize = orphanedDetails.reduce((acc, img) => acc + (img.size || 0), 0);
  
  return {
    total: allImages.length,
    used: usedImages.length,
    orphaned: orphanedDetails,
    orphanedCount: orphaned.length,
    totalOrphanedSize,
    totalOrphanedSizeFormatted: formatBytes(totalOrphanedSize)
  };
};

/**
 * Delete all orphaned images
 */
const cleanupOrphanedImages = async () => {
  const { orphaned } = await findOrphanedImages();
  
  let deleted = 0;
  let failed = 0;
  const deletedFiles = [];
  const failedFiles = [];
  let freedSpace = 0;
  
  for (const imageInfo of orphaned) {
    const fullPath = path.join(uploadsDir, imageInfo.filename);
    try {
      if (fs.existsSync(fullPath)) {
        const stats = fs.statSync(fullPath);
        fs.unlinkSync(fullPath);
        deleted++;
        freedSpace += stats.size;
        deletedFiles.push(imageInfo.filename);
        console.log(`🗑️ Cleaned up: ${imageInfo.filename}`);
      }
    } catch (error) {
      failed++;
      failedFiles.push(imageInfo.filename);
      console.error(`Failed to delete: ${imageInfo.filename}`, error.message);
    }
  }
  
  return {
    deleted,
    failed,
    deletedFiles,
    failedFiles,
    freedSpace,
    freedSpaceFormatted: formatBytes(freedSpace)
  };
};

/**
 * Delete specific orphaned images by filename
 */
const deleteSpecificImages = async (filenames) => {
  if (!Array.isArray(filenames) || filenames.length === 0) {
    return { deleted: 0, failed: 0, deletedFiles: [], failedFiles: [] };
  }
  
  // Verify these are actually orphaned (not used by any product)
  const usedImages = await getUsedImages();
  
  let deleted = 0;
  let failed = 0;
  const deletedFiles = [];
  const failedFiles = [];
  let freedSpace = 0;
  
  for (const filename of filenames) {
    // Check if image is being used
    if (usedImages.includes(filename)) {
      console.log(`⚠️ Cannot delete ${filename} - still in use by a product`);
      failedFiles.push({ filename, reason: "In use by product" });
      failed++;
      continue;
    }
    
    const fullPath = path.join(uploadsDir, filename);
    try {
      if (fs.existsSync(fullPath)) {
        const stats = fs.statSync(fullPath);
        fs.unlinkSync(fullPath);
        deleted++;
        freedSpace += stats.size;
        deletedFiles.push(filename);
        console.log(`🗑️ Deleted: ${filename}`);
      } else {
        failedFiles.push({ filename, reason: "File not found" });
        failed++;
      }
    } catch (error) {
      failedFiles.push({ filename, reason: error.message });
      failed++;
    }
  }
  
  return {
    deleted,
    failed,
    deletedFiles,
    failedFiles,
    freedSpace,
    freedSpaceFormatted: formatBytes(freedSpace)
  };
};

/**
 * Get image file details
 */
const getImageDetails = (filename) => {
  try {
    const fullPath = path.join(uploadsDir, filename);
    
    if (!fs.existsSync(fullPath)) {
      return null;
    }
    
    const stats = fs.statSync(fullPath);
    
    return {
      filename,
      path: `/uploads/${filename}`,
      size: stats.size,
      sizeFormatted: formatBytes(stats.size),
      createdAt: stats.birthtime,
      modifiedAt: stats.mtime
    };
  } catch (error) {
    return null;
  }
};

/**
 * Get storage statistics
 */
const getStorageStats = async () => {
  const allImages = getAllUploadedImages();
  const usedImages = await getUsedImages();
  
  let totalSize = 0;
  let usedSize = 0;
  let orphanedSize = 0;
  
  allImages.forEach(filename => {
    const details = getImageDetails(filename);
    if (details) {
      totalSize += details.size;
      if (usedImages.includes(filename)) {
        usedSize += details.size;
      } else {
        orphanedSize += details.size;
      }
    }
  });
  
  return {
    totalImages: allImages.length,
    usedImages: usedImages.length,
    orphanedImages: allImages.length - usedImages.length,
    totalSize,
    totalSizeFormatted: formatBytes(totalSize),
    usedSize,
    usedSizeFormatted: formatBytes(usedSize),
    orphanedSize,
    orphanedSizeFormatted: formatBytes(orphanedSize)
  };
};

/**
 * Format bytes to human readable
 */
const formatBytes = (bytes) => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

module.exports = {
  deleteImage,
  deleteImages,
  getAllUploadedImages,
  getUsedImages,
  findOrphanedImages,
  cleanupOrphanedImages,
  deleteSpecificImages,
  getImageDetails,
  getStorageStats,
  formatBytes,
  uploadsDir
};