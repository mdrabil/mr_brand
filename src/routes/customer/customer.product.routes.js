import express from "express";

import {

  getProductById,
  getAllProducts,
  getAllCategorys,
  applyCoupon,

} from "../../controllers/customer/customer.product.controller.js";

const router = express.Router();





// ✅ FIRST static routes
router.get("/category-all", getAllCategorys);
router.get("/", getAllProducts);
router.get("/coupon/apply", applyCoupon);

// ✅ LAST dynamic route
router.get("/:productId", getProductById);



export default router;
