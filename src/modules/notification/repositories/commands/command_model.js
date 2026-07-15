const joi = require("joi");

const markReadParamType = joi.object({
  id: joi.string().uuid().required(),
  user_id: joi.string().uuid().required(),
});

const markAllReadParamType = joi.object({
  user_id: joi.string().uuid().required(),
});

module.exports = {
  markReadParamType,
  markAllReadParamType,
};
