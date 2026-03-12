const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    // Connection options
    const options = {
      // These are now default in Mongoose 6+, but good to be explicit
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    };

    const conn = await mongoose.connect(process.env.MONGO_URI, options);

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    console.log(`📦 Database: ${conn.connection.name}`);

    // Handle connection events
    mongoose.connection.on("error", (err) => {
      console.error(`❌ MongoDB Error: ${err.message}`);
    });

    mongoose.connection.on("disconnected", () => {
      console.warn("⚠️ MongoDB Disconnected. Attempting to reconnect...");
    });

    mongoose.connection.on("reconnected", () => {
      console.log("✅ MongoDB Reconnected");
    });

    // Graceful shutdown
    process.on("SIGINT", async () => {
      await mongoose.connection.close();
      console.log("MongoDB connection closed due to app termination");
      process.exit(0);
    });

  } catch (error) {
    console.error("❌ MongoDB Connection Error:");
    console.error(`   Message: ${error.message}`);
    
    if (error.message.includes("ECONNREFUSED")) {
      console.error("\n📌 Possible solutions:");
      console.error("   1. Start MongoDB locally: net start MongoDB (Windows)");
      console.error("   2. Use MongoDB Atlas (cloud): https://www.mongodb.com/atlas");
      console.error("   3. Check if MONGO_URI in .env is correct\n");
    }

    // Exit process with failure
    process.exit(1);
  }
};

module.exports = connectDB;