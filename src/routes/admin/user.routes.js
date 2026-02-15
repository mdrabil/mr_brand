import express from "express";


import { MODULE_KEY, USER_ROLE } from "../../constants/enums.js";
import {
  createUser,
  updateUser,
  getUserById,
  getAllUsers,
  deleteUser
} from "../../controllers/user.controller.js";

import { checkPermission } from "../../middlewares/checkPermission.middleware.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";

const router = express.Router();


// Create User → SUPER_ADMIN only
router.post(
  "/",
  authMiddleware,
   checkPermission(MODULE_KEY.USER, "create"),
  createUser
);

// Update User → SUPER_ADMIN can update anyone, user can update self
router.patch(
  "/:userId",
  authMiddleware,
  checkPermission(MODULE_KEY.USER, "update"),
  updateUser
);

// Get User → SUPER_ADMIN all, user can get self
router.get(
  "/:userId",
  authMiddleware,
  getUserById
);

// Get All Users → SUPER_ADMIN only
router.get(
  "/",
  authMiddleware,
checkPermission(MODULE_KEY.USER, "read"),
  getAllUsers
);

// Delete User → SUPER_ADMIN only
router.delete(
  "/:userId",
  authMiddleware,
 checkPermission(MODULE_KEY.USER, "delete"),
  deleteUser
);

export default router;
