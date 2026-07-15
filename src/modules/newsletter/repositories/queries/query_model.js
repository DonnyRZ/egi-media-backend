const joi = require("joi");

const listNewslettersParamType = joi.object({
  page: joi.number().integer().min(1).default(1),
  limit: joi.number().integer().min(1).max(100).default(20),
});

const getNewsletterParamType = joi.object({
  id: joi.string().uuid().required(),
});

module.exports = {
  listNewslettersParamType,
  getNewsletterParamType,
};
