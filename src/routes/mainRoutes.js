import express from "express";
import authRoutes from "./auth.routes.js";
import adminUserRoutes from "./admin/user.routes.js";
import storeRoutes from "./admin/store.routes.js";
import staffRoutes from "./admin/storeStaff.routes.js";
import categoryRoutes from "./admin/category.routes.js";
import productRoutes from "./admin/product.routes.js";
import adminOrderRoutes from "./admin/order.routes.js";
import permissionRoutes from "./admin/permission.routes.js";
import roleRoutes from "./admin/role.routes.js";
import CouponRoutes from "./admin/coupon.routes.js";
import customerAuthRoutes from "./customer/auth.routes.js";
import customerRoutes from "./admin/customer.routes.js";


import { getUserStores } from "../middlewares/getUserStores.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";

const router = express.Router();

/* ===================== PUBLIC ROUTES ===================== */
// No auth required for login / signup
router.use("/auth", authRoutes);
router.use("/customer/auth", customerAuthRoutes);

/* ===================== PROTECTED ROUTES ===================== */
// Apply auth + store-access middleware globally for admin routes
router.use("/admin", authMiddleware, getUserStores);

// Now all /admin/... routes automatically have req.user + req.allowedStores
router.use("/admin/users", adminUserRoutes);
router.use("/admin/stores", storeRoutes);
router.use("/admin/coupons", CouponRoutes);
router.use("/admin/store-staff", staffRoutes);
router.use("/admin/categories", categoryRoutes);
router.use("/admin/products", productRoutes);
router.use("/admin/orders", adminOrderRoutes);
router.use("/admin/permissions", permissionRoutes);
router.use("/admin/roles", roleRoutes);
router.use("/admin/customers", customerRoutes);

export default router;
