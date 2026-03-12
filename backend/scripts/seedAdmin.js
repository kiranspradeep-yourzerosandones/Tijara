require("dotenv").config();
const mongoose = require("mongoose");
const User = require("../models/User");

const seedAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB connected");

    // Check if admin exists
    const existingAdmin = await User.findOne({ role: "admin" });

    if (existingAdmin) {
      console.log("Admin already exists:");
      console.log(`Phone: ${existingAdmin.phone}`);
      console.log("Use this phone to login as admin");
      process.exit(0);
    }

    // Create default admin
    const admin = await User.create({
      name: "Admin",
      phone: process.env.ADMIN_PHONE || "9999999999",
      password: process.env.ADMIN_PASSWORD || "admin123456",
      role: "admin",
      isPhoneVerified: true
    });

    console.log("Default admin created successfully!");
    console.log("================================");
    console.log(`Phone: ${admin.phone}`);
    console.log(`Password: ${process.env.ADMIN_PASSWORD || "admin123456"}`);
    console.log("================================");
    console.log("Please change the password after first login!");

    process.exit(0);

  } catch (error) {
    console.error("Seed Error:", error);
    process.exit(1);
  }
};

seedAdmin();