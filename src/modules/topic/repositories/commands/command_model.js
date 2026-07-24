const joi = require("joi");

const createTranslationEntry = joi.object({
  name: joi.string().trim().min(1).max(100).required(),
  description: joi.string().trim().allow("", null).optional(),
});

const updateTranslationEntry = joi
  .object({
    name: joi.string().trim().min(1).max(100).optional(),
    description: joi.string().trim().allow("", null).optional(),
  })
  .min(1);

const topicPayload = {
  name: joi.string().trim().min(1).max(100).required(),
  description: joi.string().trim().allow("", null).optional(),
  category_id: joi.string().uuid().required(),
  translations: joi
    .object({
      en: createTranslationEntry.optional(),
      uz: createTranslationEntry.optional(),
    })
    .optional(),
};

const createTopicParamType = joi.object(topicPayload);
const updateTopicParamType = joi.object({
  id: joi.string().uuid().required(),
  ...topicPayload,
  translations: joi
    .object({
      en: updateTranslationEntry.optional(),
      uz: updateTranslationEntry.optional(),
    })
    .optional(),
});
const topicIdParamType = joi.object({
  id: joi.string().uuid().required(),
});
const followTopicParamType = joi.object({
  id: joi.string().uuid().required(),
  user_id: joi.string().uuid().required(),
});

module.exports = {
  createTopicParamType,
  updateTopicParamType,
  topicIdParamType,
  followTopicParamType,
};
