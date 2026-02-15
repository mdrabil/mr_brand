import Store from "../models/Store.model.js";
import StoreStaff from "../models/StoreStaff.model.js";
import { superAdminBypass } from "./superAdmin.middleware.js";

export const storeAccessMiddleware = () => {
  return async (req, res, next) => {
    try {
      if (superAdminBypass(req)) return next();

      const storeId = req.params.storeId || req.body.store;
      if (!storeId) throw new Error("Store ID missing");

      // Vendor / Owner
      const store = await Store.findOne({
        _id: storeId,
        owner: req.user._id
      });

      if (store) return next();

      // Staff access
      const staff = await StoreStaff.findOne({
        store: storeId,
        user: req.user._id,
        isActive: true
      });

      if (!staff) {
        return res.status(403).json({ message: "Store access denied" });
      }

      req.staffRole = staff.role; // 🔥 useful later
      next();
    } catch (err) {
      res.status(403).json({ message: "Store access error" });
    }
  };
};
