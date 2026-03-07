import CategoryModel from "../../models/Category.model.js";
import CouponModel from "../../models/Coupon.model.js";
import CouponUsageModel from "../../models/CouponUsage.model.js";
import ProductModel from "../../models/Product.model.js";



// 🔹 GET PRODUCT BY ID
export const getProductById = async (req, res) => {
  try {
    const { productId } = req.params;
    const product = await ProductModel.findById(productId).populate('category').populate("subCategory").lean();
    if (!product) return res.status(404).json({ message: "Product not found" });


    res.json({ success: true, product });
  } catch (err) {
    console.error("getProductById:", err);
    res.status(500).json({ message: "Server error" });
  }
};





export const getAllCategorys = async (req, res) => {
  try {
    const { page = 1, limit = 20, name, search } = req.query;

    const pageNum = Number(page);
    const limitNum = Number(limit);

    let filter = {};

    if (name) filter.name = { $regex: name, $options: "i" };

    if (search) {
      filter.$or = [{ name: { $regex: search, $options: "i" } }];
    }

    const total = await CategoryModel.countDocuments(filter);

 const categoryData = await CategoryModel.find(filter)
  .populate("parentCategory", "name")
  .skip((pageNum - 1) * limitNum)
  .limit(limitNum)
  .sort({ createdAt: -1 });

const category = categoryData.map((cat) => ({
  _id: cat._id,
  name: cat.name,
  status: cat.status,
  parentCategory: cat.parentCategory,
  image: cat.image?.url || null,   // ✅ only url
  createdAt: cat.createdAt,
}));

    res.status(200).json({
      total,
      success:true,
      page: pageNum,
      limit: limitNum,
      category,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server error" });
  }
};


// export const getAllProducts = async (req, res) => {
//   try {
   
//     const {
//       page = 1,
//       limit = 20,
//       store,
//       category,
//       status,
//       name,
//       search
//     } = req.body;



//     let filter = {};

     
   
  

//     // ================= Optional filters =================
//     if (store) filter.store = store; // optional override for super admin
//     if (category) filter.category = category;
//     if (status) filter.status = status;
//     if (name) filter.name = { $regex: name, $options: "i" };

//     // ================= Search across name & description =================
//     if (search) {
//       filter.$or = [
//         { name: { $regex: search, $options: "i" } },
//         { description: { $regex: search, $options: "i" } },
//       ];
//     }

//     // ================= Total count =================
//     const total = await ProductModel.countDocuments(filter);

//     // ================= Products with pagination & populate =================
//   const productData = await ProductModel.find(filter)
//   .populate("category", "name")
//   .populate("subCategory", "name")
//   .skip((page - 1) * limit)
//   .limit(limit)
//   .sort({ createdAt: -1 });

// const products = productData.map((p) => ({
//   _id: p._id,
//   rmProductId: p.rmProductId,
//   name: p.name,
//   description: p.description,
//   category: p.category,
//   label: p.label,
//   subCategory: p.subCategory,
//   variants: p.variants,
//   gstPercent: p.gstPercent,
//   status: p.status,
//   images: p.images?.map((img) => img.url), // ✅ only url
//   thumbnails: p.thumbnails?.map((img) => img.url), // ✅ only url
//   createdAt: p.createdAt,
// }));

//     // ================= Response =================
//     res.status(200).json({
//       success: true,
//       message: "Products fetched successfully",
//       total,
//       page,
//       limit,
//       products
//     });

//   } catch (err) {
//     console.error("getAllProducts error:", err);
//     res.status(500).json({
//       success: false,
//       message: "Server error. Please try again later."
//     });
//   }
// };




export const getAllProducts = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      store,
      category,
      status,
      name,
      search
    } = req.query;

    const pageNumber = Number(page);
    const limitNumber = Number(limit);

    console.log("get the data from query", req.query);

    let filter = {};

    // ================= Optional filters =================
    if (store) {
      filter.store = new mongoose.Types.ObjectId(store);
    }

    if (status) filter.status = status;

    if (name) {
      filter.name = { $regex: name, $options: "i" };
    }

    // ================= Category Filter (NAME → ObjectId) =================
    if (category) {
      const foundCategory = await CategoryModel.findOne({
        name: { $regex: `^${category}$`, $options: "i" }
      }).select("_id");

      if (foundCategory) {
        filter.category = foundCategory._id;
      } else {
        return res.status(200).json({
          success: true,
          message: "No products found",
          total: 0,
          page: pageNumber,
          limit: limitNumber,
          products: [],
          categorySummary: []
        });
      }
    }

    // ================= Search across name & description =================
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    // ================= Total count =================
    const total = await ProductModel.countDocuments(filter);

    // ================= Products with pagination & populate =================
    const productData = await ProductModel.find(filter)
      .populate("category", "name")
      .populate("subCategory", "name")
      .skip((pageNumber - 1) * limitNumber)
      .limit(limitNumber)
      .sort({ createdAt: -1 });

    const products = productData.map((p) => ({
      _id: p._id,
      rmProductId: p.rmProductId,
      name: p.name,
      description: p.description,
      category: p.category,
      label: p.label,
      subCategory: p.subCategory,
      variants: p.variants,
      gstPercent: p.gstPercent,
      status: p.status,
      images: p.images?.map((img) => img.url),
      thumbnails: p.thumbnails?.map((img) => img.url),
      createdAt: p.createdAt,
    }));

    // ================= Category Summary =================
 // ================= Category Summary =================

// remove category filter for summary
const summaryFilter = { ...filter };
delete summaryFilter.category;

const categorySummary = await ProductModel.aggregate([
  { $match: summaryFilter },
  {
    $group: {
      _id: "$category",
      count: { $sum: 1 }
    }
  },
  {
    $lookup: {
      from: "categories",
      localField: "_id",
      foreignField: "_id",
      as: "categoryInfo"
    }
  },
  {
    $unwind: "$categoryInfo"
  },
  {
    $match: {
      "categoryInfo.isActive": true
    }
  },
  {
    $project: {
      _id: 0,
      category: "$categoryInfo.name",
      count: 1
    }
  }
]);

    // ================= Response =================
    res.status(200).json({
      success: true,
      message: "Products fetched successfully",
      total,
      page: pageNumber,
      limit: limitNumber,
      products,
      categorySummary,
    });

  } catch (err) {
    console.error("getAllProducts error:", err);
    res.status(500).json({
      success: false,
      message: "Server error. Please try again later."
    });
  }
};



export const applyCoupon = async (req, res) => {
  try {
    console.log("----- APPLY COUPON API HIT -----");

    const { code, orderAmount } = req.query;

    console.log("Incoming Query:", { code, orderAmount });

    if (!code || !orderAmount) {
      console.log("❌ Missing code or orderAmount");
      return res.status(400).json({
        success: false,
        message: "Coupon code and order amount are required"
      });
    }

    const amount = Number(orderAmount);

    if (isNaN(amount) || amount <= 0) {
      console.log("❌ Invalid order amount:", orderAmount);
      return res.status(400).json({
        success: false,
        message: "Invalid order amount"
      });
    }

    const coupon = await CouponModel.findOne({
      code: code.toUpperCase(),
      status: "ACTIVE"
    });

    if (!coupon) {
      console.log("❌ Coupon not found or inactive:", code);
      return res.status(400).json({
        success: false,
        message: "Invalid or inactive coupon"
      });
    }

    console.log("✅ Coupon Found:", {
      id: coupon._id,
      code: coupon.code,
      type: coupon.type,
      value: coupon.value
    });

    const now = new Date();

    if (now < coupon.startDate) {
      console.log("❌ Coupon not started yet");
      return res.status(400).json({
        success: false,
        message: "Coupon not started yet"
      });
    }

    if (now > coupon.endDate) {
      console.log("❌ Coupon expired");
      return res.status(400).json({
        success: false,
        message: "Coupon expired"
      });
    }

    if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
      console.log("❌ Usage limit exceeded");
      return res.status(400).json({
        success: false,
        message: "Coupon usage limit exceeded"
      });
    }

    if (amount < coupon.minOrderAmount) {
      console.log("❌ Below minimum order amount");
      return res.status(400).json({
        success: false,
        message: `Minimum order amount is ₹${coupon.minOrderAmount}`
      });
    }

    // User usage check
    if (req.user?._id) {
      console.log("Checking usage for user:", req.user._id);

      const alreadyUsed = await CouponUsageModel.findOne({
        coupon: coupon._id,
        user: req.user._id
      });

      if (alreadyUsed) {
        console.log("❌ User already used this coupon");
        return res.status(400).json({
          success: false,
          message: "You have already used this coupon"
        });
      }
    }

    let discount = 0;

    if (coupon.type === "PERCENT") {
      discount = (amount * coupon.value) / 100;

      if (coupon.maxDiscountAmount) {
        discount = Math.min(discount, coupon.maxDiscountAmount);
      }
    }

    if (coupon.type === "FLAT") {
      discount = coupon.value;
    }

    discount = Math.min(discount, amount);

    const finalAmount = amount - discount;

    console.log("🎉 Coupon Applied Successfully");
    console.log("Coupon Code:", coupon.code);
    console.log("Order Amount:", amount);
    console.log("Discount Given:", discount);
    console.log("Final Amount:", finalAmount);
    console.log("Response Sent ✅");

    return res.status(200).json({
      success: true,
      message: "Coupon applied successfully",
      couponCode: coupon.code,
      orderAmount: amount,
      discount,
      finalAmount,
      couponId: coupon._id
    });

  } catch (error) {
    console.error("❌ Apply coupon error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};

// export const getAllProducts = async (req, res) => {
//   try {
//  const {
//   page = 1,
//   limit = 20,
//   store,
//   category,
//   status,
//   name,
//   search
// } = req.query;




//     console.log("get the data from body",req.query)

//     let filter = {};

//     // ================= Optional filters =================
//     if (store) filter.store = store;
//     if (category) filter.category = category;
//     if (status) filter.status = status;
//     if (name) filter.name = { $regex: name, $options: "i" };

//     // ================= Search across name & description =================
//     if (search) {
//       filter.$or = [
//         { name: { $regex: search, $options: "i" } },
//         { description: { $regex: search, $options: "i" } },
//       ];
//     }

//     // ================= Total count =================
//     const total = await ProductModel.countDocuments(filter);

//     // ================= Products with pagination & populate =================
//     const productData = await ProductModel.find(filter)
//       .populate("category", "name")
//       .populate("subCategory", "name")
//       .skip((page - 1) * limit)
//       .limit(limit)
//       .sort({ createdAt: -1 });

//     const products = productData.map((p) => ({
//       _id: p._id,
//       rmProductId: p.rmProductId,
//       name: p.name,
//       description: p.description,
//       category: p.category,
//       label: p.label,
//       subCategory: p.subCategory,
//       variants: p.variants,
//       gstPercent: p.gstPercent,
//       status: p.status,
//       images: p.images?.map((img) => img.url),
//       thumbnails: p.thumbnails?.map((img) => img.url),
//       createdAt: p.createdAt,
//     }));

//     // ================= Category & Subcategory Summary =================
//    // ================= Category Summary =================
// const categorySummary = await ProductModel.aggregate([
//   { $match: filter },
//   {
//     $group: {
//       _id: "$category", // group by category only
//       count: { $sum: 1 }
//     }
//   },
//   {
//     $lookup: {
//       from: "categories", // your categories collection
//       localField: "_id",
//       foreignField: "_id",
//       as: "categoryInfo"
//     }
//   },
//   {
//     $project: {
//       _id: 0,
//       category: { $arrayElemAt: ["$categoryInfo.name", 0] },
//       count: 1
//     }
//   }
// ]);

//     // ================= Response =================
//     res.status(200).json({
//       success: true,
//       message: "Products fetched successfully",
//       total,
//       page,
//       limit,
//       products,
//       categorySummary, // ✅ added summary
//     });

//   } catch (err) {
//     console.error("getAllProducts error:", err);
//     res.status(500).json({
//       success: false,
//       message: "Server error. Please try again later."
//     });
//   }
// };

