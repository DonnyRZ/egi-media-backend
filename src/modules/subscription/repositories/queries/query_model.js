const joi = require("joi");

const subscriptionHistoryParamType = joi.object({
  user_id: joi.string().uuid().required(),
  page: joi.number().integer().min(1).default(1),
  limit: joi.number().integer().min(1).max(100).default(20),
});

const activeSubscriptionParamType = joi.object({
  user_id: joi.string().uuid().required(),
});

module.exports = {
  subscriptionHistoryParamType,
  activeSubscriptionParamType,
};
