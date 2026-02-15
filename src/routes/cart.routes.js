import express from "express";
import {
  addToCart,
  updateCartItem,
  getCart,
  clearCart,
  checkoutCart
} from "../controllers/cart.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";

const router = express.Router();
router.use(authMiddleware);

router.get("/", getCart);
router.post("/add", addToCart);
router.put("/update/:productId", updateCartItem);
router.delete("/clear", clearCart);
router.post("/checkout", checkoutCart);

export default router;
