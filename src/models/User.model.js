import mongoose from "mongoose";

import { generateRMId } from "../utils/rmId.js";

const userSchema = new mongoose.Schema(
  {
    rmId: { type: String, unique: true, index: true },
    refreshToken: { type: String, select: false },
    fullName: { type: String, required: true },
    mobile: { type: String, required: true, unique: true, index: true },
    email: { type: String, lowercase: true },
    passwordHash: { type: String, required: true, select: false },
    roles: [{ type: mongoose.Schema.Types.ObjectId, ref: "Role" }],
    isBlocked: { type: Boolean, default: false },
    lastLoginAt: Date
  },
  { timestamps: true }
);


/* --------------------------------------------------
 🔥 AUTO RM ID (ASYNC SAFE)
-------------------------------------------------- */
userSchema.pre("save", async function (next) {
  if (!this.rmId) this.rmId = await generateRMId("RMU");
  next();
});

// User model
userSchema.index({
  fullName: "text",
  mobile: "text",
  email: "text"
});




export default mongoose.model("User", userSchema);
