// controllers/storeStaff.controller.js
import mongoose from "mongoose";
import StoreStaff from "../models/StoreStaff.model.js";

import Store from "../models/Store.model.js";
import bcrypt from "bcryptjs";
import { createStaffSchema } from "../validations/storeStaff.validation.js";
import UserModel from "../models/User.model.js";

/* ================= CREATE STAFF ================= */
export const createStoreStaff = async (req, res) => {
  const session = await mongoose.startSession();
  try {
    const { error } = createStaffSchema.validate(req.body);
    if (error)
      return res.status(400).json({ success: false, message: error.message });

    const { store, role, userOption, userId, newUser } = req.body;

    session.startTransaction();

    // Check store
    const storeExists = await Store.findById(store).session(session);
    if (!storeExists)
      return res.status(404).json({ success: false, message: "Store not found" });

    let user;

    // Create new user
    if (userOption === "new") {
      const existing = await UserModel.findOne({ mobile: newUser.mobile }).session(session);
      if (existing)
        return res.status(400).json({ success: false, message: "Mobile already registered" });

      const hash = await bcrypt.hash(newUser.password, 10);

      user = await UserModel.create(
        [
          {
            fullName: newUser.fullName,
            mobile: newUser.mobile,
            email: newUser.email,
            passwordHash: hash
          }
        ],
        { session }
      );
      user = user[0];
    } else {
      user = await UserModel.findById(userId).session(session);
      if (!user)
        return res.status(404).json({ success: false, message: "User not found" });
    }

    // Unique store+user
    const already = await StoreStaff.findOne({ store, user: user._id }).session(session);
    if (already)
      return res.status(400).json({ success: false, message: "Staff already exists" });

    // Create staff
    const staff = await StoreStaff.create(
      [
        {
          store,
          user: user._id,
          role
        }
      ],
      { session }
    );

    await session.commitTransaction();
    session.endSession();

    return res.status(201).json({ success: true, message: "Staff created", staff: staff[0] });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();

    if (err.code === 11000) {
      return res.status(400).json({ success: false, message: "Duplicate entry" });
    }

    console.error("CREATE STAFF ERROR:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

/* ================= GET ALL STAFF ================= */
export const getAllStoreStaff = async (req, res) => {
  try {
    let { page = 1, limit = 10, search = "", store } = req.query;
    page = Number(page);
    limit = Number(limit);

    const filter = {};
    if (store) filter.store = store;

    // Search users
    if (search) {
      const users = await UserModel.find(
        { $text: { $search: search } },
        { _id: 1 }
      ).lean();

      filter.user = { $in: users.map(u => u._id) };
    }

    const [staff, total] = await Promise.all([
      StoreStaff.find(filter)
        .populate("user", "fullName mobile")
        .populate("store", "storeName")
        .skip((page - 1) * limit)
        .limit(limit)
        .sort({ createdAt: -1 })
        .lean(),

      StoreStaff.countDocuments(filter)
    ]);

    return res.json({
      success: true,
      page,
      limit,
      total,
      staff
    });
  } catch (err) {
    console.error("GET STAFF ERROR:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

/* ================= UPDATE STAFF ================= */
export const updateStoreStaff = async (req, res) => {
  try {
    const { id } = req.params;
    const { role, isActive } = req.body;
console.log("get the id ",id)
    const staff = await StoreStaff.findById(id);
    if (!staff)
      return res.status(404).json({ success: false, message: "Staff not found" });

    if (role) staff.role = role;
    if (isActive !== undefined) staff.isActive = isActive;

    await staff.save();

    return res.json({ success: true, message: "Updated", staff });
  } catch (err) {
    console.error("UPDATE STAFF ERROR:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

/* ================= DELETE STAFF (SOFT DELETE) ================= */
export const deleteStoreStaff = async (req, res) => {
  try {
    const { id } = req.params;

    const staff = await StoreStaff.findById(id);
    if (!staff)
      return res.status(404).json({ success: false, message: "Staff not found" });

    staff.isActive = false;
    await staff.save();

    return res.json({ success: true, message: "Staff deactivated" });
  } catch (err) {
    console.error("DELETE STAFF ERROR:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};
