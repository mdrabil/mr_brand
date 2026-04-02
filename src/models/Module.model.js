import mongoose from "mongoose";
import { MODULE_KEY } from "../constants/enums.js";
import { generateRMId } from "../utils/rmId.js";

const moduleSchema = new mongoose.Schema(
  {
    rmModuleId: {
      type: String,
      unique: true,
      index: true,
    },

    moduleKey: {
      type: String,
      enum: Object.values(MODULE_KEY),
      unique: true,
      required: true,
      index: true,
    },

    displayName: {
      type: String,
    },

    description: String,

    isActive: {
      type: Boolean,
      default: true,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

/* --------------------------------------------------
 🔥 UNIVERSAL RM ID GENERATION
-------------------------------------------------- */

// ✅ save / create
moduleSchema.pre("save", async function (next) {
  if (!this.rmModuleId) {
    this.rmModuleId = await generateRMId("MOD", "MODULE");
  }
  next();
});

// ✅ insertMany support
moduleSchema.pre("insertMany", async function (next, docs) {
  for (let doc of docs) {
    if (!doc.rmModuleId) {
      doc.rmModuleId = await generateRMId("MOD", "MODULE");
    }
  }
  next();
});

// ✅ update safety (optional but pro)
moduleSchema.pre("findOneAndUpdate", async function (next) {
  const update = this.getUpdate();

  if (!update?.$set?.rmModuleId) {
    const rmId = await generateRMId("MOD", "MODULE");

    this.setUpdate({
      ...update,
      $set: {
        ...update.$set,
        rmModuleId: rmId,
      },
    });
  }

  next();
});

export default mongoose.model("Module", moduleSchema);