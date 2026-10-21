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
      .then(async (connection) => {
        // Older deployments created a global unique index on `key`. Settings are
        // tenant-scoped, so remove that legacy index before ensuring the correct
        // compound unique index. This is safe to run on every startup.
        const settings = connection.connection.collection('settings');
        try {
          await settings.dropIndex('key_1');
          console.log('Removed legacy settings key index');
        } catch (error: any) {
          if (error?.code !== 26 && error?.code !== 27) throw error;
        }
        await settings.createIndex({restaurant:1,key:1},{name:'restaurant_1_key_1',unique:true});
        // Earlier versions made order numbers globally unique. Order numbers are
        // restaurant-scoped, and the old index prevents different restaurants
        // from using the same daily sequence.
        const orders = connection.connection.collection('orders');
        try {
          await orders.dropIndex('orderNumber_1');
          console.log('Removed legacy global order number index');
        } catch (error: any) {
          if (error?.code !== 26 && error?.code !== 27) throw error;
        }
        await orders.createIndex({restaurant:1,orderNumber:1},{name:'restaurant_1_orderNumber_1',unique:true});
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
