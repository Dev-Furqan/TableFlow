import mongoose from 'mongoose';
import { env } from './env.js';

let connectionPromise: Promise<typeof mongoose> | undefined;

export const connectDb = async () => {
  if (mongoose.connection.readyState === 1) {
    return mongoose;
  }

  if (!connectionPromise) {
    mongoose.set('strictQuery', true);
    connectionPromise = mongoose.connect(env.MONGODB_URI)
      .then((connection) => {
        console.log('MongoDB connected');
        return connection;
      })
      .catch((error) => {
        connectionPromise = undefined;
        throw error;
      });
  }

  return connectionPromise;
};
