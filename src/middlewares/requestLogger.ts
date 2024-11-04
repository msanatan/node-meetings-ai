import { Request, Response, NextFunction } from "express";
import logger from "../logger";

export const requestLogger = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  logger.info({
    message: "Incoming Request",
    method: req.method,
    url: req.url,
    body: req.body,
    params: req.params,
    query: req.query,
  });
  next();
  logger.debug({
    message: "Outgoing Response",
    status: res.statusCode,
    method: req.method,
    url: req.url,
    body: req.body,
    params: req.params,
    query: req.query,
  });
};
