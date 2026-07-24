const joi = require("joi");

const subscribeTopicParamType = joi.object({
  id: joi.string().uuid().required(),
  user_id: joi.string().uuid().required(),
});

module.exports = {
  subscribeTopicParamType,
};
