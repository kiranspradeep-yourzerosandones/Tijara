require("dotenv").config();
const mongoose = require("mongoose");
const Admin = require("../models/Admin");

const seedAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("📦 Connected to MongoDB");

    // ✅ YOUR CREDENTIALS
    const ADMIN_PHONE = "8086415357";
    const ADMIN_PASSWORD = "Qwerty@123";
    const ADMIN_EMAIL = "kiranspradeep2002@gmail.com";

    // Delete ALL existing admins
    const deleteResult = await Admin.deleteMany({});
    console.log(`🗑️ Deleted ${deleteResult.deletedCount} existing admin(s)`);

    // Create fresh admin
    const admin = await Admin.create({
      name: "Super Admin",
      phone: ADMIN_PHONE,
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      role: "superadmin",
      isActive: true
    });

    console.log("\n✅ Admin created successfully!");
    console.log("   ID:", admin._id);
    console.log("   Name:", admin.name);
    console.log("   Phone:", admin.phone);
    console.log("   Email:", admin.email);
    console.log("   Role:", admin.role);
    
    console.log("\n🔐 Login Credentials:");
    console.log("   Phone:", ADMIN_PHONE);
    console.log("   Password:", ADMIN_PASSWORD);

    // Verify password was hashed
    const savedAdmin = await Admin.findById(admin._id).select("+password");
    console.log("\n🔍 Verification:");
    console.log("   Password is hashed:", savedAdmin.password.startsWith("$2"));
    console.log("   Hash preview:", savedAdmin.password.substring(0, 20) + "...");

    process.exit(0);
  } catch (error) {
    console.error("❌ Seed Error:", error);
    process.exit(1);
  }
};

seedAdmin();