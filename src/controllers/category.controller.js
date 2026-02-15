import Category from "../models/Category.model.js";
import Joi from "joi";
import { USER_ROLE, CATEGORY_STATUS } from "../constants/enums.js";

// 🔹 Validation
const createCategorySchema = Joi.object({
  name: Joi.string().required(),
  parentCategory: Joi.string().allow(null),
  status: Joi.string().valid(...Object.values(CATEGORY_STATUS)).default(CATEGORY_STATUS.ACTIVE),
});

const updateCategorySchema = Joi.object({
  name: Joi.string(),
  parentCategory: Joi.string().allow(null),
  status: Joi.string().valid(...Object.values(CATEGORY_STATUS)),
}).min(1);

// ------------------- CRUD -------------------

// Create Category
export const createCategory = async (req, res) => {
  try {

    const userId = req.user._id

  if (!userId) return res.status(400).json({ message: "User Not Found" });

    const { error, value } = createCategorySchema.validate(req.body);
    if (error) return res.status(400).json({ message: error.details[0].message });

    const duplicate = await Category.findOne({ name: value.name, parentCategory: value.parentCategory });
    if (duplicate) return res.status(400).json({ message: "Category already exists" });

    const category = await Category.create({ ...value, createdBy: userId });
    res.status(201).json({ success: true, category });
  } catch (err) {
    console.error("createCategory:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// Update Category
export const updateCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;
    const { error, value } = updateCategorySchema.validate(req.body);
    if (error) return res.status(400).json({ message: error.details[0].message });

    const category = await Category.findById(categoryId);
    if (!category) return res.status(404).json({ message: "Category not found" });

    // Only SUPER_ADMIN or creator can update
    if (!req.user.roles.includes(USER_ROLE.SUPER_ADMIN) && category.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Access denied" });
    }

    Object.assign(category, value);
    await category.save();

    res.json({ success: true, category });
  } catch (err) {
    console.error("updateCategory:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// Get All Categories (with pagination)
export const getAllCategories = async (req, res) => {
  try {
    const page = parseInt(req.query.page || 1);
    const limit = parseInt(req.query.limit || 10);
    const status = req.query.status;
    const search = req.query.search;

    const filter = {};
    if (status) filter.status = status;

  if (search) {
  filter.name = { $regex: search, $options: "i" };
}

    const total = await Category.countDocuments(filter);
    const categories = await Category.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    res.json({ success: true, total, page, limit, categories });
  } catch (err) {
    console.error("getAllCategories:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// Get single Category
export const getCategoryById = async (req, res) => {
  try {
    const category = await Category.findById(req.params.categoryId);
    if (!category) return res.status(404).json({ message: "Category not found" });

    res.json({ success: true, category });
  } catch (err) {
    console.error("getCategoryById:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// Delete Category
export const deleteCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.categoryId);
    if (!category) return res.status(404).json({ message: "Category not found" });

    if (!req.user.roles.includes(USER_ROLE.SUPER_ADMIN) && category.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Access denied" });
    }

    await category.deleteOne();
    res.json({ success: true, message: "Category deleted" });
  } catch (err) {
    console.error("deleteCategory:", err);
    res.status(500).json({ message: "Server error" });
  }
};


