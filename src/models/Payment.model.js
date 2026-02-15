import mongoose from "mongoose";

// ✅ Payment status enum
export const PAYMENT_STATUS = Object.freeze({
  INITIATED: "INITIATED",
  SUCCESS: "SUCCESS",
  FAILED: "FAILED",
  PENDING: "PENDING",
});

// ✅ Payment methods
export const PAYMENT_METHODS = Object.freeze({
  RAZORPAY: "RAZORPAY",
  PHONEPE: "PHONEPE",
  PAYTM: "PAYTM",
  UPI: "UPI",
  CARD: "CARD",
  WALLET: "WALLET",
});

const paymentSchema = new mongoose.Schema(
  {
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
      index: true,
    },
    amount: { type: Number, required: true },
    method: { type: String, enum: Object.values(PAYMENT_METHODS), required: true },
    transactionId: { type: String, required: true, unique: true },
    status: { type: String, enum: Object.values(PAYMENT_STATUS), default: PAYMENT_STATUS.INITIATED },
    customer: {
      name: { type: String },
      email: { type: String },
      phone: { type: String },
    },
    gatewayResponse: { type: Object }, // optional: store full response if needed for debugging
  },
  { timestamps: true }
);

export default mongoose.model("Payment", paymentSchema);
