import app from "./app";
import { config } from "./config";
import { connectDB } from "./db";
import logger from "./logger";

async function main() {
  await connectDB();

  app.listen(config.port, () => {
    logger.info(`Server is running on port ${config.port}`);
  });
}

main();
