const joi = require("joi");

/** Active public / CMS ad placements. */
const PLACEMENTS = [
  "LEADERBOARD",
  "HERO_BELOW",
  "IN_FEED",
  "SIDEBAR_RECTANGLE",
  "LATEST_VIDEOS",
];

const imageUrl = joi
  .string()
  .trim()
  .min(1)
  .max(2000)
  .custom((value, helpers) => {
    if (/^https?:\/\//i.test(value) || value.startsWith("/")) {
      return value;
    }
    return helpers.error("any.invalid");
  }, "image url")
  .messages({
    "any.invalid": "image_url must be an http(s) URL or a site-relative path",
  });

const adPayload = {
  title: joi.string().trim().max(200).required(),
  image_url: imageUrl.required(),
  target_url: joi.string().trim().uri({ scheme: ["http", "https"] }).max(2000).required(),
  placement: joi
    .string()
    .valid(...PLACEMENTS)
    .required(),
  is_active: joi.boolean().default(true),
};

const createAdParamType = joi.object({
  ...adPayload,
});

const updateAdParamType = joi.object({
  id: joi.string().uuid().required(),
  title: adPayload.title,
  image_url: imageUrl.allow("").required(),
  target_url: joi.string().trim().uri({ scheme: ["http", "https"] }).max(2000).allow("").required(),
  image_receipt: joi.string().max(6000).allow("", null).optional(),
  is_active: adPayload.is_active,
  placement: joi.string().valid(...PLACEMENTS).optional(),
});

const deleteAdParamType = joi.object({
  id: joi.string().uuid().required(),
});

const trackAdParamType = joi.object({
  id: joi.string().uuid().required(),
});

module.exports = {
  PLACEMENTS,
  createAdParamType,
  updateAdParamType,
  deleteAdParamType,
  trackAdParamType,
};
