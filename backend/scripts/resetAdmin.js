require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const resetAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB");

    const phone = "8086415357";  // ✅ Your phone number
    const newPassword = "admin123";

    // Hash password manually
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    console.log("\n🔐 Password info:");
    console.log("   Plain:", newPassword);
    console.log("   Hash:", hashedPassword);

    // Update or create admin
    const result = await mongoose.connection.collection("users").findOneAndUpdate(
      { phone: phone },
      { 
        $set: { 
          password: hashedPassword,
          role: "admin",
          isActive: true,
          isPhoneVerified: true,
          name: "Admin",
          email: "admin@tijara.com",
          updatedAt: new Date()
        } 
      },
      { 
        upsert: true,  // Create if doesn't exist
        returnDocument: "after"
      }
    );

    console.log("\n✅ Admin updated/created");
    console.log("   Phone:", result.phone);
    console.log("   Role:", result.role);
    console.log("   Active:", result.isActive);

    // Verify password works
    const isMatch = await bcrypt.compare(newPassword, result.password);
    console.log("\n🔐 Password test:", isMatch ? "✅ PASS" : "❌ FAIL");

    if (isMatch) {
      console.log("\n🎉 LOGIN CREDENTIALS:");
      console.log("   Phone: " + phone);
      console.log("   Password: " + newPassword);
    }

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
};

resetAdmin();