import express from "express";
import { authMiddleware } from "../../middlewares/auth.middleware.js";

import { storeAccessMiddleware } from "../../middlewares/storeAccess.middleware.js";

import {
  createProduct,
  updateProduct,
  getProductById,
  getAllProducts,
  deleteProduct,
  updateProductStatus
} from "../../controllers/product.controller.js";

import { checkPermission } from "../../middlewares/checkPermission.middleware.js";
import { MODULE_KEY } from "../../constants/enums.js";
import { arrayImagesThumbnailsUpload } from "../../middlewares/upload.middleware.js";

const router = express.Router();

// 🔹 Create product with images
router.post(
  "/create",
  authMiddleware,
 checkPermission(MODULE_KEY.PRODUCT,'create'),
  storeAccessMiddleware(),
    // arrayImagesThumbnailsUpload("products", 10, 10),
    arrayImagesThumbnailsUpload(10, 10),
  createProduct
);

// 🔹 Update product + images
router.put(
  "/:productId",
  authMiddleware,
 checkPermission(MODULE_KEY.PRODUCT,'update'),
  storeAccessMiddleware(),
    arrayImagesThumbnailsUpload(10, 10),
  updateProduct
);


router.patch(
  "/:productId/status",
  authMiddleware, // attach user info
   checkPermission(MODULE_KEY.PRODUCT,'update'),
  updateProductStatus
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
