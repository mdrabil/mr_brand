// models/Role.model.js
import mongoose from "mongoose";
import { STATUS, USER_ROLE } from "../constants/enums.js";
import { generateRMId } from "../utils/rmId.js";

const roleSchema = new mongoose.Schema(
  {
    role: { type: String, enum: Object.values(USER_ROLE), unique: true },
    rmRoleId: {
      type: String,
      unique: true,
      index: true,
    
    },
    description: String,
    status: {
         type: String,
         enum: Object.values(STATUS),
         default: STATUS.ACTIVE
       },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

roleSchema.pre("save", async function (next) {
  if (!this.rmRoleId) {
    this.rmRoleId = await generateRMId("ROLE", "ROLE");
  }
  next();
});

export default mongoose.model("Role", roleSchema);
