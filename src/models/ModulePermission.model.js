// models/ModulePermission.model.js

import mongoose from "mongoose";
import { MODULE_KEY } from "../constants/enums.js";
import { generateRMId } from "../utils/rmId.js";

const modulePermissionSchema = new mongoose.Schema(
  {
    role: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Role",
      required: true,
      index: true,
    },

    rmModulePrms: {
      type: String,
      unique: true,
      index: true,
    },

    moduleKey: {
      type: String,
      enum: Object.values(MODULE_KEY),
      required: true,
      index: true,
    },

    permissions: {
      create: { type: Boolean, default: false },
      read: { type: Boolean, default: false },
      update: { type: Boolean, default: false },
      delete: { type: Boolean, default: false },
    },
  },
  { timestamps: true }
);

// ✅ UNIQUE COMBO
modulePermissionSchema.index({ role: 1, moduleKey: 1 }, { unique: true });


// ✅ save() case
modulePermissionSchema.pre("save", async function (next) {
  if (!this.rmModulePrms) {
    this.rmModulePrms = await generateRMId("MODPRMS", "MODULEPERMISSION");
  }
  next();
});

// ✅ create() internally save use karta hai (covered)

// ✅ insertMany() case
modulePermissionSchema.pre("insertMany", async function (next, docs) {
  for (let doc of docs) {
    if (!doc.rmModulePrms) {
     doc.rmModulePrms = await generateRMId("MODPRMS", "MODULEPERMISSION");
    }
  }
  next();
});

// ✅ findOneAndUpdate / update case (extra safety)
modulePermissionSchema.pre("findOneAndUpdate", async function (next) {
  const update = this.getUpdate();

  if (!update.rmModulePrms && !update.$set?.rmModulePrms) {
    const rmId = await generateRMId("MODPRMS", "MODULEPERMISSION");

    this.setUpdate({
      ...update,
      $set: {
        ...update.$set,
        rmModulePrms: rmId,
      },
    });
  }

  next();
});

export default mongoose.model("ModulePermission", modulePermissionSchema);