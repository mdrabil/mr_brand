import express from "express";
import { assignModulePermission } from "../controllers/modulePermission.controller.js";
import { onlySuperAdmin } from "../middlewares/onlySuperAdmin.js";
import { authenticate } from "../middlewares/authenticate.js";

const router = express.Router();

/**
 * SUPER_ADMIN → assign module permissions to roles
 */
router.post(
  "/assign",
  authenticate,
  onlySuperAdmin,
  assignModulePermission
);

export default router;
