import express from "express";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { allowRoles } from "../middlewares/role.middleware.js";
import { createCommissionPlan, getCommissionPlans } from "../controllers/commission.controller.js";
import { USER_ROLE } from "../constants/enums.js";

const router = express.Router();

router.use(authMiddleware);
router.use(allowRoles([USER_ROLE.SUPER_ADMIN]));

router.get("/", getCommissionPlans);
router.post("/", createCommissionPlan);

export default router;
