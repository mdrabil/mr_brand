// src/utils/jwt.js
import jwt from 'jsonwebtoken';
import { config } from '../config/config.js';


export const generateToken = (payload) => {
  const accessToken = jwt.sign(payload, config.jwtSecret, { expiresIn: config.jwtExpiresIn });
  const refreshToken = jwt.sign(payload, config.jwtRefreshSecret, { expiresIn: config.jwtRefreshExpiresIn });

  return { accessToken, refreshToken };
};
