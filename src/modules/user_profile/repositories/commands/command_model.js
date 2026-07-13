const joi = require("joi");

const updateUserProfileParamType = joi.object({
  user_id: joi.string().required(),
  avatar_url: joi.string().uri().allow("", null).optional(),
  bio: joi.string().allow("", null).optional(),
  industry: joi.string().max(150).allow("", null).optional(),
  job_title: joi.string().max(150).allow("", null).optional(),
  seniority: joi.string().max(100).allow("", null).optional(),
  company: joi.string().max(150).allow("", null).optional(),
  country: joi.string().max(100).allow("", null).optional(),
});

module.exports = {
  updateUserProfileParamType,
};
