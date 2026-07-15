const joi = require("joi");

const listVideosParamType = joi.object({
  page: joi.number().integer().min(1).default(1),
  limit: joi.number().integer().min(1).max(100).default(20),
  search: joi.string().trim().max(100).allow("").default(""),
});

const getVideoParamType = joi.object({
  id: joi.string().uuid().required(),
});

module.exports = {
  listVideosParamType,
  getVideoParamType,
};
