const joi = require("joi");

const createTranslationEntry = joi.object({
  name: joi.string().trim().max(100).allow("", null).optional(),
  description: joi.string().trim().allow("", null).optional(),
});

const updateTranslationEntry = joi
  .object({
    name: joi.string().trim().max(100).allow("", null).optional(),
    description: joi.string().trim().allow("", null).optional(),
  })
  .min(1);

const categoryPayload = {
  name: joi.string().trim().min(1).max(100).required(),
  description: joi.string().trim().allow("", null).optional(),
  translations: joi
    .object({
      en: createTranslationEntry.optional(),
      uz: createTranslationEntry.optional(),
    })
    .optional(),
};

const createCategoryParamType = joi.object(categoryPayload);
const updateCategoryParamType = joi.object({
  id: joi.string().uuid().required(),
  ...categoryPayload,
  translations: joi
    .object({
      en: updateTranslationEntry.optional(),
      uz: updateTranslationEntry.optional(),
    })
    .optional(),
});
const deleteCategoryParamType = joi.object({
  id: joi.string().uuid().required(),
});

const categoryTranslationRetryParamType = joi.object({
  id: joi.string().uuid().required(),
  locale: joi.string().valid("en", "uz").required(),
});

module.exports = {
  createCategoryParamType,
  updateCategoryParamType,
  deleteCategoryParamType,
  categoryTranslationRetryParamType,
};
