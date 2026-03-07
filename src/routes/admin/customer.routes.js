import express from "express";
import {
  createCustomer,
  getAllCustomers,
  updateCustomer,
  deleteCustomer,
  getAllCarts,
  getCartById,
} from "../../controllers/customer.controller.js";
import { adminOnly } from "../../middlewares/adminOnly.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/", createCustomer);
router.get("/", getAllCustomers);
router.put("/:id", updateCustomer);
router.delete("/:id", deleteCustomer);
// router.get("/cart", deleteCustomer);

// Admin routes
router.get("/carts", authMiddleware, adminOnly, getAllCarts);
router.get("/carts/:cartId", authMiddleware, adminOnly, getCartById);

export default router;
