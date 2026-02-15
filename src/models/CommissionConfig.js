// models/CommissionConfig.js
import mongoose from "mongoose";
import { generateRMId } from "../utils/rmId.js";

export const COMMISSION_PLAN_TYPE = {
  MONTHLY_PERCENT: "MONTHLY_PERCENT",
  PER_ORDER: "PER_ORDER",
  MONTHLY_FIXED: "MONTHLY_FIXED"
};

const commissionConfigSchema = new mongoose.Schema(
  {
    rmCommissionConfigId: {
      type: String,
      unique: true,
    
    },

    planName: {
      type: String,
      required: true,
      unique: true // Plan-A, Plan-B
    },

    type: {
      type: String,
      enum: Object.values(COMMISSION_PLAN_TYPE),
      required: true
    },

    percentage: Number,       // 5 (for 5%)
    perOrderAmount: Number,   // ₹20
    monthlyAmount: Number,    // ₹2000

    isDefault: {
      type: Boolean,
      default: false
    },

    isActive: {
      type: Boolean,
      default: true
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    }
  },
  { timestamps: true }


);


commissionConfigSchema.pre("save", async function (next) {
  if (!this.rmCommissionConfigId) {
    this.rmCommissionConfigId = await generateRMId("RMU");
  }
  next();
});

export default mongoose.model("CommissionConfig", commissionConfigSchema);
