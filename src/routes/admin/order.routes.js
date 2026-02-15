import express from "express";

import { storeAccessMiddleware } from "../../middlewares/storeAccess.middleware.js";

import {
  createOrder,
  updateOrder,
  getOrderById,
  getAllOrders,
  deleteOrder
} from "../../controllers/order.controller.js";

const router = express.Router();


// Customer → place order
router.get("/", getAllOrders);
router.post("/",  createOrder);

// Get all orders → role-wise

// Get order by ID → role-wise
router.get("/:orderId", getOrderById);

router.patch("/:orderId/status", updateOrder);

// Delete order → SUPER_ADMIN / Store Roles
router.delete("/:orderId", storeAccessMiddleware(), deleteOrder);

export default router;
