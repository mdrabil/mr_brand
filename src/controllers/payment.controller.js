
import crypto from "crypto";
import mongoose from "mongoose";

import { razorpay } from "../config/razorpay.js";
import { config } from "../config/config.js";

import Cart from "../models/Cart.model.js";
import Product from "../models/Product.model.js";
import Order from "../models/Order.model.js";
import Payment from "../models/Payment.model.js";
import Customer from "../models/Customer.js";
import Coupon from "../models/Coupon.model.js";
import CouponUsage from "../models/CouponUsage.model.js";
import StoreModel from "../models/Store.model.js";

import { ORDER_STATUS, PAYMENT_STATUS } from "../constants/enums.js";

import { generateRMId } from "../utils/rmId.js";
import { buildStoreFilter } from "../utils/accessHelper.js";


// ================= CREATE PAYMENT ORDER =================

export const createPaymentOrderController = async (req, res) => {

    try {

      const customerId =
        req.user._id;

      const cart =
        await Cart.findOne({
          customerId,
        }).populate(
          "items.productId"
        );

      if (
        !cart ||
        cart.items.length === 0
      ) {

        throw new Error(
          "Cart empty"
        );
      }

      let totalAmount = 0;

      let gstAmount = 0;

      for (const item of cart.items) {

        const product =
          item.productId;

        const variant =
          product.variants.id(
            item.variantId
          );

        if (!variant) {

          throw new Error(
            "Variant missing"
          );
        }

        totalAmount +=
          Number(
            variant.sellingPrice
          ) *
          Number(item.qty);

        gstAmount +=
          (
            Number(
              variant.sellingPrice
            ) *
            Number(item.qty) *
            Number(
              product.gstPercent || 0
            )
          ) / 100;
      }

      const payableAmount =
        Number(
          (
            totalAmount +
            gstAmount
          ).toFixed(2)
        );

      // CREATE RAZORPAY ORDER
      const razorpayOrder =
        await razorpay.orders.create({
          amount:
            payableAmount * 100,

          currency: "INR",

          receipt:
            `receipt_${Date.now()}`,
        });

      return res.status(200).json({
        success: true,

        order: razorpayOrder,
      });

    } catch (error) {

      return res.status(400).json({
        success: false,

        message:
          error.message,
      });
    }
  };


// ================= VERIFY PAYMENT =================




export const verifyPaymentController = async (req, res) => {

  const session = await mongoose.startSession();
  session.startTransaction();

  try {

    const customerId = req.user._id;

    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      deliveryAddress,
      couponCode,
      deliveryDate,
      notes,
    } = req.body;

    // ================= VERIFY SIGNATURE =================

    const body =
      razorpay_order_id + "|" + razorpay_payment_id;

    const expectedSignature = crypto
      .createHmac("sha256", config.razorpayKeySecret)
      .update(body)
      .digest("hex");

    const isAuthentic =
      expectedSignature === razorpay_signature;

    if (!isAuthentic) {

      const rmPaymentId = await generateRMId(
        "PAY",
        "PAYMENT"
      );

      await Payment.create([
        {
          amount: 0,
          method: "RAZORPAY",
          rmPaymentId,
          gatewayOrderId: razorpay_order_id,
          transactionId: razorpay_payment_id,
          status: "FAILED",
          failureReason: "Signature mismatch",
          customer: {
            name: req.user.fullName,
            email: req.user.email,
            phone: req.user.mobile,
          },
          gatewayResponse: {
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
          },
        },
      ], { session });

      throw new Error("Payment verification failed");
    }

    // ================= DUPLICATE CHECK =================

    const alreadyPaid = await Payment.findOne({
      transactionId: razorpay_payment_id,
    });

    if (alreadyPaid) {
      throw new Error("Payment already processed");
    }

    // ================= GET CART =================

    const cart = await Cart.findOne({ customerId })
      .populate("items.productId")
      .session(session);

    if (!cart || cart.items.length === 0) {
      throw new Error("Cart empty");
    }

    let totalAmount = 0;
    let gstAmount = 0;
    let discountAmount = 0;
    const orderItems = [];

    for (const item of cart.items) {

      const product = item.productId;
      const variant = product.variants.id(item.variantId);

      if (!variant) {
        throw new Error("Variant not found");
      }

      if (variant.stockQty < item.qty) {
        throw new Error(`${product.name} out of stock`);
      }

      const itemTotal =
        Number(variant.sellingPrice) * Number(item.qty);

      const itemGST =
        (itemTotal * Number(product.gstPercent || 0)) / 100;

      totalAmount += itemTotal;
      gstAmount += itemGST;

      orderItems.push({
        productName: product.name,
        variantLabel: variant.value,
        sellingPrice: variant.sellingPrice,
        qty: item.qty,
        gstPercent: product.gstPercent,
      });

      const stockUpdate = await Product.updateOne(
        {
          _id: product._id,
          "variants._id": variant._id,
          "variants.stockQty": { $gte: item.qty },
        },
        {
          $inc: {
            "variants.$.stockQty": -item.qty,
          },
        },
        { session }
      );

      if (stockUpdate.modifiedCount === 0) {
        throw new Error("Stock update failed");
      }
    }

    // ================= COUPON =================

    if (couponCode) {

      const coupon = await Coupon.findOne({
        code: couponCode.toUpperCase(),
        status: "ACTIVE",
      }).session(session);

      if (coupon) {

        if (coupon.type === "PERCENT") {
          discountAmount = (totalAmount * coupon.value) / 100;
        } else {
          discountAmount = coupon.value;
        }

        discountAmount = Math.min(discountAmount, totalAmount);

        await CouponUsage.create(
          [{
            coupon: coupon._id,
            user: customerId,
          }],
          { session }
        );
      }
    }

    // ================= FINAL AMOUNT =================

    const payableAmount = Number(
      (totalAmount + gstAmount - discountAmount).toFixed(2)
    );

    const rmPaymentId = await generateRMId("PAY", "PAYMENT");

    const paymentDetails = await razorpay.payments.fetch(
  razorpay_payment_id
);

    // ✅ FIXED: Payment created WITH session (IMPORTANT)
    const paymentArr = await Payment.create(
      [{
        amount: payableAmount,
        method: "RAZORPAY",
          paymentMethodType: paymentDetails.method,
        rmPaymentId,
        gatewayOrderId: razorpay_order_id,
        transactionId: razorpay_payment_id,
        status: "SUCCESS",
        customer: {
          name: req.user.fullName,
          email: req.user.email,
          phone: req.user.mobile,
        },
        order: null,
        gatewayResponse: {
          razorpay_order_id,
          razorpay_payment_id,
          razorpay_signature,
            payment_method: paymentDetails, 
        },
      }],
      { session }
    );

    const payment = paymentArr[0];

    // ================= SAVE NEW ADDRESS =================

    let isNewAddress = true;

    const existingAddress = req.user.addresses.find(
      (addr) =>
        addr.fullAddress === deliveryAddress.fullAddress &&
        addr.mobile === deliveryAddress.mobile &&
        addr.city === deliveryAddress.city &&
        addr.state === deliveryAddress.state &&
        addr.pincode === deliveryAddress.pincode &&
        addr.type === deliveryAddress.type
    );

    if (existingAddress) {
      isNewAddress = false;
    }

    if (isNewAddress) {
      await Customer.updateOne(
        { _id: customerId },
        {
          $push: {
            addresses: {
              ...deliveryAddress,
              location: {
                type: "Point",
                coordinates: [
                  deliveryAddress.longitude,
                  deliveryAddress.latitude,
                ],
              },
            },
          },
        },
        { session }
      );
    }

    // ================= NEAREST STORE =================

    const nearestStore = await StoreModel.findOne({
      "address.location": {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [
              deliveryAddress.longitude,
              deliveryAddress.latitude,
            ],
          },
          $maxDistance: 20000000,
        },
      },
    });

    // ================= CREATE ORDER =================

    const rmOrderId = await generateRMId("ORD", "ORDER");

    const order = await Order.create(
      [{
        rmOrderId,
        customerId,
        store: nearestStore?._id,
        items: orderItems,
        totalAmount,
        gstAmount,
        discountAmount,
        payableAmount,
        paymentMethod: "ONLINE",
        paymentStatus: "PAID",
        payment: payment._id,
        transactionId: razorpay_payment_id,
        deliveryAddress: {
          ...deliveryAddress,
          location: {
            type: "Point",
            coordinates: [
              deliveryAddress.longitude,
              deliveryAddress.latitude,
            ],
          },
        },
        notes,
        deliveryDate,
        status: ORDER_STATUS.PLACED,
      }],
      { session }
    );

    // ================= FIX: LINK PAYMENT TO ORDER (PROPER WAY) =================

    payment.order = order[0]._id;
    await payment.save({ session });

    // ================= CLEAR CART =================

    await Cart.updateOne(
      { customerId },
      { $set: { items: [] } },
      { session }
    );

    const updatedUser = await Customer.findById(customerId);

    await session.commitTransaction();
    session.endSession();

    return res.status(200).json({
      success: true,
      message: "Payment successful",
      orderId: order[0]._id,
      order: order[0],
      user: updatedUser,
    });

  } catch (error) {

    await session.abortTransaction();
    session.endSession();

    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};




  export const saveFailedPaymentController = async (req, res) => {

    try {

      const {
        razorpay_order_id,
        razorpay_payment_id,
        reason,
        amount,
      } = req.body;

      const rmPaymentId =
        await generateRMId(
          "PAY",
          "PAYMENT"
        );

      await Payment.create({

        amount,

        method: "RAZORPAY",

        rmPaymentId,

        gatewayOrderId:
          razorpay_order_id,

        transactionId:
          razorpay_payment_id,

        status: "FAILED",

        failureReason:
          reason,

        customer: {
          name: req.user.name,
          email: req.user.email,
          phone: req.user.mobile,
        },
      });

      return res.status(200).json({
        success: true,
      });

    } catch (error) {

      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  };


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
// export const getPayments = async (req, res) => {
//   try {
//     const user = req.user;

//     const {
//       page = 1,
//       limit = 10,
//       search,
//       status,
//       method,
//       store,
//     } = req.query;

//     let query = {};

//     // ================= STORE ACCESS =================
//     const accessFilter = await buildStoreFilter(user, {
//       field: "store",
//       storeId: store,
//     });

//     // ================= GET ALLOWED ORDER IDS =================
//     const allowedOrders = await Order.find(accessFilter)
//       .select("_id");

//     const allowedOrderIds = allowedOrders.map(
//       (o) => o._id
//     );

//     // 🔥 only payments of allowed orders
//     query.order = {
//       $in: allowedOrderIds,
//     };

//     // ================= SEARCH =================
//     if (search && search.trim() !== "") {
//       query.$or = [
//         {
//           transactionId: {
//             $regex: search,
//             $options: "i",
//           },
//         },

//         {
//           "customer.fullName": {
//             $regex: search,
//             $options: "i",
//           },
//         },

//         {
//           "customer.email": {
//             $regex: search,
//             $options: "i",
//           },
//         },

//         {
//           "customer.phone": {
//             $regex: search,
//             $options: "i",
//           },
//         },
//       ];
//     }

//     // ================= STATUS FILTER =================
//     if (
//       status &&
//       Object.values(PAYMENT_STATUS).includes(status)
//     ) {
//       query.status = status;
//     }

//     // ================= METHOD FILTER =================
//     if (method) {
//       query.method = method;
//     }

//     // ================= TOTAL =================
//     const total = await Payment.countDocuments(query);

//     // ================= PAYMENTS =================
//     const payments = await Payment.find(query)
//       .populate({
//         path: "order",
//         select:
//           "rmOrderId store totalAmount payableAmount status",
//         populate: {
//           path: "store",
//           select: "_id storeName address",
//         },
//       })
//       .sort({ createdAt: -1 })
//       .skip((page - 1) * limit)
//       .limit(Number(limit));

//     res.status(200).json({
//       success: true,
//       data: payments,

//       pagination: {
//         total,
//         page: Number(page),
//         limit: Number(limit),
//         pages: Math.ceil(total / limit),
//       },
//     });
//   } catch (error) {
//     console.error("getPayments:", error);

//     res.status(500).json({
//       success: false,
//       message: error.message,
//     });
//   }
// };

// ===============================
// GET PAYMENTS
// ===============================
export const getPayments = async (req, res) => {
  try {
    const user = req.user;

    const roleNames = req.user.roles || [];

const isAdmin = roleNames.includes("ADMIN");
const isSuperAdmin = roleNames.includes("SUPER_ADMIN");

const canViewGateway = isAdmin || isSuperAdmin;

    const {
      page = 1,
      limit = 10,
      search,
      status,
      method,
      store,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;

    let query = {};

    // ================= STORE ACCESS =================
    const accessFilter = await buildStoreFilter(user, {
      field: "store",
      storeId: store,
    });

    // ================= GET ALLOWED ORDER IDS =================
    const allowedOrders = await Order.find(accessFilter)
      .select("_id");

    const allowedOrderIds = allowedOrders.map(
      (o) => o._id
    );

    // ================= PAYMENT ACCESS =================
    query.order = {
      $in: allowedOrderIds,
    };

    // ================= SEARCH =================
    if (search && search.trim() !== "") {
      query.$or = [
        {
          transactionId: {
            $regex: search,
            $options: "i",
          },
        },

        {
          rmPaymentId: {
            $regex: search,
            $options: "i",
          },
        },

        {
          "customer.name": {
            $regex: search,
            $options: "i",
          },
        },

        {
          "customer.email": {
            $regex: search,
            $options: "i",
          },
        },

        {
          "customer.phone": {
            $regex: search,
            $options: "i",
          },
        },
      ];
    }

    // ================= STATUS FILTER =================
    if (
      status &&
      Object.values(PAYMENT_STATUS).includes(status)
    ) {
      query.status = status;
    }

    // ================= METHOD FILTER =================
    if (method) {
      query.method = method;
    }

    // ================= SORT =================
    let sort = {};

    sort[sortBy] =
      sortOrder === "asc" ? 1 : -1;

    // ================= TOTAL =================
    const total = await Payment.countDocuments(
      query
    );

    // ================= PAYMENT SUMMARY =================
    const paymentSummaryAgg =
      await Payment.aggregate([
        {
          $match: query,
        },

        {
          $group: {
            _id: "$status",

            totalPayments: {
              $sum: 1,
            },

            totalAmount: {
              $sum: "$amount",
            },
          },
        },
      ]);

    const summary = {
      totalPayments: total,

      totalSuccessPayments: 0,

      totalFailedPayments: 0,

      totalInitiatedPayments: 0,

      totalRefundedPayments: 0,

      totalSuccessAmount: 0,

      totalFailedAmount: 0,
    };

    paymentSummaryAgg.forEach((item) => {
      switch (item._id) {
        case PAYMENT_STATUS.SUCCESS:
          summary.totalSuccessPayments =
            item.totalPayments;

          summary.totalSuccessAmount =
            item.totalAmount;

          break;

        case PAYMENT_STATUS.FAILED:
          summary.totalFailedPayments =
            item.totalPayments;

          summary.totalFailedAmount =
            item.totalAmount;

          break;

        case PAYMENT_STATUS.INITIATED:
          summary.totalInitiatedPayments =
            item.totalPayments;

          break;

        case PAYMENT_STATUS.REFUNDED:
          summary.totalRefundedPayments =
            item.totalPayments;

          break;
      }
    });

    // ================= PAYMENTS =================
    // const payments = await Payment.find(query).populate({
    //     path: "order",

    //     select:
    //       "rmOrderId store totalAmount payableAmount status",

    //     populate: {
    //       path: "store",

    //       select:
    //         "_id storeName address",
    //     },
    //   })

    let selectFields = `
  rmPaymentId
  order
  amount
  method
  paymentMethodType
  status
  transactionId
  customer
  createdAt
  updatedAt
`;

if (canViewGateway) {
  selectFields += `
    gatewayOrderId
    gatewayResponse
  `;
}

const payments = await Payment.find(query)
  .select(selectFields)
  .populate({
    path: "order",
    select: "rmOrderId store totalAmount payableAmount status",
    populate: {
      path: "store",
      select: "_id storeName address",
    },
  })
  .sort(sort)
  .skip((page - 1) * limit)
  .limit(Number(limit));
    res.status(200).json({
      success: true,

      data: payments,

      summary,

      pagination: {
        total,

        page: Number(page),

        limit: Number(limit),

        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error(
      "getPayments:",
      error
    );

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ✅ Get single Payment by ID
export const getPaymentById = async (req, res) => {
  try {
    const user = req.user;
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment ID",
      });
    }

    const payment = await Payment.findById(id)
      .populate({
        path: "order",
        select: "rmOrderId store totalAmount payableAmount",
        populate: {
          path: "store",
          select: "_id storeName",
        },
      });

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment not found",
      });
    }

    // ================= ACCESS CHECK =================
    const accessFilter = await buildStoreFilter(user, {
      field: "_id",
      storeId: payment.order?.store?._id,
    });

    const allowedOrder = await Order.findOne({
      _id: payment.order?._id,
      ...accessFilter,
    });

    if (!allowedOrder) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    res.status(200).json({
      success: true,
      data: payment,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const updatePaymentStatus = async (req, res) => {
  try {
    const user = req.user;

    const { id } = req.params;
    const { status } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment ID",
      });
    }

    if (
      !status ||
      !Object.values(PAYMENT_STATUS).includes(status)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment status",
      });
    }

    const payment = await Payment.findById(id)
      .populate("order", "store");

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment not found",
      });
    }

    // ================= ACCESS CHECK =================
    const accessFilter = await buildStoreFilter(user, {
      field: "_id",
      storeId: payment.order?.store,
    });

    const allowedOrder = await Order.findOne({
      _id: payment.order?._id,
      ...accessFilter,
    });

    if (!allowedOrder) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    payment.status = status;

    await payment.save();

    res.status(200).json({
      success: true,
      data: payment,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ✅ Delete Payment
export const deletePayment = async (req, res) => {
  try {

        const roleNames = req.user.roles || [];
    
    const isAdmin = roleNames.includes("ADMIN");
    const isSuperAdmin = roleNames.includes("SUPER_ADMIN");
    
    if (!isAdmin && !isSuperAdmin) {
      return res.status(403).json({
        success: false,
        message: "You are not allowed to delete payment"
      });
    }
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ success: false, message: "Invalid payment ID" });

    const payment = await Payment.findByIdAndDelete(id);
    if (!payment) return res.status(404).json({ success: false, message: "Payment not found" });

    res.status(200).json({ success: true, message: "Payment deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};




// export const verifyPaymentController =async (req, res) => {

//     const session =
//       await mongoose.startSession();

//     session.startTransaction();

//     try {

//       const customerId =
//         req.user._id;

//       const {

//         razorpay_order_id,

//         razorpay_payment_id,

//         razorpay_signature,

//         deliveryAddress,

//         couponCode,

//         deliveryDate,

//         notes,

//       } = req.body;

//       // ================= VERIFY SIGNATURE =================

//       const body =
//         razorpay_order_id +
//         "|" +
//         razorpay_payment_id;

//       const expectedSignature =
//         crypto
//           .createHmac(
//             "sha256",
//             config.razorpayKeySecret
//           )
//           .update(body)
//           .digest("hex");

//       const isAuthentic =
//         expectedSignature ===
//         razorpay_signature;

//       if (!isAuthentic) {

//         const rmPaymentId =
//           await generateRMId(
//             "PAY",
//             "PAYMENT"
//           );

//         await Payment.create({
//           amount: 0,

//           method: "RAZORPAY",

//           rmPaymentId,

//           gatewayOrderId:
//             razorpay_order_id,

//           transactionId:
//             razorpay_payment_id,

//           status: "FAILED",

//           failureReason:
//             "Signature mismatch",

//           customer: {
//             name: req.user.fullName,
//             email: req.user.email,
//             phone: req.user.mobile,
//           },

//           gatewayResponse: {
//             razorpay_order_id,
//             razorpay_payment_id,
//             razorpay_signature,
//           },
//         });

//         throw new Error(
//           "Payment verification failed"
//         );
//       }

//       // ================= DUPLICATE CHECK =================

//       const alreadyPaid =
//         await Payment.findOne({
//           transactionId:
//             razorpay_payment_id,
//         });

//       if (alreadyPaid) {

//         throw new Error(
//           "Payment already processed"
//         );
//       }

//       // ================= GET CART =================

//       const cart =
//         await Cart.findOne({
//           customerId,
//         })
//           .populate(
//             "items.productId"
//           )
//           .session(session);

//       if (
//         !cart ||
//         cart.items.length === 0
//       ) {

//         throw new Error(
//           "Cart empty"
//         );
//       }

//       let totalAmount = 0;

//       let gstAmount = 0;

//       let discountAmount = 0;

//       const orderItems = [];

//       for (const item of cart.items) {

//         const product =
//           item.productId;

//         const variant =
//           product.variants.id(
//             item.variantId
//           );

//         if (!variant) {

//           throw new Error(
//             "Variant not found"
//           );
//         }

//         // STOCK CHECK
//         if (
//           variant.stockQty <
//           item.qty
//         ) {

//           throw new Error(
//             `${product.name} out of stock`
//           );
//         }

//         const itemTotal =
//           Number(
//             variant.sellingPrice
//           ) *
//           Number(item.qty);

//         const itemGST =
//           (
//             itemTotal *
//             Number(
//               product.gstPercent || 0
//             )
//           ) / 100;

//         totalAmount += itemTotal;

//         gstAmount += itemGST;

//         orderItems.push({
//           productName:
//             product.name,

//           variantLabel:
//             variant.value,

//           sellingPrice:
//             variant.sellingPrice,

//           qty: item.qty,

//           gstPercent:
//             product.gstPercent,
//         });

//         // REDUCE STOCK
//         const stockUpdate =
//           await Product.updateOne(
//             {
//               _id: product._id,

//               "variants._id":
//                 variant._id,

//               "variants.stockQty":
//                 {
//                   $gte: item.qty,
//                 },
//             },

//             {
//               $inc: {
//                 "variants.$.stockQty":
//                   -item.qty,
//               },
//             },

//             { session }
//           );

//         if (
//           stockUpdate.modifiedCount === 0
//         ) {

//           throw new Error(
//             "Stock update failed"
//           );
//         }
//       }

//       // ================= COUPON =================

//       if (couponCode) {

//         const coupon =
//           await Coupon.findOne({
//             code:
//               couponCode.toUpperCase(),

//             status: "ACTIVE",
//           }).session(session);

//         if (coupon) {

//           if (
//             coupon.type ===
//             "PERCENT"
//           ) {

//             discountAmount =
//               (
//                 totalAmount *
//                 coupon.value
//               ) / 100;

//           } else {

//             discountAmount =
//               coupon.value;
//           }

//           discountAmount =
//             Math.min(
//               discountAmount,
//               totalAmount
//             );

//           await CouponUsage.create(
//             [
//               {
//                 coupon:
//                   coupon._id,

//                 user:
//                   customerId,
//               },
//             ],
//             { session }
//           );
//         }
//       }

//       // ================= FINAL AMOUNT =================

//  // ================= FINAL AMOUNT =================

// const payableAmount =Number((totalAmount + gstAmount - discountAmount).toFixed(2));


// const rmPaymentId = await generateRMId("PAY","PAYMENT");

// const payment =  await Payment.create({
//     amount:
//       payableAmount,

//     method:
//       "RAZORPAY",

//     rmPaymentId,

//     gatewayOrderId:
//       razorpay_order_id,

//     transactionId:
//       razorpay_payment_id,

//     status:
//       "SUCCESS",

//     customer: {
//       name:
//         req.user.fullName,

//       email:
//         req.user.email,

//       phone:
//         req.user.mobile,
//     },
//   order: null,
//     gatewayResponse: {
//       razorpay_order_id,
//       razorpay_payment_id,
//       razorpay_signature,
//     },
//   });


// // ================= SAVE NEW ADDRESS =================

// let isNewAddress = true;

// const existingAddress =
//   req.user.addresses.find(
//     (addr) =>

//       addr.fullAddress ===
//         deliveryAddress.fullAddress &&

//       addr.mobile ===
//         deliveryAddress.mobile &&

//       addr.city ===
//         deliveryAddress.city &&

//       addr.state ===
//         deliveryAddress.state &&

//       addr.pincode ===
//         deliveryAddress.pincode &&

//       addr.type ===
//         deliveryAddress.type
//   );

// if (existingAddress) {

//   isNewAddress = false;
// }

// if (isNewAddress) {

//   await Customer.updateOne(
//     {
//       _id: customerId,
//     },

//     {
//       $push: {
//         addresses: {
//           ...deliveryAddress,

//           location: {
//             type: "Point",

//             coordinates: [
//               deliveryAddress.longitude,
//               deliveryAddress.latitude,
//             ],
//           },
//         },
//       },
//     },

//     { session }
//   );
// }


// // ================= NEAREST STORE =================

// const nearestStore =
//   await StoreModel.findOne({
//     "address.location": {
//       $near: {
//         $geometry: {
//           type: "Point",

//           coordinates: [
//             deliveryAddress.longitude,
//             deliveryAddress.latitude,
//           ],
//         },

//         $maxDistance:
//           20000000,
//       },
//     },
//   });
//       // ================= CREATE ORDER =================

//       const rmOrderId =
//         await generateRMId(
//           "ORD",
//           "ORDER"
//         );

//       const order = await Order.create(
//           [
//             {
//               rmOrderId,

//               customerId,

//               store:
//                 nearestStore?._id,

//               items:
//                 orderItems,

//               totalAmount,

//               gstAmount,

//               discountAmount,

//               payableAmount,

//               paymentMethod:
//                 "ONLINE",

//               paymentStatus:
//                 "PAID",

//               payment:
//                 payment._id,

//               transactionId:
//                 razorpay_payment_id,

//               deliveryAddress: {
//                 ...deliveryAddress,

//                 location: {
//                   type: "Point",

//                   coordinates: [
//                     deliveryAddress.longitude,
//                     deliveryAddress.latitude,
//                   ],
//                 },
//               },

//               notes,

//               deliveryDate,

//               status:
//                 ORDER_STATUS.PLACED,
//             },
//           ],
//           { session }
//         );

//       // ================= UPDATE PAYMENT =================

//       await Payment.updateOne(
//         {
//           _id:
//             payment._id,
//         },

//         {
//           order:
//             order[0]._id,
//         },

//         { session }
//       );

//       // ================= CLEAR CART =================

//       await Cart.updateOne(
//         { customerId },

//         {
//           $set: {
//             items: [],
//           },
//         },

//         { session }
//       );

//       const updatedUser =
//         await Customer.findById(
//           customerId
//         );

//       await session.commitTransaction();

//       session.endSession();

//       return res.status(200).json({

//         success: true,

//         message:
//           "Payment successful",

//         orderId:
//           order[0]._id,

//         order:
//           order[0],

//         user:
//           updatedUser,
//       });

//     } catch (error) {

//       await session.abortTransaction();

//       session.endSession();

//       return res.status(400).json({

//         success: false,

//         message:
//           error.message,
//       });
//     }
//   };