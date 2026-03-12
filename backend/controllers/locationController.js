const Location = require("../models/Location");
const mongoose = require("mongoose");

// ============================================================
// USER LOCATION MANAGEMENT
// ============================================================

/**
 * @desc    Create new location
 * @route   POST /api/locations
 * @access  Private
 */
exports.createLocation = async (req, res) => {
  try {
    const {
      label,
      customLabel,
      shopName,
      contactPerson,
      contactPhone,
      address,
      coordinates,
      deliveryInstructions,
      isDefault
    } = req.body;

    // Validate required fields
    if (!shopName) {
      return res.status(400).json({
        success: false,
        message: "Shop name is required"
      });
    }

    if (!contactPhone) {
      return res.status(400).json({
        success: false,
        message: "Contact phone is required"
      });
    }

    if (!address || !address.line1 || !address.city || !address.state || !address.pincode) {
      return res.status(400).json({
        success: false,
        message: "Complete address is required (line1, city, state, pincode)"
      });
    }

    // Validate phone format
    const phoneRegex = /^[6-9]\d{9}$/;
    if (!phoneRegex.test(contactPhone)) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid 10-digit phone number"
      });
    }

    // Validate pincode format
    const pincodeRegex = /^\d{6}$/;
    if (!pincodeRegex.test(address.pincode)) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid 6-digit pincode"
      });
    }

    // Check maximum locations limit (e.g., 10 per user)
    const locationCount = await Location.countDocuments({ 
      user: req.user._id, 
      isActive: true 
    });

    if (locationCount >= 10) {
      return res.status(400).json({
        success: false,
        message: "Maximum 10 locations allowed. Please delete an existing location."
      });
    }

    // Prepare location data
    const locationData = {
      user: req.user._id,
      label: label || "shop",
      customLabel: label === "other" ? customLabel : undefined,
      shopName,
      contactPerson,
      contactPhone,
      address: {
        line1: address.line1,
        line2: address.line2 || "",
        city: address.city,
        state: address.state,
        pincode: address.pincode,
        country: address.country || "India"
      },
      deliveryInstructions,
      isDefault: isDefault || false
    };

    // Add coordinates if provided
    if (coordinates && coordinates.latitude && coordinates.longitude) {
      locationData.coordinates = {
        latitude: coordinates.latitude,
        longitude: coordinates.longitude,
        accuracy: coordinates.accuracy,
        updatedAt: new Date()
      };
    }

    // If this is the first location, make it default
    if (locationCount === 0) {
      locationData.isDefault = true;
    }

    // Create location
    const location = await Location.create(locationData);

    console.log(`📍 Location created: ${location._id} for user: ${req.user._id}`);

    res.status(201).json({
      success: true,
      message: "Location added successfully",
      data: { location }
    });

  } catch (error) {
    console.error("Create Location Error:", error);

    // Handle validation errors
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: messages.join(", ")
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to create location",
      error: process.env.NODE_ENV === "development" ? error.message : undefined
    });
  }
};

/**
 * @desc    Get all locations for current user
 * @route   GET /api/locations
 * @access  Private
 */
exports.getMyLocations = async (req, res) => {
  try {
    const { includeInactive } = req.query;

    const query = { user: req.user._id };

    // By default, only show active locations
    if (includeInactive !== "true") {
      query.isActive = true;
    }

    const locations = await Location.find(query)
      .sort({ isDefault: -1, createdAt: -1 });

    res.status(200).json({
      success: true,
      count: locations.length,
      data: { locations }
    });

  } catch (error) {
    console.error("Get Locations Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch locations",
      error: process.env.NODE_ENV === "development" ? error.message : undefined
    });
  }
};

/**
 * @desc    Get single location by ID
 * @route   GET /api/locations/:id
 * @access  Private
 */
exports.getLocation = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid location ID"
      });
    }

    const location = await Location.findOne({
      _id: id,
      user: req.user._id
    });

    if (!location) {
      return res.status(404).json({
        success: false,
        message: "Location not found"
      });
    }

    res.status(200).json({
      success: true,
      data: { location }
    });

  } catch (error) {
    console.error("Get Location Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch location",
      error: process.env.NODE_ENV === "development" ? error.message : undefined
    });
  }
};

/**
 * @desc    Update location
 * @route   PUT /api/locations/:id
 * @access  Private
 */
exports.updateLocation = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      label,
      customLabel,
      shopName,
      contactPerson,
      contactPhone,
      address,
      coordinates,
      deliveryInstructions,
      isDefault
    } = req.body;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid location ID"
      });
    }

    // Find location
    const location = await Location.findOne({
      _id: id,
      user: req.user._id
    });

    if (!location) {
      return res.status(404).json({
        success: false,
        message: "Location not found"
      });
    }

    // Validate phone if provided
    if (contactPhone) {
      const phoneRegex = /^[6-9]\d{9}$/;
      if (!phoneRegex.test(contactPhone)) {
        return res.status(400).json({
          success: false,
          message: "Please enter a valid 10-digit phone number"
        });
      }
      location.contactPhone = contactPhone;
    }

    // Validate pincode if provided
    if (address && address.pincode) {
      const pincodeRegex = /^\d{6}$/;
      if (!pincodeRegex.test(address.pincode)) {
        return res.status(400).json({
          success: false,
          message: "Please enter a valid 6-digit pincode"
        });
      }
    }

    // Update fields
    if (label !== undefined) location.label = label;
    if (label === "other" && customLabel !== undefined) {
      location.customLabel = customLabel;
    }
    if (shopName !== undefined) location.shopName = shopName;
    if (contactPerson !== undefined) location.contactPerson = contactPerson;
    if (deliveryInstructions !== undefined) location.deliveryInstructions = deliveryInstructions;

    // Update address fields
    if (address) {
      if (address.line1 !== undefined) location.address.line1 = address.line1;
      if (address.line2 !== undefined) location.address.line2 = address.line2;
      if (address.city !== undefined) location.address.city = address.city;
      if (address.state !== undefined) location.address.state = address.state;
      if (address.pincode !== undefined) location.address.pincode = address.pincode;
      if (address.country !== undefined) location.address.country = address.country;
    }

    // Update coordinates
    if (coordinates) {
      if (coordinates.latitude !== undefined && coordinates.longitude !== undefined) {
        location.coordinates = {
          latitude: coordinates.latitude,
          longitude: coordinates.longitude,
          accuracy: coordinates.accuracy,
          updatedAt: new Date()
        };
      }
    }

    // Update default status
    if (isDefault !== undefined) {
      location.isDefault = isDefault;
    }

    await location.save();

    console.log(`📍 Location updated: ${location._id}`);

    res.status(200).json({
      success: true,
      message: "Location updated successfully",
      data: { location }
    });

  } catch (error) {
    console.error("Update Location Error:", error);

    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: messages.join(", ")
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to update location",
      error: process.env.NODE_ENV === "development" ? error.message : undefined
    });
  }
};

/**
 * @desc    Delete location (soft delete)
 * @route   DELETE /api/locations/:id
 * @access  Private
 */
exports.deleteLocation = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid location ID"
      });
    }

    const location = await Location.findOne({
      _id: id,
      user: req.user._id
    });

    if (!location) {
      return res.status(404).json({
        success: false,
        message: "Location not found"
      });
    }

    // Check if this is the only active location
    const activeCount = await Location.countDocuments({
      user: req.user._id,
      isActive: true
    });

    // Soft delete
    location.isActive = false;
    location.isDefault = false;
    await location.save();

    // If this was the default and there are other locations, set a new default
    if (activeCount > 1) {
      const otherLocation = await Location.findOne({
        user: req.user._id,
        isActive: true,
        _id: { $ne: id }
      }).sort({ createdAt: -1 });

      if (otherLocation && !otherLocation.isDefault) {
        // Check if any default exists
        const hasDefault = await Location.findOne({
          user: req.user._id,
          isActive: true,
          isDefault: true
        });

        if (!hasDefault) {
          otherLocation.isDefault = true;
          await otherLocation.save();
        }
      }
    }

    console.log(`📍 Location deleted: ${location._id}`);

    res.status(200).json({
      success: true,
      message: "Location deleted successfully"
    });

  } catch (error) {
    console.error("Delete Location Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete location",
      error: process.env.NODE_ENV === "development" ? error.message : undefined
    });
  }
};

/**
 * @desc    Permanently delete location
 * @route   DELETE /api/locations/:id/permanent
 * @access  Private
 */
exports.permanentDeleteLocation = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid location ID"
      });
    }

    const location = await Location.findOneAndDelete({
      _id: id,
      user: req.user._id
    });

    if (!location) {
      return res.status(404).json({
        success: false,
        message: "Location not found"
      });
    }

    console.log(`📍 Location permanently deleted: ${id}`);

    res.status(200).json({
      success: true,
      message: "Location permanently deleted"
    });

  } catch (error) {
    console.error("Permanent Delete Location Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete location",
      error: process.env.NODE_ENV === "development" ? error.message : undefined
    });
  }
};

/**
 * @desc    Set location as default
 * @route   PUT /api/locations/:id/set-default
 * @access  Private
 */
exports.setDefaultLocation = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid location ID"
      });
    }

    const location = await Location.findOne({
      _id: id,
      user: req.user._id,
      isActive: true
    });

    if (!location) {
      return res.status(404).json({
        success: false,
        message: "Location not found"
      });
    }

    // Remove default from all other locations
    await Location.updateMany(
      { user: req.user._id, _id: { $ne: id } },
      { isDefault: false }
    );

    // Set this as default
    location.isDefault = true;
    await location.save();

    console.log(`📍 Default location set: ${location._id}`);

    res.status(200).json({
      success: true,
      message: "Default location updated",
      data: { location }
    });

  } catch (error) {
    console.error("Set Default Location Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to set default location",
      error: process.env.NODE_ENV === "development" ? error.message : undefined
    });
  }
};

/**
 * @desc    Get default location for current user
 * @route   GET /api/locations/default
 * @access  Private
 */
exports.getDefaultLocation = async (req, res) => {
  try {
    const location = await Location.getDefaultLocation(req.user._id);

    if (!location) {
      return res.status(404).json({
        success: false,
        message: "No default location set"
      });
    }

    res.status(200).json({
      success: true,
      data: { location }
    });

  } catch (error) {
    console.error("Get Default Location Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch default location",
      error: process.env.NODE_ENV === "development" ? error.message : undefined
    });
  }
};

/**
 * @desc    Update coordinates only (for GPS update from mobile)
 * @route   PUT /api/locations/:id/coordinates
 * @access  Private
 */
exports.updateCoordinates = async (req, res) => {
  try {
    const { id } = req.params;
    const { latitude, longitude, accuracy } = req.body;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid location ID"
      });
    }

    // Validate coordinates
    if (latitude === undefined || longitude === undefined) {
      return res.status(400).json({
        success: false,
        message: "Latitude and longitude are required"
      });
    }

    if (latitude < -90 || latitude > 90) {
      return res.status(400).json({
        success: false,
        message: "Invalid latitude value"
      });
    }

    if (longitude < -180 || longitude > 180) {
      return res.status(400).json({
        success: false,
        message: "Invalid longitude value"
      });
    }

    const location = await Location.findOneAndUpdate(
      { _id: id, user: req.user._id },
      {
        coordinates: {
          latitude,
          longitude,
          accuracy: accuracy || null,
          updatedAt: new Date()
        }
      },
      { new: true }
    );

    if (!location) {
      return res.status(404).json({
        success: false,
        message: "Location not found"
      });
    }

    console.log(`📍 Coordinates updated for location: ${location._id}`);

    res.status(200).json({
      success: true,
      message: "Coordinates updated successfully",
      data: { location }
    });

  } catch (error) {
    console.error("Update Coordinates Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update coordinates",
      error: process.env.NODE_ENV === "development" ? error.message : undefined
    });
  }
};

// ============================================================
// ADMIN LOCATION MANAGEMENT
// ============================================================

/**
 * @desc    Get all locations (Admin)
 * @route   GET /api/admin/locations
 * @access  Private/Admin
 */
exports.adminGetAllLocations = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      userId,
      city,
      state,
      isActive 
    } = req.query;

    const query = {};

    // Filter by user
    if (userId) {
      if (!mongoose.Types.ObjectId.isValid(userId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid user ID"
        });
      }
      query.user = userId;
    }

    // Filter by city
    if (city) {
      query["address.city"] = { $regex: city, $options: "i" };
    }

    // Filter by state
    if (state) {
      query["address.state"] = { $regex: state, $options: "i" };
    }

    // Filter by active status
    if (isActive !== undefined) {
      query.isActive = isActive === "true";
    }

    const locations = await Location.find(query)
      .populate("user", "name phone businessName")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Location.countDocuments(query);

    res.status(200).json({
      success: true,
      data: {
        locations,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / limit),
          total
        }
      }
    });

  } catch (error) {
    console.error("Admin Get Locations Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch locations",
      error: process.env.NODE_ENV === "development" ? error.message : undefined
    });
  }
};

/**
 * @desc    Get locations for a specific user (Admin)
 * @route   GET /api/admin/users/:userId/locations
 * @access  Private/Admin
 */
exports.adminGetUserLocations = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID"
      });
    }

    const locations = await Location.find({ user: userId })
      .sort({ isDefault: -1, createdAt: -1 });

    res.status(200).json({
      success: true,
      count: locations.length,
      data: { locations }
    });

  } catch (error) {
    console.error("Admin Get User Locations Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch locations",
      error: process.env.NODE_ENV === "development" ? error.message : undefined
    });
  }
};

/**
 * @desc    Get single location (Admin)
 * @route   GET /api/admin/locations/:id
 * @access  Private/Admin
 */
exports.adminGetLocation = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid location ID"
      });
    }

    const location = await Location.findById(id)
      .populate("user", "name phone businessName email");

    if (!location) {
      return res.status(404).json({
        success: false,
        message: "Location not found"
      });
    }

    res.status(200).json({
      success: true,
      data: { location }
    });

  } catch (error) {
    console.error("Admin Get Location Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch location",
      error: process.env.NODE_ENV === "development" ? error.message : undefined
    });
  }
};