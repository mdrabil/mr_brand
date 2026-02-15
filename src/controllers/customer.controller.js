
import Joi from "joi";
import mongoose from "mongoose";
import Customer from "../models/Customer.js";
import { generateRMId } from "../utils/rmId.js";

// ✅ Validation Schemas
const addressSchema = Joi.object({
  mobile: Joi.string().required(),
  _id: Joi.string().optional(),
  addressLine: Joi.string().required(),
  fullAddress: Joi.string().optional(),
  city: Joi.string().required(),
  state: Joi.string().required(),
  pincode: Joi.string().required(),
  latitude: Joi.number().optional(),
  longitude: Joi.number().optional(),
  isDefault: Joi.boolean().optional(),
});

const customerSchema = Joi.object({
  fullName: Joi.string().required(),
  mobile: Joi.string().required(),
  email: Joi.string().email().optional(),
  isBlocked: Joi.boolean().optional(),
  addresses: Joi.array().items(addressSchema).optional(),
});

// ==================== CONTROLLER FUNCTIONS ====================

// Create Customer
export const createCustomer = async (req, res) => {
  try {
    const { error, value } = customerSchema.validate(req.body);
    if (error) return res.status(400).json({ success: false, message: error.message });

    value.rmCustomerId = await generateRMId("RMCU"); // generate here

    const customer = new Customer(value);
    await customer.save();

    res.json({ success: true, customer });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};


// Get All Customers with pagination & filters
export const getAllCustomers = async (req, res) => {
  try {
    let { page = 1, limit = 10, search, isBlocked } = req.query;
    page = parseInt(page);
    limit = parseInt(limit);

    const query = {};

    if (search) {
      query.$or = [
        { fullName: { $regex: search, $options: "i" } },
        { mobile: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    if (isBlocked === "true") query.isBlocked = true;
    if (isBlocked === "false") query.isBlocked = false;

    const total = await Customer.countDocuments(query);
    const customers = await Customer.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    res.json({ success: true, total, customers });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Update Customer
export const updateCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ success: false, message: "Invalid customer ID" });

    const { error, value } = customerSchema.validate(req.body);
    if (error) return res.status(400).json({ success: false, message: error.message });

    const updatedCustomer = await Customer.findByIdAndUpdate(id, value, { new: true });
    if (!updatedCustomer) return res.status(404).json({ success: false, message: "Customer not found" });

    res.json({ success: true, customer: updatedCustomer });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Delete Customer
export const deleteCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ success: false, message: "Invalid customer ID" });

    const deletedCustomer = await Customer.findByIdAndDelete(id);
    if (!deletedCustomer) return res.status(404).json({ success: false, message: "Customer not found" });

    res.json({ success: true, message: "Customer deleted successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
