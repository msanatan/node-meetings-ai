import dotenv from "dotenv";

dotenv.config();

interface IConfig {
  environment: string;
  port: number;
  mongoUri: string;
  jwtSecret: string;
  jwtExpiration: string;
  logLevel: string;
}

export const config: IConfig = {
  environment: process.env.NODE_ENV || "development",
  port: parseInt(process.env.PORT || "3000", 10),
  mongoUri: process.env.MONGO_URI || "mongodb://localhost:27017/meetingbot",
  jwtSecret: process.env.JWT_SECRET || "secret",
  jwtExpiration: process.env.JWT_EXPIRATION || "1h",
  logLevel: process.env.LOG_LEVEL || "info",
};
