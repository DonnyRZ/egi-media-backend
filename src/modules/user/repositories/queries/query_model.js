const joi = require("joi");

const getUsersParamType = joi.object({
  page: joi.number().integer().min(1).default(1),
  limit: joi.number().integer().min(1).max(100).default(20),
  search: joi.string().optional().allow("", null),
  role: joi
    .string()
    .valid("superadmin", "author", "member", "visitor")
    .optional()
    .allow("", null),
});

const getUserByIdParamType = joi.object({
  id: joi.string().uuid().required(),
});

const getFollowersParamType = joi.object({
  id: joi.string().uuid().required(),
  page: joi.number().integer().min(1).default(1),
  limit: joi.number().integer().min(1).max(100).default(20),
});

module.exports = {
  getUsersParamType,
  getUserByIdParamType,
  getFollowersParamType,
};
