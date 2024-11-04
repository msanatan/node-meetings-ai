import { config } from "../config";
import { generateToken } from "../utils/token";

const token = generateToken(
  process.argv[3],
  config.jwtSecret,
  config.jwtExpiration
);
console.log(`Generated JWT:\n${token}\n`);
