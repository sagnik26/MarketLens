/** Mongoose connection singleton; dbConnect() for serverless-safe connection with bufferCommands: false. */

import mongoose from "mongoose";
import { env } from "@/config/env";

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  // eslint-disable-next-line no-var
  var __mongoose: MongooseCache | undefined;
}

const cached: MongooseCache = global.__mongoose ?? { conn: null, promise: null };

if (!global.__mongoose) {
  global.__mongoose = cached;
}

export async function dbConnect(): Promise<typeof mongoose> {
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    if (!env.MONGODB_URI) {
      throw new Error("MONGODB_URI is not configured");
    }

    const opts = {
      bufferCommands: false,
      maxPoolSize: 10,
      minPoolSize: 2,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 30000,
      heartbeatFrequencyMS: 10000,
      maxIdleTimeMS: 30000,
    };

    cached.promise = mongoose.connect(env.MONGODB_URI, opts);
  }

  try {
    cached.conn = await cached.promise;
  } catch (error) {
    cached.promise = null;
    throw error;
  }

  return cached.conn;
}

