import { Request, Response, NextFunction } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";

export interface AuthenticatedRequest extends Request {
  userId?: string;
}

export const authMiddleware = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ message: "Authentication required" });
    return;
  }

  const token = authHeader.split(" ")[1];
  if (!token) {
    res.status(401).json({ message: "Authentication required" });
    return;
  }

  try {
    const verifiedToken = jwt.verify(token, process.env.JWT_SECRET as string);
    req.userId = (verifiedToken as JwtPayload).sub;
    // TODO: While verifying the token is a good step, we still should check if the user exists in the database
  } catch (err) {
    res.status(401).json({ message: "Invalid token" });
    return;
  }

  next();
};
