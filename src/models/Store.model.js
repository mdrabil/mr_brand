// models/Store.js
import mongoose from "mongoose";
import { STORE_STATUS } from "../constants/enums.js";
import { generateRMId } from "../utils/rmId.js";

const storeSchema = new mongoose.Schema(
  {
    rmStoreId: {
      type: String,
      unique: true,
      index: true,
    
    },

    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },

    storeName: {
      type: String,
      required: true,
      index: true
    },

   address: {
  fullAddress: String,
  city: String,
  state: String,
  pincode: String,

  location: {
    type: {
      type: String,
      enum: ["Point"],
      default: "Point"
    },
    coordinates: {
      type: [Number], // [lng, lat]
      required: true
    }
  }
},


    gstDetails: {
      gstNumber: String,
      cgst: Number,
      sgst: Number
    },

    timing: {
      openTime: String,
      closeTime: String
    },

    status: {
      type: String,
      enum: Object.values(STORE_STATUS),
      default: STORE_STATUS.ACTIVE
    },
    // Or replace with boolean
isActive: {
  type: Boolean,
  default: true
},

        // models/Store.js (important part only)
commissionConfig: {
  type: mongoose.Schema.Types.ObjectId,
  ref: "CommissionConfig",
  required: false,
default:null
},


    isVerified: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
);


storeSchema.pre("save", async function (next) {
  if (!this.rmStoreId) {
    this.rmStoreId = await generateRMId("STR");
  }
  next();
});
// storeSchema.index({ "address.location": "2dsphere" });

storeSchema.index({ storeName: 1, owner: 1 }, { unique: true });

export default mongoose.model("Store", storeSchema);
