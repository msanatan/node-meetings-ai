import app from "./app";
import { connectDB } from "./db";
import logger from "./logger";

const PORT = process.env.PORT || 3000;

async function main() {
  await connectDB();

  app.listen(PORT, () => {
    logger.info(`Server is running on port ${PORT}`);
  });
}

main();
