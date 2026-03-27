
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
      index: true,
      default:null
    },

    name: {
      type: String,
      required: true,
      index: true
    },
  label: { type: String, required: true, default:"Weight" },

    description: String,

    // 🔥 VARIANTS (size / weight / price)
    variants: [
      {
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

  images: [
  {
    url: String,
    public_id: String
  }
  
],
  thumbnails: [
  {
    url: String,
    public_id: String
  }
  
],
  
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    averageRating: {
  type: Number,
  default: 0
},

totalReviews: {
  type: Number,
  default: 0
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
productSchema.index({ name: "text", description: "text" });

productSchema.index({ category: 1, status: 1, createdAt: -1 });

productSchema.index({ store: 1, status: 1, createdAt: -1 });

productSchema.index({ createdAt: -1 });
export default mongoose.model("Product", productSchema);
