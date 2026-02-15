import Coupon from "../models/Coupon.model.js";
import Joi from "joi";

// Validation
const createCouponSchema = Joi.object({
  code: Joi.string().required(),
  title: Joi.string().required(),
  type: Joi.string().valid("FLAT", "PERCENT").required(),
  value: Joi.number().positive().required(),
  minOrderAmount: Joi.number().min(0).default(0),
  maxDiscountAmount: Joi.number().min(0),
  startDate: Joi.date().required(),
  endDate: Joi.date().required(),
  usageLimit: Joi.number().min(0),
  status: Joi.string().valid("ACTIVE", "INACTIVE").default("ACTIVE"),
});

// Create coupon
export const createCoupon = async (req, res) => {
  try {
    const { error, value } = createCouponSchema.validate(req.body);
    if (error) return res.status(400).json({ message: error.details[0].message });

    const exists = await Coupon.findOne({ code: value.code.toUpperCase() });
    if (exists) return res.status(400).json({ message: "Coupon code already exists" });

    const coupon = await Coupon.create({ ...value, code: value.code.toUpperCase(), createdBy: req.user._id });
    res.status(201).json({ success: true, coupon });
  } catch (err) {
    console.error("createCoupon:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// Get all coupons
export const getAllCoupons = async (req, res) => {
  try {
    const page = parseInt(req.query.page || 1);
    const limit = parseInt(req.query.limit || 10);
    const status = req.query.status;

    const filter = {};
    if (status) filter.status = status;

    const total = await Coupon.countDocuments(filter);
    const coupons = await Coupon.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    res.json({ success: true, total, page, limit, coupons });
  } catch (err) {
    console.error("getAllCoupons:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// Update coupon
export const updateCoupon = async (req, res) => {
  try {
    const coupon = await Coupon.findById(req.params.couponId);
    if (!coupon) return res.status(404).json({ message: "Coupon not found" });

    Object.assign(coupon, req.body);
    await coupon.save();

    res.json({ success: true, coupon });
  } catch (err) {
    console.error("updateCoupon:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// Delete coupon
export const deleteCoupon = async (req, res) => {
  try {
    const coupon = await Coupon.findById(req.params.couponId);
    if (!coupon) return res.status(404).json({ message: "Coupon not found" });

    await coupon.deleteOne();
    res.json({ success: true, message: "Coupon deleted" });
  } catch (err) {
    console.error("deleteCoupon:", err);
    res.status(500).json({ message: "Server error" });
  }
};
