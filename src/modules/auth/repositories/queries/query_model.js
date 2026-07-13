const joi = require("joi");

const getMeParamType = joi.object({
  user_id: joi.string().required(),
});

module.exports = {
  getMeParamType,
};
