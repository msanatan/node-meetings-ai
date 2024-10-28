import Joi from "joi";

export const createMeetingSchema = Joi.object({
  title: Joi.string().min(1).required().messages({
    "string.base": `"title" should be a type of 'text'`,
    "string.empty": `"title" cannot be an empty field`,
    "any.required": `"title" is a required field`,
  }),
  date: Joi.date().iso().required().messages({
    "date.base": `"date" should be a valid date`,
    "date.format": `"date" should be in ISO 8601 date format`,
    "any.required": `"date" is a required field`,
  }),
  participants: Joi.array()
    .items(Joi.string().min(1))
    .min(1)
    .required()
    .messages({
      "array.base": `"participants" should be an array`,
      "array.min": `"participants" must contain at least one participant`,
      "string.base": `"participants" should contain only text`,
      "any.required": `"participants" is a required field`,
    }),
});

export const updateTranscriptSchema = Joi.object({
  transcript: Joi.string().min(1).required().messages({
    "string.base": `"transcript" should be a type of 'text'`,
    "string.empty": `"transcript" cannot be an empty field`,
    "any.required": `"transcript" is a required field`,
  }),
});
