// export const generateRMId = (prefix) => {
//   const random = Math.floor(10000000 + Math.random() * 90000000);
//   return `${prefix}-${random}`;
// };



// utils/rmId.js
import Counter from "../models/Counter.model.js";

export const generateRMId = async (prefix, sequenceName = "DEFAULT") => {
  const counter = await Counter.findByIdAndUpdate(
    sequenceName,
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );

  const paddedSeq = String(counter.seq).padStart(6, "0"); // 6 digit
  return `${prefix}${paddedSeq}`;
};
