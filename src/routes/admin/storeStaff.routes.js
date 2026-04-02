import express from "express";



import { MODULE_KEY, } from "../../constants/enums.js";
import { checkPermission } from "../../middlewares/checkPermission.middleware.js";
import { createStoreStaff, deleteStoreStaff, getAllStoreStaff, updateStoreStaff, updateStoreStaffIsAcitveInActive } from "../../controllers/storeStaff.controller.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";

const router = express.Router();
router.use(authMiddleware);

// Only SUPER_ADMIN and store owner can manage staff
router.post("/", checkPermission(MODULE_KEY.USERS_STAFF, "create"), createStoreStaff);
router.put("/:id", checkPermission(MODULE_KEY.USERS_STAFF, "update"), updateStoreStaff);
router.get("/", checkPermission(MODULE_KEY.USERS_STAFF, "read"), getAllStoreStaff);
router.delete("/:id",checkPermission(MODULE_KEY.USERS_STAFF, "delete"), deleteStoreStaff);
router.put("/:id/status-update",checkPermission(MODULE_KEY.USERS_STAFF, "delete"), updateStoreStaffIsAcitveInActive);

export default router;
