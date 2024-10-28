import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

const payload = { sub: process.argv[3] };
const secret = process.env.JWT_SECRET!;
const token = jwt.sign(payload, secret, { expiresIn: "1h" });

console.log(`Generated JWT:\n${token}\n`);
