import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { config } from "./config";
import logger from "./logger";

let mockMongo: MongoMemoryServer | null = null;

export const connectDB = async () => {
  let mongoUrl = config.mongoUri;
  if (config.environment === "test") {
    mockMongo = await MongoMemoryServer.create();
    mongoUrl = mockMongo.getUri();
    config.mongoUri = mongoUrl;
  }

  try {
    const conn = await mongoose.connect(mongoUrl!);
    logger.info(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    logger.error(error);
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
    logger.info(`MongoDB Disconnected`);
  } catch (error) {
    logger.error(error);
    process.exit(1);
  }
};
