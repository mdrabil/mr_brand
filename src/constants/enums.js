// export const USER_ROLE = Object.freeze({
//   SUPER_ADMIN: "SUPER_ADMIN",
//   VENDOR: "VENDOR",
//   CUSTOMER: "CUSTOMER",
//   STORE_MANAGER: "STORE_MANAGER",
//   RIDER: "RIDER",
//   CHEF: "CHEF"
// });

export const USER_ROLE = Object.freeze({
  // 🔐 SYSTEM
  SUPER_ADMIN: "SUPER_ADMIN",     // Full system access
  USER: "USER",     // Full system access
  ADMIN: "ADMIN",                 // Platform admin (optional future)

  // 🏪 STORE LEVEL
  VENDOR: "VENDOR",               // Store owner
  STORE_MANAGER: "STORE_MANAGER", // Manages store ops
  STAFF: "STAFF",                 // Store staff (billing, packing)
  CHEF: "CHEF",                   // Kitchen staff

  // 🚚 DELIVERY
  RIDER: "RIDER",                 // Delivery partner
  DELIVERY_MANAGER: "DELIVERY_MANAGER", // Future ops control

  // 👤 CUSTOMER
  CUSTOMER: "CUSTOMER",           // End user

  // 📞 SUPPORT
  SUPPORT: "SUPPORT"              // Customer support agent
});


export const STATUS  = Object.freeze({
  ACTIVE: "ACTIVE",
  INACTIVE: "INACTIVE",
});

export const STORE_STATUS = Object.freeze({
  ACTIVE: "ACTIVE",
  INACTIVE: "INACTIVE",
  SUSPENDED: "SUSPENDED"
});

export const ORDER_STATUS = Object.freeze({
  PLACED: "PLACED",
  PREPARING: "PREPARING",
  READY: "READY",
  OUT_FOR_DELIVERY: "OUT_FOR_DELIVERY",
  DELIVERED: "DELIVERED",
  CANCELLED: "CANCELLED"
});


export const COUPON_STATUS = {
  ACTIVE: "ACTIVE",
  INACTIVE: "INACTIVE",
    EXPIRED: "EXPIRED",
  DISABLED: "DISABLED",

};

export const COUPON_TYPE = {
  FLAT: "FLAT",
  PERCENT: "PERCENT"
};
export const PAYMENT_STATUS = Object.freeze({
  INITIATED: "INITIATED",
  SUCCESS: "SUCCESS",
  PENDING: "PENDING",
  FAILED: "FAILED"
});


export const CATEGORY_STATUS = Object.freeze({
  ACTIVE: "ACTIVE",
  INACTIVE: "INACTIVE"
});

export const PRODUCT_STATUS = Object.freeze({
  ACTIVE: "ACTIVE",
  OUT_OF_STOCK: "OUT_OF_STOCK",
  DISABLED: "DISABLED"
});



export const MODULE_KEY = Object.freeze({
  /* ---------------- DASHBOARD ---------------- */
  DASHBOARD: "DASHBOARD",

  /* ---------------- USER & ACCESS ---------------- */
  USER: "USER",
  ROLE: "ROLE",
  PERMISSION: "PERMISSION",
  STAFF: "STAFF",

    CUSTOMER: "CUSTOMER",
  CART: "CART",
  WISHLIST: "WISHLIST",
 

  /* ---------------- STORE ---------------- */
  STORE: "STORE",
  STORE_TIMING: "STORE_TIMING",
  STORE_STAFF: "STORE_STAFF",
  STORE_DOCUMENT: "STORE_DOCUMENT",
  STORE_PAYOUT: "STORE_PAYOUT",

  /* ---------------- CATALOG ---------------- */
  CATEGORY: "CATEGORY",
  SUB_CATEGORY: "SUB_CATEGORY",
  BRAND: "BRAND",
  PRODUCT: "PRODUCT",
  PRODUCT_VARIANT: "PRODUCT_VARIANT",
  PRODUCT_STOCK: "PRODUCT_STOCK",
  PRODUCT_REVIEW: "PRODUCT_REVIEW",

  /* ---------------- ORDER ---------------- */
  ORDER: "ORDER",
  ORDER_ITEM: "ORDER_ITEM",
  ORDER_TRACKING: "ORDER_TRACKING",
  CART: "CART",

  /* ---------------- DELIVERY ---------------- */
  DELIVERY: "DELIVERY",
  RIDER: "RIDER",
  RIDER_PAYOUT: "RIDER_PAYOUT",
  DELIVERY_ZONE: "DELIVERY_ZONE",

  /* ---------------- PAYMENT ---------------- */
  PAYMENT: "PAYMENT",
  PAYMENT_METHOD: "PAYMENT_METHOD",
  REFUND: "REFUND",
  WALLET: "WALLET",
  COMMISSION: "COMMISSION",

  /* ---------------- PROMOTION ---------------- */
  COUPON: "COUPON",
  OFFER: "OFFER",
  BANNER: "BANNER",

  /* ---------------- REPORT & ANALYTICS ---------------- */
  REPORT: "REPORT",
  ANALYTICS: "ANALYTICS",

  /* ---------------- SUPPORT ---------------- */
  SUPPORT_TICKET: "SUPPORT_TICKET",
  CHAT: "CHAT",

  /* ---------------- SYSTEM ---------------- */
  NOTIFICATION: "NOTIFICATION",
  SETTING: "SETTING",
  AUDIT_LOG: "AUDIT_LOG"
});


// export const MODULE_KEY = Object.freeze({
//   DASHBOARD: "DASHBOARD",

//   USER: "USER",
//   ROLE: "ROLE",
//   STAFF: "STAFF",

//   STORE: "STORE",
//   STORE_TIMING: "STORE_TIMING",
//   STORE_STAFF: "STORE_STAFF",

//   CATEGORY: "CATEGORY",
//   SUB_CATEGORY: "SUB_CATEGORY",
//   PRODUCT: "PRODUCT",
//   PRODUCT_VARIANT: "PRODUCT_VARIANT",

//   ORDER: "ORDER",
//   ORDER_ITEM: "ORDER_ITEM",

//   PAYMENT: "PAYMENT",
//   REFUND: "REFUND",

//   COUPON: "COUPON",
//   OFFER: "OFFER",

//   REPORT: "REPORT",
//   ANALYTICS: "ANALYTICS",

//   NOTIFICATION: "NOTIFICATION",
//   SETTING: "SETTING",

//   COMMISSION: "COMMISSION",
//   WALLET: "WALLET",

//   SUPPORT_TICKET: "SUPPORT_TICKET",

//   AUDIT_LOG: "AUDIT_LOG"
// });