// middleware/customerAuth.middleware.js
import jwt from "jsonwebtoken";

import Customer from "../models/Customer.js";
import { config } from "../config/config.js";


export const customerAuth = async (req, res, next) => {
  try {
    // 1️⃣ Get Token
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "No token provided",
      });
    }

    const token = authHeader.split(" ")[1];

    // 2️⃣ Verify Token
    const decoded = jwt.verify(token, config.jwtSecret);

    // 3️⃣ Get Customer from DB
    const customer = await Customer.findById(decoded.id).select("-password");
    if (!customer) {
      return res.status(401).json({
        success: false,
        message: "Customer not found",
      });
    }

    // 4️⃣ Block Check
    if (customer.isBlocked) {
      return res.status(403).json({
        success: false,
        message: "Account is blocked",
      });
    }


    // console.log("get the data",customer)

    // 5️⃣ Attach Customer to Request
    req.user = customer;
    next();
  } catch (err) {
    console.error("Auth Middleware Error:", err);
    return res.status(401).json({
      success: false,
      message: "Token expired or invalid",
    });
  }
};