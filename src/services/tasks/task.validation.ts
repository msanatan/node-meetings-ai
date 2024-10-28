import Joi from "joi";

export const getTasksQuerySchema = Joi.object({
  limit: Joi.number().integer().min(1).max(100).default(10).messages({
    "number.base": `"limit" should be a number`,
    "number.integer": `"limit" should be an integer`,
    "number.min": `"limit" should be at least 1`,
    "number.max": `"limit" should not exceed 100`,
  }),
  page: Joi.number().integer().min(1).default(1).messages({
    "number.base": `"page" should be a number`,
    "number.integer": `"page" should be an integer`,
    "number.min": `"page" should be at least 1`,
  }),
});
