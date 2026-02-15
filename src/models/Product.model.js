
import mongoose from "mongoose";
import { PRODUCT_STATUS, USER_ROLE } from "../constants/enums.js";
import { generateRMId } from "../utils/rmId.js";

const productSchema = new mongoose.Schema(
  {
    rmProductId: {
      type: String,
      unique: true,
      index: true,
     
    },

    store: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Store",
      required: true,
      index: true
    },

    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
      index: true
    },

    subCategory: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      index: true
    },

    name: {
      type: String,
      required: true,
      index: true
    },

    description: String,

    // 🔥 VARIANTS (size / weight / price)
    variants: [
      {
        label: { type: String, required: true },
        value: { type: String, required: true },
        mrp: Number,
        sellingPrice: { type: Number, required: true },
        stockQty: Number,
        isActive: { type: Boolean, default: true }
      }
    ],

    // 🔥 dynamic extra fields
    attributes: {
      type: Map,
      of: mongoose.Schema.Types.Mixed
    },

    gstPercent: Number,

    status: {
      type: String,
      enum: Object.values(PRODUCT_STATUS),
      default: PRODUCT_STATUS.ACTIVE,
      index: true
    },

    images: {
      type: [String],
      default: []
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },

    allowedCreatorRoles: {
      type: [String],
      enum: Object.values(USER_ROLE),
      default: [
        USER_ROLE.VENDOR,
        USER_ROLE.STORE_MANAGER,
        USER_ROLE.CHEF
      ]
    }
  },
  { timestamps: true }
);

productSchema.pre("save", async function (next) {
  if (!this.rmProductId) {
    this.rmProductId = await generateRMId("RMP");
  }
  next();
});
// 🚀 fast queries
productSchema.index({ store: 1, category: 1 });
productSchema.index({ name: "text" });

export default mongoose.model("Product", productSchema);
