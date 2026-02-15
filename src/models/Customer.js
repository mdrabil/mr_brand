import mongoose from "mongoose";
import { generateRMId } from "../utils/rmId.js";

const addressSchema = new mongoose.Schema(
  {
    fullAddress: String,
    addressLine: String,
    mobile: String,
    city: String,
    state: String,
    pincode: String,
    latitude: Number,
    longitude: Number,
    isDefault: { type: Boolean, default: false },
  },
  { _id: true }
);

const customerSchema = new mongoose.Schema(
  {
    rmCustomerId: {
      type: String,
      unique: true,
      index: true,
    },
    fullName: String,
    email: String,
    mobile: { type: String, index: true },
    isBlocked: { type: Boolean, default: false },
    addresses: [addressSchema],
  },
  { timestamps: true }
);

// ✅ Pre-save hook to generate RM ID
customerSchema.pre("save", async function (next) {
  if (!this.rmCustomerId) {
    this.rmCustomerId = await generateRMId("RMCU"); // generate async ID here
  }
  next();
});

export default mongoose.model("Customer", customerSchema);
