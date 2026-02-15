import { USER_ROLE } from "../constants/enums.js";

export const adminOnly = (req, res, next) => {
  const roles = req.user.roles;

  if (!roles?.includes(USER_ROLE.SUPER_ADMIN)) {
    return res.status(403).json({ message: "Admin only access" });
  }

  next();
};
