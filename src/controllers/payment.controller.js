import Payment from "../models/Payment.model.js";
import Order from "../models/Order.model.js"; // your Order model
import mongoose from "mongoose";
import { PAYMENT_METHODS, PAYMENT_STATUS } from "../models/Payment.model.js";

// ✅ Create Payment + Order (for Razorpay or any payment gateway)
export const createPayment = async (req, res) => {
  try {
    const { orderDetails, amount, method, transactionId, customer } = req.body;

    // ===== Direct Validation in controller =====
    if (!orderDetails || typeof orderDetails !== "object") {
      return res.status(400).json({ success: false, message: "Order details are required" });
    }

    if (!amount || typeof amount !== "number") {
      return res.status(400).json({ success: false, message: "Amount is required and must be a number" });
    }

    if (!method || !Object.values(PAYMENT_METHODS).includes(method)) {
      return res.status(400).json({
        success: false,
        message: `Payment method is required and must be one of ${Object.values(PAYMENT_METHODS).join(", ")}`,
      });
    }

    if (!transactionId || typeof transactionId !== "string") {
      return res.status(400).json({ success: false, message: "Transaction ID is required" });
    }

    if (!customer || typeof customer !== "object") {
      return res.status(400).json({ success: false, message: "Customer info is required" });
    }

    // ===== Start transaction =====
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // 1️⃣ Create Order
      const order = await Order.create([orderDetails], { session });

      // 2️⃣ Create Payment
      const payment = await Payment.create(
        [
          {
            order: order[0]._id,
            amount,
            method,
            transactionId,
            status: PAYMENT_STATUS.SUCCESS,
            customer,
          },
        ],
        { session }
      );

      await session.commitTransaction();
      session.endSession();

      res.status(201).json({ success: true, data: { payment: payment[0], order: order[0] } });
    } catch (err) {
      await session.abortTransaction();
      session.endSession();

      if (err.code === 11000) {
        return res.status(400).json({ success: false, message: "Transaction ID must be unique" });
      }

      throw err;
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ✅ Get Payments with search, filter, pagination
export const getPayments = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, status, method } = req.query;
    const query = {};

    // Search
    if (search) {
      query.$or = [
        { transactionId: { $regex: search, $options: "i" } },
        { "customer.name": { $regex: search, $options: "i" } },
        { "customer.email": { $regex: search, $options: "i" } },
        { "customer.phone": { $regex: search, $options: "i" } },
      ];
    }

    // Filter
    if (status && Object.values(PAYMENT_STATUS).includes(status)) query.status = status;
    if (method && Object.values(PAYMENT_METHODS).includes(method)) query.method = method;

    const total = await Payment.countDocuments(query);

    const payments = await Payment.find(query)
      .populate("order", "orderNumber") // populate order details
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.status(200).json({
      success: true,
      data: payments,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ✅ Get single Payment by ID
export const getPaymentById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid payment ID" });
    }

    const payment = await Payment.findById(id).populate("order", "orderNumber");
    if (!payment) return res.status(404).json({ success: false, message: "Payment not found" });

    res.status(200).json({ success: true, data: payment });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ✅ Update Payment Status
export const updatePaymentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ success: false, message: "Invalid payment ID" });
    if (!status || !Object.values(PAYMENT_STATUS).includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid payment status" });
    }

    const payment = await Payment.findByIdAndUpdate(id, { status }, { new: true });
    if (!payment) return res.status(404).json({ success: false, message: "Payment not found" });

    res.status(200).json({ success: true, data: payment });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ✅ Delete Payment
export const deletePayment = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ success: false, message: "Invalid payment ID" });

    const payment = await Payment.findByIdAndDelete(id);
    if (!payment) return res.status(404).json({ success: false, message: "Payment not found" });

    res.status(200).json({ success: true, message: "Payment deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
