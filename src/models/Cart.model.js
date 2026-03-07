// import mongoose from "mongoose";

// const cartItemSchema = new mongoose.Schema(
//   {
//     product: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "Product",
//       required: true,
//     },

//     variantId: {
//       type: mongoose.Schema.Types.ObjectId,
//       required: true,
//     },

//     qty: {
//       type: Number,
//       default: 1,
//       min: 1,
//     },
//   },
//   { _id: false }
// );

// const cartSchema = new mongoose.Schema(
//   {
//     customer: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "Customer",
//       required: true,
//       unique: true,
//       index: true,
//     },

//     items: [cartItemSchema],
//   },
//   { timestamps: true }
// );

// cartSchema.index({ customer: 1 });

// export default mongoose.model("Cart", cartSchema);


import mongoose from "mongoose";

const cartItemSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },

    variantId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },

    qty: {
      type: Number,
      default: 1,
      min: 1,
    },
  },
  { _id: false }
);

const cartSchema = new mongoose.Schema(
  {
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
      unique: true,
      index: true,
    },

    items: [cartItemSchema],
  },
  { timestamps: true }
);

cartSchema.index({ customerId: 1 });

export default mongoose.model("Cart", cartSchema);