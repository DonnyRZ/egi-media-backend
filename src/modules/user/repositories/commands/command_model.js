const joi = require("joi");

const updateUserParamType = joi.object({
  id: joi.string().uuid().required(),
  full_name: joi.string().max(150).optional(),
  role: joi
    .string()
    .valid("superadmin", "author", "member", "visitor")
    .optional(),
});

const deleteUserParamType = joi.object({
  id: joi.string().uuid().required(),
});

const followParamType = joi.object({
  id: joi.string().uuid().required(),        // author_id dari path param
  follower_id: joi.string().uuid().required(), // user yang login (dari token)
});

module.exports = {
  updateUserParamType,
  deleteUserParamType,
  followParamType,
};
