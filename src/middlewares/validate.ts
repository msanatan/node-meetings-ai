import { Request, Response, NextFunction } from "express";
import Joi from "joi";

export interface ValidationSchema {
  body?: Joi.ObjectSchema;
  query?: Joi.ObjectSchema;
  params?: Joi.ObjectSchema;
}

export const validate = (schema: ValidationSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const validationOptions = {
      abortEarly: false,
      allowUnknown: true,
      stripUnknown: true,
    };

    if (schema.body) {
      const { error, value } = schema.body.validate(
        req.body,
        validationOptions
      );
      if (error) {
        const errorDetails = error.details.map((detail) => detail.message);
        res.status(400).json({ errors: errorDetails });
        return;
      }
      req.body = value;
    }

    if (schema.query) {
      const { error, value } = schema.query.validate(
        req.query,
        validationOptions
      );
      if (error) {
        const errorDetails = error.details.map((detail) => detail.message);
        res.status(400).json({ errors: errorDetails });
        return;
      }
      req.query = value;
    }

    if (schema.params) {
      const { error, value } = schema.params.validate(
        req.params,
        validationOptions
      );
      if (error) {
        const errorDetails = error.details.map((detail) => detail.message);
        res.status(400).json({ errors: errorDetails });
        return;
      }
      req.params = value;
    }

    next();
  };
};
