const joi = require("joi");

const photoUrl = joi
  .string()
  .trim()
  .min(1)
  .max(2000)
  .custom((value, helpers) => {
    if (/^https?:\/\//i.test(value) || value.startsWith("/")) {
      return value;
    }
    return helpers.error("any.invalid");
  }, "photo url")
  .messages({
    "any.invalid": "photo_url must be an http(s) URL or a site-relative path",
  });

const memberPayload = {
  name: joi.string().trim().max(150).required(),
  role: joi.string().trim().max(200).required(),
  bio: joi.string().trim().max(2000).allow("", null).optional(),
  photo_url: photoUrl.required(),
  is_active: joi.boolean().default(true),
  sort_order: joi.number().integer().min(0).max(9999).default(0),
};

const createMemberParamType = joi.object({
  ...memberPayload,
});

const updateMemberParamType = joi.object({
  id: joi.string().uuid().required(),
  ...memberPayload,
});

const deleteMemberParamType = joi.object({
  id: joi.string().uuid().required(),
});

module.exports = {
  createMemberParamType,
  updateMemberParamType,
  deleteMemberParamType,
};
