import express from "express";



import { MODULE_KEY, } from "../../constants/enums.js";
import { checkPermission } from "../../middlewares/checkPermission.middleware.js";
import { createStoreStaff, deleteStoreStaff, getAllStoreStaff, updateStoreStaff } from "../../controllers/storeStaff.controller.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";

const router = express.Router();
router.use(authMiddleware);

// Only SUPER_ADMIN and store owner can manage staff
router.post("/", checkPermission(MODULE_KEY.STORE_STAFF, "create"), createStoreStaff);
router.put("/:id", checkPermission(MODULE_KEY.STORE_STAFF, "update"), updateStoreStaff);
router.get("/", checkPermission(MODULE_KEY.STORE_STAFF, "read"), getAllStoreStaff);
router.delete("/:staffId",checkPermission(MODULE_KEY.STORE_STAFF, "delete"), deleteStoreStaff);

export default router;
