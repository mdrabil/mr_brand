import User from "../models/User.model.js";
import Joi from "joi";
import bcrypt from "bcryptjs";
import { USER_ROLE } from "../constants/enums.js";
import RoleModel from "../models/Role.model.js";
import cloudinary from "../config/cloudinaryConfig.js";

// 🔹 Joi validation schemas
const createUserSchema = Joi.object({
  fullName: Joi.string().required(),
  mobile: Joi.string().pattern(/^[0-9]{10}$/).required(),
  email: Joi.string().email(),
  password: Joi.string().min(6).required(),
  roles: Joi.array().items(Joi.string().valid(...Object.values(USER_ROLE))).required()
});

const updateUserSchema = Joi.object({
  fullName: Joi.string(),
  mobile: Joi.string().pattern(/^[0-9]{10}$/),
  email: Joi.string().email(),
  password: Joi.string().min(6),
  roles: Joi.array().items(Joi.string().valid(...Object.values(USER_ROLE))),
  isBlocked: Joi.boolean()
}).min(1);

// 🔹 Create User
export const createUser = async (req, res) => {
  try {
    const { error, value } = createUserSchema.validate(req.body);
    if (error) return res.status(400).json({ message: error.details[0].message });

    // Duplicate mobile/email check
    const duplicate = await User.findOne({
      $or: [{ mobile: value.mobile }, { email: value.email }]
    });
    if (duplicate) return res.status(400).json({ message: "Mobile or Email already exists" });

    // Hash password
    const passwordHash = await bcrypt.hash(value.password, 10);

    const user = await User.create({ ...value, passwordHash });
    res.status(201).json({ success: true, user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// 🔹 Update User
export const updateUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { error, value } = updateUserSchema.validate(req.body);
    if (error) return res.status(400).json({ message: error.details[0].message });

    // Password hashing if updating
    if (value.password) {
      value.passwordHash = await bcrypt.hash(value.password, 10);
      delete value.password;
    }

    // Duplicate mobile/email check
    if (value.mobile || value.email) {
      const duplicate = await User.findOne({
        _id: { $ne: userId },
        $or: [
          value.mobile ? { mobile: value.mobile } : null,
          value.email ? { email: value.email } : null
        ].filter(Boolean)
      });
      if (duplicate) return res.status(400).json({ message: "Mobile or Email already exists" });
    }

    const user = await User.findByIdAndUpdate(userId, value, { new: true });
    if (!user) return res.status(404).json({ message: "User not found" });

    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// 🔹 Get User by ID
export const getUserById = async (req, res) => {
  try {
    const { userId } = req.params;

    // SUPER_ADMIN can access all, others can only access self
    if (!req.user.roles.includes(USER_ROLE.SUPER_ADMIN) && req.user._id.toString() !== userId) {
      return res.status(403).json({ message: "Access denied" });
    }

    const user = await User.findById(userId).select("-passwordHash -refreshToken");
    if (!user) return res.status(404).json({ message: "User not found" });

    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


export const getAllUsers = async (req, res) => {
  try {
    // Only SUPER_ADMIN can list users
    const roleNames = req.user.roles;
    // if (!roleNames.includes(USER_ROLE.SUPER_ADMIN)) {
    //   return res.status(403).json({ success: false, message: "Access denied" });
    // }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || "";

    // 🔥 Get ADMIN & SUPER_ADMIN role IDs
    const adminRoles = await RoleModel.find({
      name: { $in: [USER_ROLE.SUPER_ADMIN, USER_ROLE.ADMIN] }
    }).select("_id");

    const adminRoleIds = adminRoles.map(r => r._id);

    // 🔍 Search filter
    const filter = {
      roles: { $nin: adminRoleIds }, // 🚫 Exclude admin users
    };

    if (search) {
      filter.$or = [
        { fullName: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { mobile: { $regex: search, $options: "i" } },
      ];
    }

    const total = await User.countDocuments(filter);

    const users = await User.find(filter)
      .select("-passwordHash -refreshToken")
      .skip((page - 1) * limit)
      .limit(limit)
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      total,
      page,
      limit,
      users,
    });
  } catch (err) {
    console.error("GET ALL USERS ERROR:", err);
    res.status(500).json({ success: false, message: "Server error. Try again later." });
  }
};




export const updateUserProfile = async (req, res) => {
  try {
    const userId = req.user._id; // authMiddleware should set req.user

    console.log("get the userid",userId)
    console.log("get the user",req.body)
    const user = await User.findById(userId).select("+passwordHash +image");

    if (!user) return res.status(404).json({ message: "User not found" });

    const { fullName, mobile, email, oldPassword, password } = req.body;

    // ---------------- Update Basic Info ----------------
    if (fullName) user.fullName = fullName;
    if (mobile) user.mobile = mobile;
    if (email) user.email = email;

    // ---------------- Update Password ----------------
    if (oldPassword && password) {
      const isMatch = await bcrypt.compare(oldPassword, user.passwordHash);
      if (!isMatch) return res.status(400).json({ message: "Old password is incorrect" });

      const hashedPassword = await bcrypt.hash(password, 10);
      user.passwordHash = hashedPassword;
    }

    // ---------------- Update Profile Image ----------------
    if (req.file) {
      // delete old image from cloudinary if exists
      if (user.dp && user.dp.public_id) {
        await cloudinary.uploader.destroy(user.dp.public_id);
      }

      // upload new image
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: "user_dp",
        width: 300,
        height: 300,
        crop: "fill",
      });

      user.dp = {
        url: result.secure_url,
        public_id: result.public_id,
      };
    }

    await user.save();

    // return updated user (exclude passwordHash)
    const { passwordHash, ...userData } = user.toObject();

    res.json({ success: true, user: userData });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message || "Update failed" });
  }
};

// 🔹 Get All Users (SUPER_ADMIN only) with pagination + search
// export const getAllUsers = async (req, res) => {
//   try {
//     // Only SUPER_ADMIN can list users
//     const roleNames = req.user.roles.map(r => r.name);
//     if (!roleNames.includes(USER_ROLE.SUPER_ADMIN)) {
//       return res.status(403).json({ success: false, message: "Access denied" });
//     }

//     // Pagination + search params
//     const page = parseInt(req.query.page) || 1;
//     const limit = parseInt(req.query.limit) || 10;
//     const search = req.query.search || "";

//     // Build filter
//     const filter = {};
//     if (search) {
//       // Search by name, email, or mobile
//       filter.$or = [
//         { fullName: { $regex: search, $options: "i" } },
//         { email: { $regex: search, $options: "i" } },
//         { mobile: { $regex: search, $options: "i" } },
//       ];
//     }

//     const total = await User.countDocuments(filter);

//     const users = await User.find(filter)
//       .select("-passwordHash -refreshToken")
//       .skip((page - 1) * limit)
//       .limit(limit)
//       .sort({ createdAt: -1 });

//     res.status(200).json({
//       success: true,
//       total,
//       page,
//       limit,
//       users,
//     });
//   } catch (err) {
//     console.error("GET ALL USERS ERROR:", err);
//     res.status(500).json({ success: false, message: "Server error. Try again later." });
//   }
// };


// 🔹 Delete User (SUPER_ADMIN only)
export const deleteUser = async (req, res) => {
  try {
    if (!req.user.roles.includes(USER_ROLE.SUPER_ADMIN)) {
      return res.status(403).json({ message: "Access denied" });
    }

    const { userId } = req.params;
    await User.findByIdAndDelete(userId);
    res.json({ success: true, message: "User deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
