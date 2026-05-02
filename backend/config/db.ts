import mongoose from "mongoose";
import { env } from "./env.js";

// MongoDB is initialized once at process startup so requests remain stateless
// while sharing a pooled database connection under the hood.
export const connectDatabase = async () => {
  if (!env.mongodbUri) {
    throw new Error("MONGODB_URI is required");
  }

  await mongoose.connect(env.mongodbUri);
  console.log("MongoDB connected");
};
