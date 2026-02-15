// import mongoose from "mongoose";
// import { MODULE_KEY, USER_ROLE } from "../constants/enums.js";

// const modulePermissionSchema = new mongoose.Schema(
//   {
//     role: {
//       type: String,
//       enum: Object.values(USER_ROLE),
//       required: true,
//       index: true
//     },

//     moduleKey: {
//       type: String, // "PRODUCT", "CATEGORY"
//       required: true,
//             enum: Object.values(MODULE_KEY),
//       index: true
//     },

//     permissions: {
//       create: { type: Boolean, default: false },
//       read: { type: Boolean, default: false },
//       update: { type: Boolean, default: false },
//       delete: { type: Boolean, default: false }
//     }
//   },
//   { timestamps: true }
// );

// modulePermissionSchema.index(
//   { role: 1, moduleKey: 1 },
//   { unique: true }
// );

// export default mongoose.model(
//   "ModulePermission",
//   modulePermissionSchema
// );


// models/ModulePermission.model.js
import mongoose from "mongoose";
import { MODULE_KEY } from "../constants/enums.js";

const modulePermissionSchema = new mongoose.Schema({
  role: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Role",
    required: true,
    index: true
  },

  moduleKey: {
    type: String,
    enum: Object.values(MODULE_KEY),
    required: true,
    index: true
  },

  permissions: {
    create: { type: Boolean, default: false },
    read: { type: Boolean, default: false },
    update: { type: Boolean, default: false },
    delete: { type: Boolean, default: false },
  },
}, { timestamps: true });

modulePermissionSchema.index({ role: 1, moduleKey: 1 }, { unique: true });

export default mongoose.model("ModulePermission", modulePermissionSchema);
