import dotenv from "dotenv";

dotenv.config();

interface IConfig {
  environment: string;
  port: number;
  mongoUri: string;
  jwtSecret: string;
  jwtExpiration: string;
  logLevel: string;
  redisHost: string;
  redisPort: number;
  redisPassword: string;
  MEETING_STATS_CACHE_TTL: number;
  DASHBOARD_STATS_CACHE_TTL: number;
}

export const config: IConfig = {
  environment: process.env.NODE_ENV || "development",
  port: parseInt(process.env.PORT || "3000", 10),
  mongoUri: process.env.MONGO_URI || "mongodb://localhost:27017/meetingbot",
  jwtSecret: process.env.JWT_SECRET || "secret",
  jwtExpiration: process.env.JWT_EXPIRATION || "1h",
  logLevel: process.env.LOG_LEVEL || "info",
  redisHost: process.env.REDIS_HOST || "redis",
  redisPort: parseInt(process.env.REDIS_PORT || "6379", 10),
  redisPassword: process.env.REDIS_PASSWORD || "",
  MEETING_STATS_CACHE_TTL: parseInt(
    process.env.MEETING_STATS_CACHE_TTL || "3600",
    10
  ),
  DASHBOARD_STATS_CACHE_TTL: parseInt(
    process.env.DASHBOARD_STATS_CACHE_TTL || "3600",
    10
  ),
};
