
// const orderSchema = new mongoose.Schema(
//   {
//     rmOrderId: {
//       type: String,
//       unique: true,
//       index: true,
//     },

//     customer: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "Customer",
//       required: true,
//       index: true
//     },

//     store: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "Store",
//       required: true,
//       index: true
//     },

//     items: [
//       {
//         productName: String,
//         variantLabel: String,
//         sellingPrice: Number,
//         qty: Number,
//         gstPercent: Number
//       }
//     ],

//     totalAmount: Number,
//     gstAmount: Number,
//     discountAmount: { type: Number, default: 0 }, // Added
//     payableAmount: Number,
//     couponCode: { type: String, default: null }, // Added

//     deliveryAddress: {
//       fullAddress: String,
//       city: String,
//       pincode: String,
//       latitude: Number,
//       longitude: Number
//     },

//     status: {
//       type: String,
//       enum: Object.values(ORDER_STATUS),
//       default: ORDER_STATUS.PLACED,
//       index: true
//     }
//   },
//   { timestamps: true }
// );





import mongoose from "mongoose";

import { ORDER_STATUS } from "../constants/enums.js";

const orderSchema = new mongoose.Schema(
  {
    rmOrderId: { type: String, unique: true, index: true },

    customerId: { type: mongoose.Schema.Types.ObjectId, ref: "Customer", required: true },
    reason:String,
    store: { type: mongoose.Schema.Types.ObjectId, ref: "Store", required: true },

    items: [
      {
        productName: String,
        variantLabel: String,
        sellingPrice: Number,
        qty: Number,
        gstPercent: Number
      }
    ],

    totalAmount: Number,
    gstAmount: Number,
    discountAmount: { type: Number, default: 0 },
    payableAmount: Number,

    couponCode: String,

    // ✅ Payment
    paymentMethod: {
      type: String,
      enum: ["COD", "ONLINE", "UPI", "WALLET"],
      default: "COD"
    },
    paymentStatus: {
      type: String,
      enum: ["PENDING", "PAID", "FAILED", "REFUNDED"],
      default: "PENDING"
    },
    transactionId: String,

    // ✅ Delivery
    deliveryDate: Date,
    notes: String,
    deliverySlot: String,
    deliveryAddress: {
      fullAddress: String,
      city: String,
      pincode: String,
      latitude: Number,
      longitude: Number
    },

    // ✅ Order Status
    status: {
      type: String,
      enum: Object.values(ORDER_STATUS),
      default: ORDER_STATUS.PLACED,
      index: true
    },

    // ✅ Status Timeline
    statusTimeline: {
      placedAt: { type: Date, default: Date.now },
      acceptedAt: Date,
      preparingAt: Date,
      readyAt: Date,
      outForDeliveryAt: Date,
      deliveredAt: Date,
      cancelledAt: Date
    }
  },
  { timestamps: true }
);

// ================= AUTO ORDER ID + STATUS TIMELINE =================
orderSchema.pre("save", async function (next) {

  if (this.isModified("status")) {
    const now = new Date();

    switch (this.status) {
      case ORDER_STATUS.ACCEPTED:
        this.statusTimeline.acceptedAt = now;
        break;
      case ORDER_STATUS.PREPARING:
        this.statusTimeline.preparingAt = now;
        break;
      case ORDER_STATUS.READY:
        this.statusTimeline.readyAt = now;
        break;
      case ORDER_STATUS.OUT_FOR_DELIVERY:
        this.statusTimeline.outForDeliveryAt = now;
        break;
      case ORDER_STATUS.DELIVERED:
        this.statusTimeline.deliveredAt = now;
        this.paymentStatus = "PAID"; // COD auto paid
        break;
      case ORDER_STATUS.CANCELLED:
        this.statusTimeline.cancelledAt = now;
        break;
    }
  }

  next();
});

export default mongoose.model("Order", orderSchema);




