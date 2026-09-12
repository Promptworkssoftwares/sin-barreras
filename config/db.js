import mongoose from 'mongoose';
import { getMongoConfig } from './env.js';

let connectionPromise = null;

export async function connectDB() {
  if (mongoose.connection.readyState === 1) return mongoose.connection;
  if (connectionPromise) return connectionPromise;

  const { uri, dbName } = getMongoConfig();
  mongoose.set('strictQuery', true);

  connectionPromise = mongoose.connect(uri, {
    dbName,
    serverSelectionTimeoutMS: 12_000,
    connectTimeoutMS: 12_000,
    socketTimeoutMS: 45_000,
    maxPoolSize: 10,
    minPoolSize: 0
  }).then(() => mongoose.connection).catch((error) => {
    connectionPromise = null;
    throw error;
  });

  return connectionPromise;
}

export async function disconnectDB() {
  if (mongoose.connection.readyState !== 0) await mongoose.disconnect();
  connectionPromise = null;
}
