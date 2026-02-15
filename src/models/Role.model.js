// models/Role.model.js
import mongoose from "mongoose";
import { STATUS, USER_ROLE } from "../constants/enums.js";

const roleSchema = new mongoose.Schema(
  {
    name: { type: String, enum: Object.values(USER_ROLE), unique: true },
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

export default mongoose.model("Role", roleSchema);
