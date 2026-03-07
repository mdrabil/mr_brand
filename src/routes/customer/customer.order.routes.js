import express from "express";
import { customerAuth } from "../../middlewares/customerAuth.middleware.js";
import { getMyOrdersController, placeOrderController, updateMyOrderStatusController } from "../../controllers/customer/customer.order.controller.js";


const router = express.Router();

// Customer places an order
router.post("/place", customerAuth, placeOrderController);
router.get("/get-all", customerAuth, getMyOrdersController);
router.patch("/update/:orderId", customerAuth, updateMyOrderStatusController);

// // Customer gets all orders
// router.get("/", authMiddleware, getOrders);

// // Customer gets single order details
// router.get("/:orderId", authMiddleware, getOrderDetails);

export default router;
