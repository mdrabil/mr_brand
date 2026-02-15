import bcrypt from "bcrypt";
import { config } from "../config/config.js";

export const hashPassword = async (plainPassword) => {
  const salt = await bcrypt.genSalt(config.bcryptSaltRounds);
  return await bcrypt.hash(plainPassword, salt);
};

export const comparePassword = async (plainPassword, hashedPassword) => {
  return await bcrypt.compare(plainPassword, hashedPassword);
};
