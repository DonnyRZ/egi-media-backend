const joi = require("joi");

const ALLOWED_ICONS = ["youtube", "instagram", "tiktok", "spotify", "twitter"];

const linkPayload = {
  platform_name: joi.string().trim().max(100).required(),
  url: joi.string().uri({ scheme: ["http", "https"] }).required(),
  icon_name: joi
    .string()
    .trim()
    .valid(...ALLOWED_ICONS)
    .required(),
  is_active: joi.boolean().default(true),
  sort_order: joi.number().integer().min(0).max(9999).default(0),
};

const createLinkParamType = joi.object({
  ...linkPayload,
});

const updateLinkParamType = joi.object({
  id: joi.string().uuid().required(),
  ...linkPayload,
});

const deleteLinkParamType = joi.object({
  id: joi.string().uuid().required(),
});

module.exports = {
  ALLOWED_ICONS,
  createLinkParamType,
  updateLinkParamType,
  deleteLinkParamType,
};
