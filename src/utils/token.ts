import jwt from "jsonwebtoken";

export const generateToken = (
  userId: string,
  secret: string,
  expiresIn: string = "1h"
) => {
  return jwt.sign({ sub: userId }, secret, { expiresIn });
};
