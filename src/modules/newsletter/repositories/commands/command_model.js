const joi = require("joi");

const newsletterPayload = {
  name: joi.string().trim().min(1).max(150).required(),
  description: joi.string().trim().allow("", null).optional(),
  frequency: joi.string().valid("daily", "weekly", "monthly").required(),
  is_active: joi.boolean().default(true).optional(),
};

const createNewsletterParamType = joi.object({
  ...newsletterPayload,
});

const updateNewsletterParamType = joi.object({
  id: joi.string().uuid().required(),
  ...newsletterPayload,
  is_active: joi.boolean().required(),
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
