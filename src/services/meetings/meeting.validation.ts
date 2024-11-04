import Joi from "joi";

export const createMeetingSchema = Joi.object({
  title: Joi.string().min(1).required().messages({
    "string.base": `"title" should be text/string`,
    "string.empty": `"title" cannot be empty`,
  }),
  date: Joi.date().iso().required().messages({
    "date.base": `"date" is invalid`,
    "date.format": `"date" should be in ISO 8601 date format`,
  }),
  participants: Joi.array()
    .items(Joi.string().min(1))
    .min(1)
    .required()
    .messages({
      "array.base": `"participants" should be an array`,
      "array.min": `"participants" must contain at least one participant`,
      "string.base": `"participants" should contain only text`,
    }),
});

export const updateTranscriptSchema = Joi.object({
  transcript: Joi.string().min(1).required().messages({
    "string.base": `"transcript" should be text/string'`,
    "string.empty": `"transcript" cannot be empty`,
  }),
  endDate: Joi.date().iso().required().messages({
    "date.base": `"endDate" is invalid`,
    "date.format": `"endDate" should be in ISO 8601 date format`,
  }),
});
