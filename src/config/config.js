// import dotenv from "dotenv";

// dotenv.config();

// if (!process.env.MONGO_URI) {
//   throw new Error("❌ MONGO_URI is not defined in environment variables");
// }

// export const config = {
//   port: Number(process.env.PORT) ,
//   mongoURI: process.env.MONGO_URI,
// jwtSecret: process.env.JWT_SECRET,
//   jwtRefreshSecret: process.env.JWT_REFRESH_SECRET,
//   jwtExpiresIn: "7d",        
//   jwtRefreshExpiresIn: "7d", // 7 days

//   bcryptSaltRounds: Number(process.env.BCRYPT_SALT) || 12,
// };



import dotenv from "dotenv";
dotenv.config(); // MUST be at the top

if (!process.env.MONGO_URI) {
  throw new Error("❌ MONGO_URI is not defined in environment variables");
}
if (!process.env.JWT_SECRET) {
  throw new Error("❌ JWT_SECRET is not defined in environment variables");
}
if (!process.env.JWT_REFRESH_SECRET) {
  throw new Error("❌ JWT_REFRESH_SECRET is not defined in environment variables");
}

export const config = {
  port: Number(process.env.PORT) || 8080,
  mongoURI: process.env.MONGO_URI,
  
  jwtSecret: process.env.JWT_SECRET,
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES || "7d",
  jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES || "7d",

  bcryptSaltRounds: Number(process.env.BCRYPT_SALT) || 12,
  
  emailUser: process.env.EMAIL_USER,
  emailPass: process.env.EMAIL_PASS,
  razorpayKeySecret: process.env.RAZORPAY_KEY_SECRET,
  cloudName: process.env.CLOUD_NAME,
  cloudinaryApiKey: process.env.CLOUDINARY_API_KEY,
  cloudinaryApiSecret: process.env.CLOUDINARY_API_SECRET,
};