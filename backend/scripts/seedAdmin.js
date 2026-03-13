require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("../models/User");

async function createAdmin() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB");

    // Check if admin exists
    const existingAdmin = await User.findOne({ role: "admin" });
    
    if (existingAdmin) {
      console.log("Admin already exists:");
      console.log("  Phone:", existingAdmin.phone);
      console.log("  Name:", existingAdmin.name);
      process.exit(0);
    }

    // Create admin
    const admin = await User.create({
      name: "Admin",
      phone: "9876543210",
      password: "admin123", // Will be hashed by pre-save hook
      email: "admin@tijara.com",
      role: "admin",
      isPhoneVerified: true,
      isActive: true
    });

    console.log("✅ Admin created successfully!");
    console.log("  Phone:", admin.phone);
    console.log("  Password: admin123");
    console.log("  Name:", admin.name);

    process.exit(0);
  } catch (error) {
    console.error("Error:", error.message);
    process.exit(1);
  }
}

createAdmin();