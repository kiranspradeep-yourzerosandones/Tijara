require("dotenv").config();
const mongoose = require("mongoose");
const Admin = require("../models/Admin");

const seedAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("📦 Connected to MongoDB");

    // ✅ YOUR EMAIL CREDENTIALS
    const ADMIN_EMAIL = "kiranspradeep2002@gmail.com";
    const ADMIN_PASSWORD = "Qwerty@123";
    const ADMIN_NAME = "Kiran Pradeep";

    // Delete ALL existing admins
    const deleteResult = await Admin.deleteMany({});
    console.log(`🗑️ Deleted ${deleteResult.deletedCount} existing admin(s)`);

    // Create fresh admin
    const admin = await Admin.create({
      name: ADMIN_NAME,
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      phone: "8086415357", // Optional now
      role: "superadmin",
      isActive: true
    });

    console.log("\n✅ Admin created successfully!");
    console.log("   ID:", admin._id);
    console.log("   Name:", admin.name);
    console.log("   Email:", admin.email);
    console.log("   Role:", admin.role);
    
    console.log("\n🔐 Login Credentials:");
    console.log("   Email:", ADMIN_EMAIL);
    console.log("   Password:", ADMIN_PASSWORD);

    // Verify password was hashed
    const savedAdmin = await Admin.findById(admin._id).select("+password");
    console.log("\n🔍 Verification:");
    console.log("   Password is hashed:", savedAdmin.password.startsWith("$2"));
    console.log("   Hash preview:", savedAdmin.password.substring(0, 29) + "...");

    process.exit(0);
  } catch (error) {
    console.error("❌ Seed Error:", error);
    process.exit(1);
  }
};

seedAdmin();