import express from "express";
import {
  addToCart,
  // updateCartItem,
  removeFromCart,
  getCart,
  clearCart,
  updateCart,
  // checkoutCart,
  // mergeCart
} from "../../controllers/cart.controller.js";

import { customerAuth } from "../../middlewares/customerAuth.middleware.js";

const router = express.Router();

router.use(customerAuth);

router.get("/", getCart);
router.post("/add", addToCart);
router.put("/update", updateCart);
router.delete("/remove", removeFromCart);
router.delete("/clear", clearCart);
// router.post("/checkout", checkoutCart);
// router.post("/merge", mergeCart);

export default router;