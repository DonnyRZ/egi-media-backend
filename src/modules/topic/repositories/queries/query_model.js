const joi = require("joi");

const topicIdParamType = joi.object({
  id: joi.string().uuid().required(),
});

const listTopicParamType = joi.object({
  page: joi.number().integer().min(1).default(1),
  limit: joi.number().integer().min(1).max(100).default(20),
  search: joi.string().trim().max(100).allow("").default(""),
});

module.exports = {
  topicIdParamType,
  listTopicParamType,
};
