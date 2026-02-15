import express from "express";
import { customerLogin, customerLogout, customerRefreshToken, customerRegister } from "../../controllers/customer/auth.controller.js";

const router = express.Router();

// Register customer
router.post("/register", customerRegister);

// Login customer
router.post("/login", customerLogin);

// Refresh JWT
router.post("/refresh-token", customerRefreshToken);

// Logout
router.post("/logout", customerLogout);

export default router;
