import { createLogger, format, transports } from "winston";
import { config } from "./config";

const logger = createLogger({
  level: config.logLevel,
  format: format.combine(
    format.timestamp(),
    format.errors({ stack: true }),
    format.json()
  ),
  transports: [new transports.Console()],
});

export default logger;
