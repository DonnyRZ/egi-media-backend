const joi = require("joi");

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
  url: joi.string().uri().required(),
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
  url: joi.string().uri().required(),
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
