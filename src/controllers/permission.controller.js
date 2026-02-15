import ModulePermission from "../models/ModulePermission.model.js";
import Joi from "joi";
import { USER_ROLE } from "../constants/enums.js";
import UserModel from "../models/User.model.js";
import ModuleModel from "../models/Module.model.js";
import ModulePermissionModel from "../models/ModulePermission.model.js";

const permissionSchema = Joi.object({
  role: Joi.string().valid(...Object.values(USER_ROLE)).required(),
  moduleKey: Joi.string().required(),
  permissions: Joi.object({
    create: Joi.boolean(),
    read: Joi.boolean(),
    update: Joi.boolean(),
    delete: Joi.boolean()
  }).required()
});

const permissionListSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  role: Joi.string().valid(...Object.values(USER_ROLE)).optional(),
  moduleKey: Joi.string().optional()
});

// ------------------- Create / Update -------------------
export const createOrUpdatePermission = async (req, res) => {
  try {
    const { error, value } = permissionSchema.validate(req.body);
    if (error) return res.status(400).json({ message: error.details[0].message });

    const permission = await ModulePermission.findOneAndUpdate(
      { role: value.role, moduleKey: value.moduleKey },
      { permissions: value.permissions },
      { new: true, upsert: true }
    );

    res.json({ success: true, permission });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

// ------------------- Get Permissions (filter + pagination) -------------------
export const getPermissions = async (req, res) => {
  try {
    const { error, value } = permissionListSchema.validate(req.query);
    if (error) return res.status(400).json({ message: error.details[0].message });

    const { page, limit, role, moduleKey } = value;
    let filter = {};
    if (role) filter.role = role;
    if (moduleKey) filter.moduleKey = moduleKey;

    const total = await ModulePermission.countDocuments(filter);
    const permissions = await ModulePermission.find(filter)
      .skip((page - 1) * limit)
      .limit(limit)
      .sort({ createdAt: -1 });

    res.json({ success: true, total, page, limit, permissions });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

// ------------------- Delete -------------------
export const deletePermission = async (req, res) => {
  try {
    const { permissionId } = req.params;
    const permission = await ModulePermission.findById(permissionId);
    if (!permission) return res.status(404).json({ message: "Permission not found" });

    await permission.deleteOne();
    res.json({ success: true, message: "Permission deleted" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};



export const getMe = async (req, res) => {
  try {
    // 🔥 populate roles
    const user = await UserModel.findById(req.user._id)
      .populate("roles", "name")
      .lean();

    const roleNames = user.roles.map(r => r.name);

    /* -------------------------------
       🔥 SUPER ADMIN
    -------------------------------- */
    if (roleNames.includes(USER_ROLE.SUPER_ADMIN)) {
      const modules = await ModuleModel.find({ isActive: true });

      return res.json({
        success: true,
        roles: roleNames,
        permissions: modules.map(m => ({
          moduleKey: m.moduleKey,
          permissions: {
            read: true,
            create: true,
            update: true,
            delete: true
          }
        }))
      });
    }

    /* -------------------------------
       🔥 NORMAL ROLES
    -------------------------------- */
    const permissions = await ModulePermissionModel.find({
      role: { $in: roleNames }
    }).lean();

    return res.json({
      success: true,
      roles: roleNames,
      permissions
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false });
  }
};
