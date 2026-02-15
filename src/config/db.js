import mongoose from "mongoose";
import { config } from "./config.js";

export const connectDB = async () => {
  try {
    mongoose.set("strictQuery", true);

    await mongoose.connect(config.mongoURI, {
      maxPoolSize: 10,          // performance
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    console.log("✅ MongoDB Connected Successfully");
  } catch (error) {
    console.error("❌ MongoDB connection failed:", error.message);
    process.exit(1);
  }
};
