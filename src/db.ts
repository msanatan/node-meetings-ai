import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import dotenv from "dotenv";

dotenv.config();

let mockMongo: MongoMemoryServer | null = null;

export const connectDB = async () => {
  let mongoUrl = process.env.MONGO_URI;
  if (process.env.NODE_ENV === "test") {
    mockMongo = await MongoMemoryServer.create();
    mongoUrl = mockMongo.getUri();
    process.env.MONGO_URI = mongoUrl;
  }

  try {
    const conn = await mongoose.connect(mongoUrl!);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

export const disconnectDB = async () => {
  try {
    await mongoose.connection.close();
    if (mockMongo) {
      await mockMongo.stop();
      mockMongo = null;
    }
    console.log(`MongoDB Disconnected`);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};
