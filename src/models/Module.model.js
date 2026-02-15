import mongoose from "mongoose";
import { MODULE_KEY } from "../constants/enums.js";

const moduleSchema = new mongoose.Schema(
  {
    moduleKey: {
      type: String,
      enum: Object.values(MODULE_KEY),
      unique: true,
      required: true,
      index: true
    },

    displayName: {
      type: String,
    },

    description: String,

    isActive: {
      type: Boolean,
      default: true
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",

    }
  },
  { timestamps: true }
);

export default mongoose.model("Module", moduleSchema);
