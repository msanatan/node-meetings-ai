import { createClient } from "redis";
import { config } from "../config";
import logger from "../logger";

export const redisClient = createClient({
  socket: {
    host: config.redisHost,
    port: config.redisPort,
  },
  password: config.redisPassword || undefined,
});

redisClient.on("error", (err) => logger.error("Redis Client Error", err));

export const connectRedis = async () => {
  if (config.environment === "test") {
    logger.info("Skipping Redis connection in test environment");
    return;
  }
  try {
    await redisClient.connect();
    logger.info("Connected to Redis");
  } catch (error) {
    logger.error("Could not connect to Redis", error);
    process.exit(1);
  }
};

export const disconnectRedis = async () => {
  if (config.environment === "test") {
    logger.info("Skipping Redis disconnect in test environment");
    return;
  }
  try {
    await redisClient.disconnect();
    logger.info("Disconnected from Redis");
  } catch (error) {
    logger.error("Error disconnecting from Redis", error);
  }
};
