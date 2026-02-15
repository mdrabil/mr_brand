import Module from "../models/Module.js";
import ModulePermission from "../models/ModulePermission.js";
import { USER_ROLE } from "../constants/enums.js";

/**
 * Assign or Update Module Permissions for a Role
 * SUPER_ADMIN only
 */
export const assignModulePermission = async (req, res) => {
  try {
    const { role, moduleKey, permissions } = req.body;

    // 1️⃣ Basic validation
    if (!role || !moduleKey || !permissions) {
      return res.status(400).json({
        success: false,
        message: "role, moduleKey and permissions are required"
      });
    }

    // 2️⃣ Super admin ko assign karna allowed nahi
    if (role === USER_ROLE.SUPER_ADMIN) {
      return res.status(400).json({
        success: false,
        message: "SUPER_ADMIN does not require permissions"
      });
    }

    // 3️⃣ Module exist karta hai ya nahi
    const moduleExists = await Module.findOne({ moduleKey });
    if (!moduleExists) {
      return res.status(404).json({
        success: false,
        message: "Module not found"
      });
    }

    // 4️⃣ Upsert permission
    const permission = await ModulePermission.findOneAndUpdate(
      { role, moduleKey },
      {
        role,
        moduleKey,
        permissions: {
          create: !!permissions.create,
          read: !!permissions.read,
          update: !!permissions.update,
          delete: !!permissions.delete
        }
      },
      {
        upsert: true,
        new: true
      }
    );

    return res.status(200).json({
      success: true,
      message: "Module permission assigned successfully",
      data: permission
    });

  } catch (error) {
    console.error("Assign Module Permission Error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};
