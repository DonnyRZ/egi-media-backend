const joi = require("joi");

const localeParam = joi.string().valid("id", "en", "uz").default("id");

const listMyTopicsParamType = joi.object({
  user_id: joi.string().uuid().required(),
  lang: localeParam,
});

const listTopicCatalogParamType = joi.object({
  lang: localeParam,
});

const topicSubscribersParamType = joi.object({
  topic_id: joi.string().uuid().required(),
});

module.exports = {
  listMyTopicsParamType,
  listTopicCatalogParamType,
  topicSubscribersParamType,
};
