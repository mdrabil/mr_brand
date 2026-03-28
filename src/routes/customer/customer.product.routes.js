import express from "express";

import {

  getProductById,
  getAllProducts,
  getAllCategorys,
  applyCoupon,
  checkCouponActiveOrNot

} from "../../controllers/customer/customer.product.controller.js";
import { customerauthMiddlewareOptional } from "../../middlewares/customerAuth.middleware.js";

const router = express.Router();





// ✅ FIRST static routes
router.get("/category-all", getAllCategorys);
router.get("/", getAllProducts);
router.get("/coupon/apply", applyCoupon);
router.get("/coupon/check-coupon", customerauthMiddlewareOptional, checkCouponActiveOrNot);



// ✅ LAST dynamic route
router.get("/:productId", getProductById);



export default router;
