import mongoose from 'mongoose';
import { CONFIG } from '../config';

let isConnected = false;

export async function connectDB(): Promise<boolean> {
  if (isConnected) return true;
  if (!CONFIG.MONGODB_URI) {
    console.info('No MONGODB_URI provided. Running with high-speed in-memory repository store.');
    return false;
  }

  try {
    await mongoose.connect(CONFIG.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
    });
    isConnected = true;
    console.log('MongoDB successfully connected via Mongoose.');
    return true;
  } catch (err: any) {
    console.warn('MongoDB connection failed; falling back to in-memory store:', err.message);
    return false;
  }
}

export function isDbConnected(): boolean {
  return isConnected && mongoose.connection.readyState === 1;
}
