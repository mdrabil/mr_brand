// models/StoreStaff.model.js
import mongoose from "mongoose";
import { USER_ROLE } from "../constants/enums.js";
import { generateRMId } from "../utils/rmId.js";

const storeStaffSchema = new mongoose.Schema(
  {
    rmStaffId: { type: String, unique: true, index: true },

  store: {
  type: mongoose.Schema.Types.ObjectId,
  ref: "Store",
  required: true
},


    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
  
    },

    role: {
      type: String,
      enum: [
        USER_ROLE.STORE_MANAGER,
        USER_ROLE.RIDER,
        USER_ROLE.CHEF,
        USER_ROLE.STAFF
      ],
      required: true
    },

    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

// AUTO ID
storeStaffSchema.pre("save", async function (next) {
  if (!this.rmStaffId) {
    this.rmStaffId = await generateRMId("RMSTF");
  }
  next();
});

// UNIQUE store + user
storeStaffSchema.index({ store: 1, user: 1 }, { unique: true });

export default mongoose.model("StoreStaff", storeStaffSchema);
