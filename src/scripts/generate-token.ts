import dotenv from "dotenv";
import { generateToken } from "../utils/token";

dotenv.config();

const token = generateToken(process.argv[3], process.env.JWT_SECRET!);
console.log(`Generated JWT:\n${token}\n`);
