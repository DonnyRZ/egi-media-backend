const joi = require("joi");

const getUserProfileParamType = joi.object({
  user_id: joi.string().required(),
});

module.exports = {
  getUserProfileParamType,
};
