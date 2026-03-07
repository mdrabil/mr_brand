import express from "express";

import { addAddress, changeCustomerPassword, createCustomer, customerLogin, customerLogout, deleteAddress, setDefaultAddress, updateAddress, updateCustomerProfile } from "../../controllers/customer.controller.js";
import { customerAuth } from "../../middlewares/customerAuth.middleware.js";

const router = express.Router();

// Register customer
router.post("/signup", createCustomer);
router.post("/login", customerLogin);
router.post("/logout", customerLogout);
router.put("/update-profile", customerAuth, updateCustomerProfile);
router.put("/change-password", customerAuth, changeCustomerPassword);
router.post("/add/address", customerAuth, addAddress);
router.put("/update/address/:addressId", customerAuth, updateAddress);
router.delete("/delete/address/:addressId", customerAuth, deleteAddress);
router.put("/set-default/address/:addressId", customerAuth, setDefaultAddress);

// router.post("/register", customerRegister);




export default router;
