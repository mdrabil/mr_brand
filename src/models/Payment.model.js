// ============================
// STEP 6
// PAYMENT MODEL
// models/Payment.js
// ============================

import mongoose from "mongoose";
import { PAYMENT_STATUS } from "../constants/enums.js";

const paymentSchema = new mongoose.Schema(
  {
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
    },

    amount: Number,

    method: String,

    rmPaymentId: {
      type: String,
      unique: true,
    },

    paymentMethodType: {
  type: String,
  enum: ["card", "upi", "netbanking", "wallet", "emi", "cod"],
},

    transactionId: {
      type: String,
      unique: true,
      sparse: true,
    },

    gatewayOrderId: String,

    status: { type: String, enum: Object.values(PAYMENT_STATUS), default: PAYMENT_STATUS.INITIATED },
  

    customer: {
      name: String,
      email: String,
      phone: String,
    },

    gatewayResponse: Object,

    failureReason: String,
  },
  { timestamps: true }
);

export default mongoose.model(
  "Payment",
  paymentSchema
);
