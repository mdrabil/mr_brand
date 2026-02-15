import Product from "../models/Product.model.js";
import Store from "../models/Store.model.js";
import Joi from "joi";
import { USER_ROLE, PRODUCT_STATUS } from "../constants/enums.js";

// 🔹 Joi Validation Schemas
const createProductSchema = Joi.object({
  store: Joi.string().required(),
  name: Joi.string().required(),
  category: Joi.string().required(),
  subCategory: Joi.string().optional(),
  description: Joi.string().allow(""),
  variants: Joi.array().items(
    Joi.object({
      label: Joi.string().required(),
      value: Joi.string().required(),
      mrp: Joi.number().positive(),
      sellingPrice: Joi.number().positive().required(),
      stockQty: Joi.number().integer().min(0),
      isActive: Joi.boolean()
    })
  ).min(1).required(),
  attributes: Joi.object().optional(),
  gstPercent: Joi.number().optional(),
  status: Joi.string().valid(...Object.values(PRODUCT_STATUS)).default(PRODUCT_STATUS.ACTIVE),
  images: Joi.array().items(Joi.string()).optional()
});

const updateProductSchema = Joi.object({
  name: Joi.string(),
  name: Joi.string(),
  store: Joi.optional(),
  category: Joi.string(),
  subCategory: Joi.string(),
  description: Joi.string().allow(""),
  variants: Joi.array().items(
    Joi.object({
      label: Joi.string().required(),
      _id: Joi.string().optional(),
      value: Joi.string().required(),
      mrp: Joi.number().positive(),
      sellingPrice: Joi.number().positive().required(),
      stockQty: Joi.number().integer().min(0),
      isActive: Joi.boolean()
    })
  ),
  attributes: Joi.object(),
  gstPercent: Joi.number(),
  status: Joi.string().valid(...Object.values(PRODUCT_STATUS)),
  images: Joi.array().items(Joi.string())
}).min(1);



// 🔹 CREATE PRODUCT
export const createProduct = async (req, res) => {
  try {
    const { error, value } = createProductSchema.validate(req.body);
    if (error) return res.status(400).json({ message: error.details[0].message });

    // Store access check
    const store = await Store.findById(value.store);
    if (!store) return res.status(404).json({ message: "Store not found" });

    if (!req.user.roles.includes(USER_ROLE.SUPER_ADMIN)) {
      if (req.user.roles.includes(USER_ROLE.VENDOR) && store.owner.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: "Access denied" });
      }
      if ([USER_ROLE.STORE_MANAGER, USER_ROLE.CHEF].some(r => req.user.roles.includes(r))) {
        if (req.staffRoleStoreId.toString() !== store._id.toString()) {
          return res.status(403).json({ message: "Access denied" });
        }
      }
    }

    // Duplicate product per store
    const duplicate = await Product.findOne({ store: value.store, name: value.name });
    if (duplicate) return res.status(400).json({ message: "Product with same name already exists in this store" });

    // Images from multer
    if (req.files && req.files.length > 0) {
      value.images = req.files.map(f => `/uploads/products/${f.filename}`);
    } else {
      value.images = [];
    }

    value.createdBy = req.user._id;

    const product = await Product.create(value);
    res.status(201).json({ success: true, product });
  } catch (err) {
    console.error("createProduct:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// 🔹 UPDATE PRODUCT
export const updateProduct = async (req, res) => {
  try {
    const { productId } = req.params;

    console.log("get the product",req.body)
        const product2 = await Product.findById(productId);

        console.log("database",product2)
    const { error, value } = updateProductSchema.validate(req.body);
    if (error) return res.status(400).json({ message: error.details[0].message });

    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ message: "Product not found" });


    // Duplicate name check
    if (value.name && value.name !== product.name) {
      const duplicate = await Product.findOne({ store: product.store, name: value.name });
      if (duplicate) return res.status(400).json({ message: "Product with same name already exists in this store" });
    }

    // Images append if uploaded
    if (req.files && req.files.length > 0) {
      value.images = [...(product.images || []), ...req.files.map(f => `/uploads/products/${f.filename}`)];
    }

    Object.assign(product, value);
    await product.save();

    res.json({ success: true, product });
  } catch (err) {
    console.error("updateProduct:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// 🔹 GET PRODUCT BY ID
export const getProductById = async (req, res) => {
  try {
    const { productId } = req.params;
    const product = await Product.findById(productId).populate('store').populate('category').populate("subCategory").lean();
    if (!product) return res.status(404).json({ message: "Product not found" });


    res.json({ success: true, product });
  } catch (err) {
    console.error("getProductById:", err);
    res.status(500).json({ message: "Server error" });
  }
};







export const getAllProducts = async (req, res) => {
  try {
    // ================= Extract query/body params =================
    const {
      page = 1,
      limit = 20,
      store,
      category,
      status,
      name,
      search
    } = req.body;

    const { allowedStores, user } = req;

    let filter = {};

        const totalproduct = await Product.countDocuments(filter);
    console.log("get the allowsstore",allowedStores)
    console.log("get the totalproduct",totalproduct)
    // ================= Apply store access =================
    if (!user.roles.includes("SUPER_ADMIN")) {
      if (!allowedStores || allowedStores.length === 0) {
        return res.status(403).json({
          success: false,
          message: "Access denied: No assigned stores"
        });
      }

      // User can see only allowed stores
      filter.store = { $in: allowedStores };
    }

    // ================= Optional filters =================
    if (store) filter.store = store; // optional override for super admin
    if (category) filter.category = category;
    if (status) filter.status = status;
    if (name) filter.name = { $regex: name, $options: "i" };

    // ================= Search across name & description =================
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    // ================= Total count =================
    const total = await Product.countDocuments(filter);

    // ================= Products with pagination & populate =================
    const products = await Product.find(filter)
      .populate("store",) // include only necessary fields
      .populate("category", "name")
      .populate("subCategory", "name")
      .skip((page - 1) * limit)
      .limit(limit)
      .sort({ createdAt: -1 });

    // ================= Response =================
    res.status(200).json({
      success: true,
      message: "Products fetched successfully",
      total,
      page,
      limit,
      products
    });

  } catch (err) {
    console.error("getAllProducts error:", err);
    res.status(500).json({
      success: false,
      message: "Server error. Please try again later."
    });
  }
};



// 🔹 DELETE PRODUCT
export const deleteProduct = async (req, res) => {
  try {
    const { productId } = req.params;
    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ message: "Product not found" });


    await product.deleteOne();
    res.json({ success: true, message: "Product deleted successfully" });
  } catch (err) {
    console.error("deleteProduct:", err);
    res.status(500).json({ message: "Server error" });
  }
};
