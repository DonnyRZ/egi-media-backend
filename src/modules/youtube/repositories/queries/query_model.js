const joi = require("joi");

// Supported content locales. `id` (Indonesian) is the primary/default language.
const localeParam = joi.string().valid("id", "en", "uz").default("id");

const listVideosParamType = joi.object({
  page: joi.number().integer().min(1).default(1),
  limit: joi.number().integer().min(1).max(100).default(20),
  format: joi.string().valid("horizontal", "short"),
  category_id: joi.string().uuid(),
  program_id: joi.string().uuid(),
  collection_id: joi.string().uuid(),
  search: joi.string().trim().max(100).allow("").default(""),
  // true = active only (public default), false = inactive only, all = CMS admin list
  active: joi
    .alternatives()
    .try(
      joi.boolean(),
      joi.string().valid("true", "false", "all"),
    )
    .default(true),
  lang: localeParam,
});

const getVideoParamType = joi.object({
  id: joi.string().uuid().required(),
  lang: localeParam,
});

module.exports = {
  listVideosParamType,
  getVideoParamType,
};
