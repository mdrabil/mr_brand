import { USER_ROLE } from "../constants/enums.js";
import { superAdminBypass } from "./superAdmin.middleware.js";

export const allowRoles = (allowedRoles = []) => {
  return (req, res, next) => {
    if (superAdminBypass(req)) return next();

    const hasRole = req.user.roles.some(role =>
      allowedRoles.includes(role)
    );

    if (!hasRole) {
      return res.status(403).json({ message: "Access denied (role)" });
    }

    next();
  };
};


// export const allowRoles = roles => (req, res, next) => {
//   if (!roles.includes(req.user.role)) return res.sendStatus(403);
//   next();
// };
