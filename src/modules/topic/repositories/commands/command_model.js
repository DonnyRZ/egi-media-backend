const joi = require("joi");

const topicPayload = {
  name: joi.string().trim().min(1).max(100).required(),
  description: joi.string().trim().allow("", null).optional(),
};

const createTopicParamType = joi.object(topicPayload);
const updateTopicParamType = joi.object({
  id: joi.string().uuid().required(),
  ...topicPayload,
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
