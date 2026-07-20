const joi = require("joi");

const localeParam = joi.string().valid("id", "en", "uz").default("id");

const topicIdParamType = joi.object({
  // Accept UUID or slug so public hub routes can resolve /topics/:slug.
  id: joi.string().trim().min(1).max(120).required(),
  lang: localeParam,
});

const listTopicParamType = joi.object({
  page: joi.number().integer().min(1).default(1),
  limit: joi.number().integer().min(1).max(100).default(20),
  search: joi.string().trim().max(100).allow("").default(""),
  lang: localeParam,
});

module.exports = {
  topicIdParamType,
  listTopicParamType,
};
