import dotenv from "dotenv";

dotenv.config();

if (!process.env.MONGO_URI) {
  throw new Error("❌ MONGO_URI is not defined in environment variables");
}

export const config = {
  port: Number(process.env.PORT) || 5000,
  mongoURI: process.env.MONGO_URI,
jwtSecret: process.env.JWT_SECRET || "supersecretkey",
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || "refreshsupersecret",
  jwtExpiresIn: "10h",        // 1 hour
  jwtRefreshExpiresIn: "7d", // 7 days

  bcryptSaltRounds: Number(process.env.BCRYPT_SALT) || 12,
};
