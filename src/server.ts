import app from "./app";
import { config } from "./config";
import { connectDB, disconnectDB } from "./db.js";
import { connectRedis, disconnectRedis } from "./utils/redisClient.js";
import logger from "./logger.js";

async function main() {
  await connectDB();
  await connectRedis();

  const server = app.listen(config.port, () => {
    logger.info(`Server is running on port ${config.port}`);
  });

  // Handle graceful shutdown
  const shutdown = async () => {
    logger.info("Shutting down server...");
    server.close(async () => {
      await disconnectDB();
      await disconnectRedis();
      logger.info("Server shut down gracefully");
      process.exit(0);
    });
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

main();
