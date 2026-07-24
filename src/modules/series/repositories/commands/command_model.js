const joi = require("joi");

// Indonesian (id) is the primary language and lives in the top-level fields.
// English (en) and Uzbek (uz) are optional. A translation is meaningful when it
// has a name; description remains optional per locale. Slug is generated server-side.
const createTranslationEntry = joi.object({
  name: joi.string().trim().min(1).max(150).required(),
  description: joi.string().trim().allow("", null).optional(),
});

const updateTranslationEntry = joi
  .object({
    name: joi.string().trim().min(1).max(150).optional(),
    description: joi.string().trim().allow("", null).optional(),
  })
  .min(1);

const seriesPayload = {
  name: joi.string().trim().min(1).max(150).required(),
  description: joi.string().trim().allow("", null).optional(),
  // Shared across locales — one image for id/en/uz.
  image: joi.string().uri().optional().allow(null, ""),
  topic_id: joi.string().uuid().required(),
};

const createSeriesParamType = joi.object({
  author_id: joi.string().uuid().required(),
  ...seriesPayload,
  translations: joi
    .object({
      en: createTranslationEntry.optional(),
      uz: createTranslationEntry.optional(),
    })
    .optional(),
});

const updateSeriesParamType = joi.object({
  id: joi.string().uuid().required(),
  actor_id: joi.string().uuid().required(),
  actor_role: joi.string().valid("author", "superadmin").required(),
  ...seriesPayload,
  translations: joi
    .object({
      en: updateTranslationEntry.optional(),
      uz: updateTranslationEntry.optional(),
    })
    .optional(),
});

const deleteSeriesParamType = joi.object({
  id: joi.string().uuid().required(),
});

module.exports = {
  createSeriesParamType,
  updateSeriesParamType,
  deleteSeriesParamType,
};
