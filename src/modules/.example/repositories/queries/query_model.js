const joi = require("joi");

const getUserByIdParamType = joi.object({
  id: joi.string().required(),
});

module.exports = {
  getUserByIdParamType,
};
