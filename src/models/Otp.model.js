// models/otp.model.js
import mongoose from "mongoose";
import { generateRMId } from "../utils/rmId.js";
import counterModel from "./Counter.model.js";

const otpSchema = new mongoose.Schema(
  {
    rmOtpId: {
      type: String,
      unique: true,
  
    },

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    otp: { type: String, required: true },

    type: {
      type: String,
      enum: ["LOGIN", "TRANSACTION", "PASSWORD_RESET"],
      default: "LOGIN"
    },

    counter: { type: Number, required: true },

    isUsed: { type: Boolean, default: false },

    expiresAt: { type: Date, required: true, index: { expires: 0 } } // auto delete
  },
  { timestamps: true }
);

// Auto increment counter per OTP
otpSchema.pre("validate", async function (next) {
  if (!this.counter) {
    const counter = await counterModel.findByIdAndUpdate(
      "OTP_COUNTER",
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );
    this.counter = counter.seq;
  }
  next();
});


otpSchema.pre("save", async function (next) {
  if (!this.rmOtpId) {
    this.rmOtpId = await generateRMId("OTP");
  }
  next();
});


export default mongoose.model("Otp", otpSchema);
