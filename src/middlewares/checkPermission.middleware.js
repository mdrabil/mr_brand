// import ModulePermissionModel from "../models/ModulePermission.model.js";
// import { USER_ROLE } from "../constants/enums.js";

// /**
//  * SUPER ADMIN BYPASS
//  */
// const superAdminBypass = (req) => {
//   return req.user?.roles?.includes(USER_ROLE.SUPER_ADMIN);
// };

// /**
//  * Permission Middleware
//  */
// export const checkPermission = (moduleKey, action) => {
//   return async (req, res, next) => {
//     try {
//       // 🛡 SUPER ADMIN → FULL ACCESS
//       if (superAdminBypass(req)) return next();

//       const roles = req.user?.roles;

//       if (!Array.isArray(roles) || roles.length === 0) {
//         return res.status(403).json({ message: "No role assigned" });
//       }

//       const permission = await ModulePermissionModel.findOne({
//         role: { $in: roles },
//         moduleKey,
//         [`permissions.${action}`]: true
//       }).lean(); // ⚡ FAST

//       if (!permission) {
//         return res.status(403).json({
//           message: "Permission denied"
//         });
//       }

//       next();
//     } catch (error) {
//       console.error("Permission Error:", error);
//       res.status(500).json({
//         message: "Permission check failed"
//       });
//     }
//   };
// };



// import ModulePermissionModel from "../models/ModulePermission.model.js";
// import UserPermissionModel from "../models/UserPermission.model.js";
// import { USER_ROLE } from "../constants/enums.js";

// /**
//  * SUPER ADMIN BYPASS
//  */
// const superAdminBypass = (req) => {
//   return req.user?.roles?.includes(USER_ROLE.SUPER_ADMIN);
// };

// /**
//  * Permission Middleware
//  */
// export const checkPermission = (moduleKey, action) => {
//   return async (req, res, next) => {

//     console.log('get the req',req.user)

//     try {
//       // 1️⃣ SUPER ADMIN → FULL ACCESS
//       if (superAdminBypass(req)) return next();

//       const userId = req.user?._id;
//       const roles = req.user?.roles || [];

//       if (!userId) {
//         return res.status(401).json({ message: "Unauthenticated" });
//       }

//       /* --------------------------------------------------
//        2️⃣ USER-SPECIFIC PERMISSION (OVERRIDE)
//       -------------------------------------------------- */
//       const userPermission = await UserPermissionModel.findOne({
//         userId,
//         moduleKey,
//         [`permissions.${action}`]: true
//       }).lean();

//       if (userPermission) {
//         return next(); // 🎯 special access granted
//       }

//       /* --------------------------------------------------
//        3️⃣ ROLE-BASED PERMISSION
//       -------------------------------------------------- */
//       if (!Array.isArray(roles) || roles.length === 0) {
//         return res.status(403).json({ message: "No role assigned" });
//       }

//       const rolePermission = await ModulePermissionModel.findOne({
//         role: { $in: roles },
//         moduleKey,
//         [`permissions.${action}`]: true
//       }).lean();

//       if (!rolePermission) {
//         return res.status(403).json({ message: "Permission denied" });
//       }

//       next();
//     } catch (error) {
//       console.error("Permission Error:", error);
//       res.status(500).json({
//         message: "Permission check failed"
//       });
//     }
//   };
// };



// middlewares/checkPermission.js
import ModulePermission from "../models/ModulePermission.model.js";
import UserPermission from "../models/UserPermission.model.js";

export const checkPermission = (moduleKey, action) => {
  return async (req, res, next) => {
    try {
      const user = req.user;
      if (!user)
        return res.status(401).json({ success:false, message:"Unauthenticated" });

      /* 🔥 SUPER ADMIN FULL ACCESS */
      if (user.roles.includes("SUPER_ADMIN")) {
        return next();
      }

      /* 1️⃣ USER OVERRIDE PERMISSION */
      const userPerm = await UserPermission.findOne({
        userId: user._id,
        moduleKey,
        [`permissions.${action}`]: true
      }).lean();

      if (userPerm) return next();

      /* 2️⃣ ROLE BASED PERMISSION */
      const rolePerm = await ModulePermission.findOne({
        role: { $in: user.roleIds },
        moduleKey,
        [`permissions.${action}`]: true
      }).lean();

      if (!rolePerm) {
        return res.status(403).json({
          success: false,
          message: "Permission denied"
        });
      }

      return next();

    } catch (err) {
      console.error("RBAC ERROR:", err);
      return res.status(500).json({
        success:false,
        message:"Permission system failed"
      });
    }
  };
};
