import { redisClient } from "./redisClient.js";
import logger from "../logger.js";
import { config } from "../config.js";

export const getCache = async (key: string): Promise<string | null> => {
  if (config.environment === "test") {
    logger.info("Skipping Redis cache in test environment");
    return null;
  }
  try {
    const data = await redisClient.get(key);
    if (data) {
      logger.info(`Cache hit for key: ${key}`);
    } else {
      logger.info(`Cache miss for key: ${key}`);
    }
    return data;
  } catch (error) {
    logger.error(`Error getting cache for key ${key}:`, error);
    return null;
  }
};

export const setCache = async (
  key: string,
  value: string,
  ttl: number
): Promise<void> => {
  if (config.environment === "test") {
    logger.info("Skipping Redis cache in test environment");
    return;
  }
  try {
    await redisClient.set(key, value, { EX: ttl });
    logger.info(`Cache set for key: ${key} with TTL: ${ttl} seconds`);
  } catch (error) {
    logger.error(`Error setting cache for key ${key}:`, error);
  }
};
