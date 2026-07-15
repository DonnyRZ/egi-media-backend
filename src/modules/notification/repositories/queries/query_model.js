const joi = require("joi");

const listNotificationParamType = joi.object({
  user_id: joi.string().uuid().required(),
  page: joi.number().integer().min(1).default(1),
  limit: joi.number().integer().min(1).max(100).default(20),
  status: joi.string().valid("pending", "sent", "read", "failed").optional(),
  channel: joi.string().valid("in_app", "email").optional(),
});

module.exports = {
  listNotificationParamType,
};
