require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

async function createAdmin() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB");

    // Get the users collection directly (bypass model hooks)
    const db = mongoose.connection.db;
    const usersCollection = db.collection("users");

    // Delete existing admin
    await usersCollection.deleteOne({ phone: "9876543210" });
    console.log("🗑️  Cleared existing admin");

    // Hash password manually
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash("admin123", salt);

    // Create admin directly in collection
    const result = await usersCollection.insertOne({
      name: "Admin",
      phone: "9876543210",
      email: "admin@tijara.com",
      password: hashedPassword,
      role: "admin",
      isPhoneVerified: true,
      isActive: true,
      creditLimit: 0,
      pendingAmount: 0,
      totalPaid: 0,
      paymentTerms: 30,
      isCreditBlocked: false,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    console.log("\n✅ Admin Created Successfully!");
    console.log("================================");
    console.log("   Phone: 9876543210");
    console.log("   Password: admin123");
    console.log("   ID:", result.insertedId);
    console.log("================================\n");

    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
}

createAdmin();