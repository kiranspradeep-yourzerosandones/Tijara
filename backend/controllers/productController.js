const Product = require("../models/Product");
const fs = require("fs");
const path = require("path");

function generateSlug(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

// CREATE PRODUCT
exports.createProduct = async (req, res) => {
  try {
    console.log("Request Body:", req.body);
    console.log("Files:", req.files);

    const { 
      title, 
      shortDescription, 
      description, 
      category, 
      brand, 
      applications, 
      storage,
      price,
      compareAtPrice,
      unit,
      minOrderQuantity,
      maxOrderQuantity,
      inStock
    } = req.body;

    if (!title) {
      return res.status(400).json({ message: "Title is required" });
    }

    if (!category) {
      return res.status(400).json({ message: "Category is required" });
    }

    if (!price || isNaN(parseFloat(price))) {
      return res.status(400).json({ message: "Valid price is required" });
    }

    const images = req.files ? req.files.map(file => `/uploads/${file.filename}`) : [];

    const applicationsArray = applications
      ? applications.split(',').map(app => app.trim()).filter(app => app)
      : [];

    const productData = {
      title,
      category,
      brand,
      shortDescription: shortDescription || "",
      description: description || "",
      images,
      applications: applicationsArray,
      storage,
      price: parseFloat(price),
      compareAtPrice: compareAtPrice ? parseFloat(compareAtPrice) : undefined,
      unit: unit || "piece",
      minOrderQuantity: minOrderQuantity ? parseInt(minOrderQuantity) : 1,
      maxOrderQuantity: maxOrderQuantity ? parseInt(maxOrderQuantity) : 100,
      inStock: inStock !== "false" && inStock !== false
    };

    console.log("Product Data to Save:", productData);

    const product = new Product(productData);
    await product.save();

    console.log("Product Saved:", product);

    res.status(201).json({
      success: true,
      message: "Product created successfully",
      product
    });

  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// GET ALL PRODUCTS
exports.getAllProducts = async (req, res) => {
  try {
    const { 
      category, 
      inStock, 
      minPrice, 
      maxPrice,
      sortBy = "createdAt",
      sortOrder = "desc",
      page = 1,
      limit = 20
    } = req.query;

    const query = { isActive: true };

    // Filter by category
    if (category) {
      query.category = category;
    }

    // Filter by stock status
    if (inStock !== undefined) {
      query.inStock = inStock === "true";
    }

    // Filter by price range
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = parseFloat(minPrice);
      if (maxPrice) query.price.$lte = parseFloat(maxPrice);
    }

    // Sort options
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === "asc" ? 1 : -1;

    const products = await Product.find(query)
      .sort(sortOptions)
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Product.countDocuments(query);

    console.log(`Found ${products.length} products`);

    res.json({
      success: true,
      data: {
        products,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / limit),
          total
        }
      }
    });

  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// GET SINGLE PRODUCT BY ID
exports.getProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found"
      });
    }

    res.json({
      success: true,
      product
    });

  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// GET SINGLE PRODUCT BY SLUG
exports.getProductBySlug = async (req, res) => {
  try {
    const product = await Product.findOne({ slug: req.params.slug });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found"
      });
    }

    res.json({
      success: true,
      product
    });

  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// UPDATE PRODUCT
exports.updateProduct = async (req, res) => {
  try {
    console.log("Update Request Body:", req.body);
    console.log("Update Files:", req.files);

    const { 
      title, 
      shortDescription, 
      description, 
      category, 
      brand, 
      applications, 
      storage, 
      isActive, 
      existingImages,
      price,
      compareAtPrice,
      unit,
      minOrderQuantity,
      maxOrderQuantity,
      inStock
    } = req.body;

    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found"
      });
    }

    let images = [];

    if (existingImages) {
      try {
        images = JSON.parse(existingImages);
      } catch (e) {
        images = [];
      }
    }

    if (req.files && req.files.length > 0) {
      const newImages = req.files.map(file => `/uploads/${file.filename}`);
      images = [...images, ...newImages];
    }

    const applicationsArray = applications
      ? applications.split(',').map(app => app.trim()).filter(app => app)
      : product.applications;

    product.title = title || product.title;
    product.shortDescription = shortDescription !== undefined ? shortDescription : product.shortDescription;
    product.description = description !== undefined ? description : product.description;
    product.category = category || product.category;
    product.brand = brand !== undefined ? brand : product.brand;
    product.applications = applicationsArray;
    product.storage = storage !== undefined ? storage : product.storage;
    product.images = images.length > 0 ? images : product.images;
    product.isActive = isActive === "true" || isActive === true;

    // Update pricing fields
    if (price !== undefined) product.price = parseFloat(price);
    if (compareAtPrice !== undefined) product.compareAtPrice = parseFloat(compareAtPrice) || null;
    if (unit !== undefined) product.unit = unit;
    if (minOrderQuantity !== undefined) product.minOrderQuantity = parseInt(minOrderQuantity);
    if (maxOrderQuantity !== undefined) product.maxOrderQuantity = parseInt(maxOrderQuantity);
    if (inStock !== undefined) product.inStock = inStock === "true" || inStock === true;

    await product.save();

    console.log("Product Updated:", product);

    res.json({
      success: true,
      message: "Product updated successfully",
      product
    });

  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// DELETE PRODUCT
exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found"
      });
    }

    if (product.images && product.images.length > 0) {
      product.images.forEach(img => {
        const imagePath = path.join(__dirname, "..", img);
        if (fs.existsSync(imagePath)) {
          fs.unlinkSync(imagePath);
        }
      });
    }

    await Product.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: "Product deleted"
    });

  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// SEARCH PRODUCTS
exports.searchProducts = async (req, res) => {
  try {
    const { keyword, category } = req.query;

    let query = { isActive: true };

    if (keyword) {
      query.$or = [
        { title: { $regex: keyword, $options: "i" } },
        { shortDescription: { $regex: keyword, $options: "i" } },
        { category: { $regex: keyword, $options: "i" } }
      ];
    }

    if (category) {
      query.category = category;
    }

    const products = await Product.find(query).sort({ createdAt: -1 });

    res.json({
      success: true,
      count: products.length,
      products
    });

  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};