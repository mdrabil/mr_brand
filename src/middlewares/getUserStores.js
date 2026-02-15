import StoreStaff from "../models/StoreStaff.model.js";

export const getUserStores = async (req, res, next) => {
  try {
    const user = req.user;

    // ✅ Validate user existence
    if (!user) {
      return res.status(401).json({ success: false, message: "Unauthorized: User not found" });
    }

    // ✅ Check if user is blocked
    if (user.isBlocked) {
      return res.status(403).json({ success: false, message: "Access denied: User is blocked" });
    }

    // ✅ Ensure user has at least one role
    if (!user.roles || user.roles.length === 0) {
      return res.status(403).json({ success: false, message: "Access denied: No roles assigned" });
    }

    // ✅ Super admin bypass
    if (user.roles.includes("SUPER_ADMIN")) {
      req.allowedStores = null; // null = all stores
      return next();
    }

    // ✅ Normal user: get all active stores they belong to
    const storeStaffs = await StoreStaff.find({ user: user._id, isActive: true });

    if (!storeStaffs || storeStaffs.length === 0) {
      return res.status(403).json({ success: false, message: "Access denied: No assigned stores" });
    }

    req.allowedStores = storeStaffs.map(s => s.store);

    next();
  } catch (err) {
    console.error("getUserStores ERROR:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
