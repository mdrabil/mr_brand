import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../../models/User.model.js";

import { USER_ROLE } from "../../constants/enums.js";
import Customer from "../../models/Customer.js";

// 🔑 generate JWT
const generateToken = (user) => {
  const accessToken = jwt.sign(
    { userId: user._id, roles: user.roles },
    process.env.JWT_SECRET,
    { expiresIn: "15m" }
  );

  const refreshToken = jwt.sign(
    { userId: user._id },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: "7d" }
  );

  return { accessToken, refreshToken };
};

// Customer register
export const customerRegister = async (req, res) => {
  try {
    const { fullName, mobile, email, password } = req.body;

    // Check if user exists
    let user = await User.findOne({ mobile });
    if (user) return res.status(400).json({ message: "User already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);

    user = await User.create({
      fullName,
      mobile,
      email,
      passwordHash: hashedPassword,
      roles: [USER_ROLE.CUSTOMER]
    });

    await Customer.create({
      user: user._id,
      fullName,
      mobile,
      email
    });

    const tokens = generateToken(user);
    user.refreshToken = tokens.refreshToken;
    await user.save();

    res.status(201).json({ success: true, tokens });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Customer login
export const customerLogin = async (req, res) => {
  try {
    const { mobile, password } = req.body;
    const user = await User.findOne({ mobile }).select("+passwordHash +refreshToken");
    if (!user || !user.roles.includes(USER_ROLE.CUSTOMER)) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

    const tokens = generateToken(user);
    user.refreshToken = tokens.refreshToken;
    await user.save();

    res.json({ success: true, tokens });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Customer refresh token
export const customerRefreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(400).json({ message: "Refresh token required" });

    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const user = await User.findById(decoded.userId);
    if (!user || user.refreshToken !== refreshToken) {
      return res.status(401).json({ message: "Invalid refresh token" });
    }

    const tokens = generateToken(user);
    user.refreshToken = tokens.refreshToken;
    await user.save();

    res.json({ success: true, tokens });
  } catch (err) {
    res.status(401).json({ message: "Unauthorized" });
  }
};

// Customer logout
export const customerLogout = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    const user = await User.findOne({ refreshToken });
    if (!user) return res.status(400).json({ message: "Invalid token" });

    user.refreshToken = null;
    await user.save();
    res.json({ success: true, message: "Logged out" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
