import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  mongoDbUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/codecrusade',
  corsOrigin: process.env.CORS_ORIGIN?.includes(',') 
    ? process.env.CORS_ORIGIN.split(',') 
    : process.env.CORS_ORIGIN || 'http://localhost:5173',
  jwtSecret: process.env.JWT_SECRET || 'fallback_secret_do_not_use_in_prod',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
};
