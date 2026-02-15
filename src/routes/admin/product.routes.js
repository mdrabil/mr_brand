import express from "express";
import { authMiddleware } from "../../middlewares/auth.middleware.js";

import { storeAccessMiddleware } from "../../middlewares/storeAccess.middleware.js";

import {
  createProduct,
  updateProduct,
  getProductById,
  getAllProducts,
  deleteProduct
} from "../../controllers/product.controller.js";
import { uploadProductImages } from "../../middlewares/upload.middleware.js";
import { checkPermission } from "../../middlewares/checkPermission.middleware.js";
import { MODULE_KEY } from "../../constants/enums.js";

const router = express.Router();

// 🔹 Create product with images
router.post(
  "/create",
  authMiddleware,
 checkPermission(MODULE_KEY.PRODUCT,'create'),
  storeAccessMiddleware(),
  uploadProductImages.array("images", 5), // max 5 images
  createProduct
);

// 🔹 Update product + images
router.put(
  "/:productId",
  authMiddleware,
 checkPermission(MODULE_KEY.PRODUCT,'update'),
  storeAccessMiddleware(),
  uploadProductImages.array("images", 5),
  updateProduct
);

// 🔹 Get product by ID
router.get(
  "/:productId",
  authMiddleware,
  // checkPermission(MODULE_KEY.PRODUCT,'read'),
  storeAccessMiddleware(),
  getProductById
);

// 🔹 Get all products
router.get(
  "/",
  authMiddleware,
  // checkPermission(MODULE_KEY.PRODUCT,'read'),
  getAllProducts
);

// 🔹 Delete product
router.delete(
  "/:productId",
  authMiddleware,
 checkPermission(MODULE_KEY.PRODUCT,'delete'),
  storeAccessMiddleware(),
  deleteProduct
);

export default router;
