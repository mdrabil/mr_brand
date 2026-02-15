import express from "express";
import {
  createOrUpdatePermission,
  getPermissions,
  deletePermission,
  getMe
} from "../../controllers/permission.controller.js";

import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { allowRoles } from "../../middlewares/role.middleware.js";
import { USER_ROLE } from "../../constants/enums.js";

const router = express.Router();
router.use(authMiddleware);

// Only SUPER_ADMIN can manage permissions
router.post("/", allowRoles([USER_ROLE.SUPER_ADMIN]), createOrUpdatePermission);
router.get("/", allowRoles([USER_ROLE.SUPER_ADMIN]), getPermissions);
router.get("/me", getMe);
router.delete("/:permissionId", allowRoles([USER_ROLE.SUPER_ADMIN]), deletePermission);

export default router;
