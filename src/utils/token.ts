import jwt from "jsonwebtoken";

export const generateToken = (userId: string, secret: string) => {
  return jwt.sign({ sub: userId }, secret, { expiresIn: "1h" });
};
