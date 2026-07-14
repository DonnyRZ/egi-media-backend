const joi = require("joi");

const seriesPayload = {
  name: joi.string().trim().min(1).max(150).required(),
  description: joi.string().trim().allow("", null).optional(),
};

const createSeriesParamType = joi.object({
  author_id: joi.string().uuid().required(),
  ...seriesPayload,
});

const updateSeriesParamType = joi.object({
  id: joi.string().uuid().required(),
  actor_id: joi.string().uuid().required(),
  actor_role: joi.string().valid("author", "superadmin").required(),
  ...seriesPayload,
});

const deleteSeriesParamType = joi.object({
  id: joi.string().uuid().required(),
});

module.exports = {
  createSeriesParamType,
  updateSeriesParamType,
  deleteSeriesParamType,
};
