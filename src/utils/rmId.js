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

export const generateTransactionId = () => {
  const randomNumber = Math.floor(1000000000 + Math.random() * 9000000000);
  return `RM${randomNumber}`;
}



// const getNextSequence = async (name) => {
//   const counter = await Counter.findByIdAndUpdate(
//     name,
//     { $inc: { seq: 1 } },
//     { new: true, upsert: true, setDefaultsOnInsert: true }
//   );
//   return counter.seq;
// };