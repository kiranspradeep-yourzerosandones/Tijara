require("dotenv").config();
const mongoose = require("mongoose");
const Admin = require("../models/Admin");

const clearAdmins = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("📦 Connected to MongoDB");

    const result = await Admin.deleteMany({});
    console.log(`🗑️ Deleted ${result.deletedCount} admin(s)`);

    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
};

clearAdmins();