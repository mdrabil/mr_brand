import Role from "../models/Role.model.js";

// ✅ Create Role (ADMIN ONLY)
export const createRole = async (req, res) => {
  try {
    const { name, description } = req.body;
    if (!name) return res.status(400).json({ message: "Role name required" });

    const exists = await Role.findOne({ name });
    if (exists) return res.status(400).json({ message: "Role already exists" });

    const role = await Role.create({ name, description });
    res.json({ success: true, message: "Role created", role });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ✅ GET ALL ROLES (Pagination + Search)
export const getAllRoles = async (req, res) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const search = req.query.search || "";

    const query = search
      ? { name: { $regex: search, $options: "i" } }
      : {};

    const total = await Role.countDocuments(query);
    const roles = await Role.find(query)
      .skip((page - 1) * limit)
      .limit(limit)
      .sort({ createdAt: -1 });

    res.json({ success: true, roles, total, page, limit });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ✅ Update Role
export const updateRole = async (req, res) => {
  try {
    const role = await Role.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    if (!role) return res.status(404).json({ message: "Role not found" });

    res.json({ success: true, message: "Role updated", role });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ✅ Delete Role
export const deleteRole = async (req, res) => {
  try {
    await Role.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Role deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
