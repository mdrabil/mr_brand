import express from "express";

import { createPaymentSchema, updatePaymentStatusSchema } from "../validators/payment.validator.js";
import validateRequest from "../middlewares/validateRequest.js"; // custom middleware to validate Joi schemas
import { createPayment } from "../../controllers/payment.controller.js";

const router = express.Router();

// ✅ Create Payment
router.post("/", validateRequest(createPaymentSchema), createPayment);

// ✅ Get Payments with search, filter & pagination
router.get("/", getPayments);

// ✅ Get single payment
router.get("/:id", getPaymentById);

// ✅ Update Payment status
router.patch("/:id/status", validateRequest(updatePaymentStatusSchema), updatePaymentStatus);

// ✅ Delete Payment
router.delete("/:id", deletePayment);

export default router;
