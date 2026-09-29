import mongoose from 'mongoose';
import { config } from './env';

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 2000;

export const connectDB = async () => {
  if (mongoose.connection.readyState >= 1) {
    return;
  }

  let retries = 0;

  while (retries < MAX_RETRIES) {
    try {
      const conn = await mongoose.connect(config.mongoDbUri);
      console.log(`MongoDB Connected: ${conn.connection.host}`);
      return; // Successfully connected, exit the function
    } catch (error: any) {
      retries++;
      console.error(`MongoDB connection attempt ${retries} failed: ${error.message}`);
      
      if (retries >= MAX_RETRIES) {
        console.error('Max MongoDB connection retries reached. Exiting gracefully...');
        process.exit(1);
      }
      
      console.log(`Retrying in ${RETRY_DELAY_MS / 1000} seconds...`);
      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
    }
  }
};
