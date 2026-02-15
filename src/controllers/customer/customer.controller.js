import Customer from "../models/User.model.js"; // assuming 'Customer' stored in User model
import Cart from "../models/Cart.model.js";
import Order from "../models/Order.model.js";
import Joi from "joi";
import { USER_ROLE, ORDER_STATUS } from "../constants/enums.js";

// ------------------- Validation Schemas -------------------

// Update profile
const updateProfileSchema = Joi.object({
  fullName: Joi.string(),
  email: Joi.string().email(),
  mobile: Joi.string().pattern(/^[0-9]{10}$/),
}).min(1);

// Pagination & filter for orders
const orderListSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  status: Joi.string().valid(...Object.values(ORDER_STATUS)).optional(),
});

// ------------------- Profile -------------------

// Get own profile
export const getProfile = async (req, res) => {
  try {
    const user = await Customer.findById(req.user._id).select("-passwordHash -refreshToken");
    res.json({ success: true, customer: user });
  } catch (err) {
    console.error("getProfile:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// Update profile
export const updateProfile = async (req, res) => {
  try {
    const { error, value } = updateProfileSchema.validate(req.body);
    if (error) return res.status(400).json({ message: error.details[0].message });

    const user = await Customer.findByIdAndUpdate(req.user._id, value, { new: true }).select("-passwordHash -refreshToken");
    res.json({ success: true, customer: user });
  } catch (err) {
    console.error("updateProfile:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ------------------- Cart -------------------

// Get cart
export const getCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ customer: req.user._id }).populate("items.product", "name images variants");
    res.json({ success: true, cart });
  } catch (err) {
    console.error("getCart:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// Add / Update item in cart
export const addToCart = async (req, res) => {
  try {
    const schema = Joi.object({
      product: Joi.string().required(),
      variantLabel: Joi.string().required(),
      qty: Joi.number().integer().min(1).required(),
      sellingPrice: Joi.number().positive().required()
    });

    const { error, value } = schema.validate(req.body);
    if (error) return res.status(400).json({ message: error.details[0].message });

    let cart = await Cart.findOne({ customer: req.user._id });
    if (!cart) {
      cart = await Cart.create({ customer: req.user._id, items: [value] });
    } else {
      // check if variant already exists
      const idx = cart.items.findIndex(
        i => i.product.toString() === value.product && i.variantLabel === value.variantLabel
      );

      if (idx >= 0) {
        cart.items[idx].qty += value.qty; // increment qty
        cart.items[idx].sellingPrice = value.sellingPrice; // update price
      } else {
        cart.items.push(value);
      }

      await cart.save();
    }

    res.json({ success: true, cart });
  } catch (err) {
    console.error("addToCart:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// Remove item from cart
export const removeFromCart = async (req, res) => {
  try {
    const schema = Joi.object({
      product: Joi.string().required(),
      variantLabel: Joi.string().required()
    });

    const { error, value } = schema.validate(req.body);
    if (error) return res.status(400).json({ message: error.details[0].message });

    const cart = await Cart.findOne({ customer: req.user._id });
    if (!cart) return res.status(404).json({ message: "Cart not found" });

    cart.items = cart.items.filter(
      i => !(i.product.toString() === value.product && i.variantLabel === value.variantLabel)
    );

    await cart.save();
    res.json({ success: true, cart });
  } catch (err) {
    console.error("removeFromCart:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// Clear cart
export const clearCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ customer: req.user._id });
    if (cart) {
      cart.items = [];
      await cart.save();
    }
    res.json({ success: true, message: "Cart cleared" });
  } catch (err) {
    console.error("clearCart:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ------------------- Customer Orders -------------------
export const getCustomerOrders = async (req, res) => {
  try {
    const { error, value } = orderListSchema.validate(req.query);
    if (error) return res.status(400).json({ message: error.details[0].message });

    const { page, limit, status } = value;
    const filter = { customer: req.user._id };
    if (status) filter.status = status;

    const total = await Order.countDocuments(filter);
    const orders = await Order.find(filter)
      .populate("store", "storeName")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    res.json({ success: true, total, page, limit, orders });
  } catch (err) {
    console.error("getCustomerOrders:", err);
    res.status(500).json({ message: "Server error" });
  }
};
