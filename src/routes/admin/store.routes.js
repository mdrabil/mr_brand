import express from "express";

import { MODULE_KEY, USER_ROLE } from "../../constants/enums.js";

import {
  createStore,
  updateStore,
  getStoreById,
  getAllStores,
  deleteStore,
  updateStoreOnly
} from "../../controllers/store.controller.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { checkPermission } from "../../middlewares/checkPermission.middleware.js";
import { storeAccessMiddleware } from "../../middlewares/storeAccess.middleware.js";

const router = express.Router();

// Create Store → SUPER_ADMIN / VENDOR
router.post(
  "/create",
  authMiddleware,
  checkPermission(MODULE_KEY.STORE,'create'),
  createStore
);

// router.post("/update", authMiddleware, checkPermission(MODULE_KEY.STORE, "update"), updateStoreOnly);
router.post("/toggle/:id", authMiddleware, checkPermission(MODULE_KEY.STORE, "update"), updateStoreOnly);


// Update Store → Owner / Manager / SUPER_ADMIN
router.patch(
  "/update/:storeId",
  authMiddleware,
   checkPermission(MODULE_KEY.STORE,'update'),
  storeAccessMiddleware(),
  updateStore
);

// Get Store → Owner / Manager / SUPER_ADMIN
router.get(
  "/:storeId",
  authMiddleware,
   checkPermission(MODULE_KEY.STORE,'read'),
  storeAccessMiddleware(),
  getStoreById
);

// Get all stores → SUPER_ADMIN sees all, VENDOR sees own stores
router.get(
  "/",
  authMiddleware,
   checkPermission(MODULE_KEY.STORE,'read'),
  getAllStores
);

// Delete Store → SUPER_ADMIN only
router.delete(
  "/:id",
  authMiddleware,
 checkPermission(MODULE_KEY.STORE,'delete'),
  deleteStore
);

export default router;
