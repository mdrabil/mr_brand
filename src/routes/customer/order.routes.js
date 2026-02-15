import express from "express";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import {
  placeOrder,
  getOrders,
  getOrderDetails
} from "../../controllers/customer/order.controller.js";

const router = express.Router();

// Customer places an order
router.post("/", authMiddleware, placeOrder);

// Customer gets all orders
router.get("/", authMiddleware, getOrders);

// Customer gets single order details
router.get("/:orderId", authMiddleware, getOrderDetails);

export default router;
