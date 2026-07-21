const joi = require("joi");

// Indonesian (id) is the primary language and lives in the top-level fields.
// English (en) and Uzbek (uz) are optional. A translation is meaningful when it
// has a name; description remains optional per locale.
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

const newsletterPayload = {
  name: joi.string().trim().min(1).max(150).required(),
  description: joi.string().trim().allow("", null).optional(),
  frequency: joi.string().valid("daily", "weekly", "monthly").required(),
  is_active: joi.boolean().default(true).optional(),
  translations: joi
    .object({
      en: createTranslationEntry.optional(),
      uz: createTranslationEntry.optional(),
    })
    .optional(),
};

const createNewsletterParamType = joi.object({
  ...newsletterPayload,
});

const updateNewsletterParamType = joi.object({
  id: joi.string().uuid().required(),
  ...newsletterPayload,
  is_active: joi.boolean().required(),
  translations: joi
    .object({
      en: updateTranslationEntry.optional(),
      uz: updateTranslationEntry.optional(),
    })
    .optional(),
});

const deleteNewsletterParamType = joi.object({
  id: joi.string().uuid().required(),
});

const addArticleParamType = joi.object({
  id: joi.string().uuid().required(), // newsletter_id
  article_id: joi.string().uuid().required(),
  display_order: joi.number().integer().min(0).default(0).optional(),
});

const removeArticleParamType = joi.object({
  id: joi.string().uuid().required(), // newsletter_id
  article_id: joi.string().uuid().required(),
});

const subscribeNewsletterParamType = joi.object({
  id: joi.string().uuid().required(), // newsletter_id
  user_id: joi.string().uuid().required(),
});

module.exports = {
  createNewsletterParamType,
  updateNewsletterParamType,
  deleteNewsletterParamType,
  addArticleParamType,
  removeArticleParamType,
  subscribeNewsletterParamType,
};
