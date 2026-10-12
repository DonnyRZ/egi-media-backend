const joi = require("joi");
const { extractYoutubeId } = require("../../../../helpers/utils/youtube");
const youtubeUrl = joi.string().uri().custom((value, helpers) => extractYoutubeId(value) ? value : helpers.error("any.invalid"));
const metadata = {
  format: joi.string().valid("horizontal", "short"),
  poster_landscape: joi.string().uri({scheme:["http","https"]}).allow("", null),
  poster_portrait: joi.string().uri({scheme:["http","https"]}).allow("", null),
  duration_seconds: joi.number().integer().min(1).allow(null),
  category_id: joi.string().uuid().allow(null),
  program_id: joi.string().uuid().allow(null),
  episode_number: joi.number().integer().min(1).allow(null),
};

// Indonesian (id) is the primary language and lives in the top-level fields.
// English (en) and Uzbek (uz) are optional. A translation is meaningful when it
// has a title; description remains optional per locale.
const createTranslationEntry = joi.object({
  title: joi.string().trim().max(255).required(),
  description: joi.string().trim().allow("", null).optional(),
});

const updateTranslationEntry = joi
  .object({
    title: joi.string().trim().max(255).optional(),
    description: joi.string().trim().allow("", null).optional(),
  })
  .min(1);

const videoPayload = {
  title: joi.string().trim().max(255).required(),
  description: joi.string().trim().allow("", null).optional(),
  url: youtubeUrl.required(),
  ...metadata,
  is_active: joi.boolean().default(true),
  translations: joi
    .object({
      en: createTranslationEntry.optional(),
      uz: createTranslationEntry.optional(),
    })
    .optional(),
};

const createVideoParamType = joi.object({
  ...videoPayload,
});

const updateVideoParamType = joi.object({
  id: joi.string().uuid().required(),
  title: joi.string().trim().max(255).required(),
  description: joi.string().trim().allow("", null).optional(),
  url: youtubeUrl.required(),
  ...metadata,
  is_active: joi.boolean().default(true),
  translations: joi
    .object({
      en: updateTranslationEntry.optional(),
      uz: updateTranslationEntry.optional(),
    })
    .optional(),
});

const deleteVideoParamType = joi.object({
  id: joi.string().uuid().required(),
});

module.exports = {
  createVideoParamType,
  updateVideoParamType,
  deleteVideoParamType,
};
