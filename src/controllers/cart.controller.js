import Cart from "../models/Cart.model.js";
import Product from "../models/Product.model.js";
import Counter from "../models/Counter.model.js";
import Order from "../models/Order.model.js";
import Store from "../models/Store.model.js";
import Joi from "joi";
import { USER_ROLE, ORDER_STATUS } from "../constants/enums.js";

// ------------------- Validation Schemas -------------------
const addItemSchema = Joi.object({
  product: Joi.string().required(),
  variantLabel: Joi.string().allow(""),
  sellingPrice: Joi.number().positive().required(),
  qty: Joi.number().integer().min(1).required()
});

const updateItemSchema = Joi.object({
  qty: Joi.number().integer().min(0).required()
});

// ------------------- Add Item to Cart -------------------
export const addToCart = async (req, res) => {
  try {
    if (!req.user.roles.includes(USER_ROLE.CUSTOMER))
      return res.status(403).json({ message: "Only customers can access cart" });

    const { error, value } = addItemSchema.validate(req.body);
    if (error) return res.status(400).json({ message: error.details[0].message });

    const product = await Product.findById(value.product);
    if (!product) return res.status(404).json({ message: "Product not found" });

    let cart = await Cart.findOne({ customer: req.user._id });

    if (!cart) {
      cart = new Cart({ customer: req.user._id, items: [value] });
    } else {
      const itemIndex = cart.items.findIndex(
        i => i.product.toString() === value.product
      );

      if (itemIndex > -1) {
        cart.items[itemIndex].qty += value.qty; // increment quantity
      } else {
        cart.items.push(value);
      }
    }

    await cart.save();
    res.json({ success: true, cart });
  } catch (err) {
    console.error("addToCart:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ------------------- Update Cart Item -------------------
export const updateCartItem = async (req, res) => {
  try {
    if (!req.user.roles.includes(USER_ROLE.CUSTOMER))
      return res.status(403).json({ message: "Only customers can access cart" });

    const { productId } = req.params;
    const { error, value } = updateItemSchema.validate(req.body);
    if (error) return res.status(400).json({ message: error.details[0].message });

    const cart = await Cart.findOne({ customer: req.user._id });
    if (!cart) return res.status(404).json({ message: "Cart not found" });

    const itemIndex = cart.items.findIndex(i => i.product.toString() === productId);
    if (itemIndex === -1) return res.status(404).json({ message: "Item not in cart" });

    if (value.qty === 0) {
      cart.items.splice(itemIndex, 1); // remove item
    } else {
      cart.items[itemIndex].qty = value.qty;
    }

    await cart.save();
    res.json({ success: true, cart });
  } catch (err) {
    console.error("updateCartItem:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ------------------- Get Customer Cart -------------------
export const getCart = async (req, res) => {
  try {
    if (!req.user.roles.includes(USER_ROLE.CUSTOMER))
      return res.status(403).json({ message: "Only customers can access cart" });

    const cart = await Cart.findOne({ customer: req.user._id }).populate({
      path: "items.product",
      select: "name sellingPrice images"
    });

    res.json({ success: true, cart });
  } catch (err) {
    console.error("getCart:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ------------------- Clear Cart -------------------
export const clearCart = async (req, res) => {
  try {
    if (!req.user.roles.includes(USER_ROLE.CUSTOMER))
      return res.status(403).json({ message: "Only customers can access cart" });

    await Cart.findOneAndUpdate({ customer: req.user._id }, { items: [] });
    res.json({ success: true, message: "Cart cleared" });
  } catch (err) {
    console.error("clearCart:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ------------------- Checkout / Create Order -------------------
export const checkoutCart = async (req, res) => {
  try {
    if (!req.user.roles.includes(USER_ROLE.CUSTOMER))
      return res.status(403).json({ message: "Only customers can place orders" });

    const cart = await Cart.findOne({ customer: req.user._id });
    if (!cart || cart.items.length === 0)
      return res.status(400).json({ message: "Cart is empty" });

    const storeIdSet = [...new Set(cart.items.map(i => i.product.store.toString()))];
    if (storeIdSet.length > 1)
      return res.status(400).json({ message: "All items must be from same store" });

    const store = await Store.findById(storeIdSet[0]);
    if (!store) return res.status(404).json({ message: "Store not found" });

    // Generate order counter
    const counter = await Counter.findByIdAndUpdate(
      { _id: "ORDER" },
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );

    const totalAmount = cart.items.reduce((sum, i) => sum + i.sellingPrice * i.qty, 0);
    const gstAmount = cart.items.reduce((sum, i) => sum + (i.sellingPrice * i.qty * (i.gstPercent || 0)) / 100, 0);
    const payableAmount = totalAmount + gstAmount;

    const order = await Order.create({
      rmOrderId: `ORD${counter.seq.toString().padStart(5, "0")}`,
      customer: req.user._id,
      store: store._id,
      items: cart.items.map(i => ({
        productName: i.product.name,
        variantLabel: i.variantLabel,
        sellingPrice: i.sellingPrice,
        qty: i.qty,
        gstPercent: i.product.gstPercent || 0
      })),
      totalAmount,
      gstAmount,
      payableAmount,
      status: ORDER_STATUS.PLACED,
      deliveryAddress: req.body.deliveryAddress
    });

    // Clear cart after checkout
    cart.items = [];
    await cart.save();

    res.status(201).json({ success: true, order });
  } catch (err) {
    console.error("checkoutCart:", err);
    res.status(500).json({ message: "Server error" });
  }
};
