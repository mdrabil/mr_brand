import { USER_ROLE } from "../constants/enums.js";

export const superAdminBypass = (req) => {
  return req.user.roles.includes(USER_ROLE.SUPER_ADMIN);
};
