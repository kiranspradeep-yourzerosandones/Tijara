const mongoose = require("mongoose");

const locationSchema = new mongoose.Schema({
  // Reference to user
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true
  },

  // Location label/type
  label: {
    type: String,
    enum: ["shop", "warehouse", "office", "home", "other"],
    default: "shop"
  },

  // Custom label name (if label is "other")
  customLabel: {
    type: String,
    trim: true,
    maxlength: 50
  },

  // Shop/Business name at this location
  shopName: {
    type: String,
    required: [true, "Shop name is required"],
    trim: true,
    maxlength: 100
  },

  // Contact person at this location
  contactPerson: {
    type: String,
    trim: true,
    maxlength: 50
  },

  // Contact phone for this location
  contactPhone: {
    type: String,
    required: [true, "Contact phone is required"],
    trim: true,
    match: [/^[6-9]\d{9}$/, "Please enter a valid 10-digit phone number"]
  },

  // Full address
  address: {
    // Address line 1 (street, building, etc.)
    line1: {
      type: String,
      required: [true, "Address line 1 is required"],
      trim: true,
      maxlength: 200
    },

    // Address line 2 (optional - landmark, floor, etc.)
    line2: {
      type: String,
      trim: true,
      maxlength: 200
    },

    // City
    city: {
      type: String,
      required: [true, "City is required"],
      trim: true,
      maxlength: 100
    },

    // State
    state: {
      type: String,
      required: [true, "State is required"],
      trim: true,
      maxlength: 100
    },

    // Pincode
    pincode: {
      type: String,
      required: [true, "Pincode is required"],
      trim: true,
      match: [/^\d{6}$/, "Please enter a valid 6-digit pincode"]
    },

    // Country (default India)
    country: {
      type: String,
      default: "India",
      trim: true
    }
  },

  // GPS Coordinates (from React Native Expo)
  coordinates: {
    latitude: {
      type: Number,
      min: -90,
      max: 90
    },
    longitude: {
      type: Number,
      min: -180,
      max: 180
    },
    // Accuracy in meters (optional - from device GPS)
    accuracy: {
      type: Number
    },
    // When coordinates were last updated
    updatedAt: {
      type: Date
    }
  },

  // Delivery instructions
  deliveryInstructions: {
    type: String,
    trim: true,
    maxlength: 500
  },

  // Is this the default delivery location?
  isDefault: {
    type: Boolean,
    default: false
  },

  // Is location active?
  isActive: {
    type: Boolean,
    default: true
  }

}, {
  timestamps: true
});

// Indexes
locationSchema.index({ user: 1, isDefault: 1 });
locationSchema.index({ user: 1, isActive: 1 });
locationSchema.index({ "coordinates.latitude": 1, "coordinates.longitude": 1 });

// Virtual for full address string
locationSchema.virtual("fullAddress").get(function() {
  const parts = [
    this.address.line1,
    this.address.line2,
    this.address.city,
    this.address.state,
    this.address.pincode,
    this.address.country
  ].filter(Boolean);
  
  return parts.join(", ");
});

// Virtual for display label
locationSchema.virtual("displayLabel").get(function() {
  if (this.label === "other" && this.customLabel) {
    return this.customLabel;
  }
  return this.label.charAt(0).toUpperCase() + this.label.slice(1);
});

// Ensure virtuals are included in JSON
locationSchema.set("toJSON", { virtuals: true });
locationSchema.set("toObject", { virtuals: true });

// Pre-save middleware to ensure only one default location per user
locationSchema.pre("save", async function() {
  if (this.isDefault && this.isModified("isDefault")) {
    // Remove default from other locations of this user
    await this.constructor.updateMany(
      { 
        user: this.user, 
        _id: { $ne: this._id },
        isDefault: true 
      },
      { isDefault: false }
    );
  }
  // No need to call next() when using async function in Mongoose 6+
});

// Static method to get user's default location
locationSchema.statics.getDefaultLocation = async function(userId) {
  return this.findOne({ user: userId, isDefault: true, isActive: true });
};

// Static method to get all active locations for a user
locationSchema.statics.getUserLocations = async function(userId) {
  return this.find({ user: userId, isActive: true }).sort({ isDefault: -1, createdAt: -1 });
};

module.exports = mongoose.model("Location", locationSchema);