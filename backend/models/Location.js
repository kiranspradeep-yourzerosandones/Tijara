// D:\yzo_ongoing\Tijara\backend\models\Location.js
const mongoose = require("mongoose");

const locationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },

  label: {
    type: String,
    enum: ["shop", "warehouse", "office", "home", "other"],
    default: "shop"
  },

  customLabel: {
    type: String,
    trim: true,
    maxlength: 50
  },

  shopName: {
    type: String,
    required: [true, "Shop name is required"],
    trim: true,
    maxlength: 100
  },

  contactPerson: {
    type: String,
    trim: true,
    maxlength: 50
  },

  contactPhone: {
    type: String,
    required: [true, "Contact phone is required"],
    trim: true,
    match: [/^[6-9]\d{9}$/, "Please enter a valid 10-digit phone number"]
  },

  address: {
    line1: {
      type: String,
      required: [true, "Address line 1 is required"],
      trim: true,
      maxlength: 200
    },

    line2: {
      type: String,
      trim: true,
      maxlength: 200
    },

    city: {
      type: String,
      required: [true, "City is required"],
      trim: true,
      maxlength: 100
    },

    state: {
      type: String,
      required: [true, "State is required"],
      trim: true,
      maxlength: 100
    },

    pincode: {
      type: String,
      required: [true, "Pincode is required"],
      trim: true,
      match: [/^\d{6}$/, "Please enter a valid 6-digit pincode"]
    },

    country: {
      type: String,
      default: "India",
      trim: true
    }
  },

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
    accuracy: {
      type: Number
    },
    updatedAt: {
      type: Date
    }
  },

  deliveryInstructions: {
    type: String,
    trim: true,
    maxlength: 500
  },

  isDefault: {
    type: Boolean,
    default: false
  },

  isActive: {
    type: Boolean,
    default: true
  }

}, {
  timestamps: true
});

// ✅ FIXED: Removed duplicate index definitions
locationSchema.index({ user: 1, isDefault: 1 });
locationSchema.index({ user: 1, isActive: 1 });
locationSchema.index({ "coordinates.latitude": 1, "coordinates.longitude": 1 });

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

locationSchema.virtual("displayLabel").get(function() {
  if (this.label === "other" && this.customLabel) {
    return this.customLabel;
  }
  return this.label.charAt(0).toUpperCase() + this.label.slice(1);
});

locationSchema.set("toJSON", { virtuals: true });
locationSchema.set("toObject", { virtuals: true });

locationSchema.pre("save", async function() {
  if (this.isDefault && this.isModified("isDefault")) {
    await this.constructor.updateMany(
      { 
        user: this.user, 
        _id: { $ne: this._id },
        isDefault: true 
      },
      { isDefault: false }
    );
  }
});

locationSchema.statics.getDefaultLocation = async function(userId) {
  return this.findOne({ user: userId, isDefault: true, isActive: true });
};

locationSchema.statics.getUserLocations = async function(userId) {
  return this.find({ user: userId, isActive: true }).sort({ isDefault: -1, createdAt: -1 });
};

module.exports = mongoose.model("Location", locationSchema);