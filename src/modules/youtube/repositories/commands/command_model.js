const joi = require("joi");

const videoPayload = {
  title: joi.string().trim().max(255).required(),
  description: joi.string().trim().allow("", null).optional(),
  url: joi.string().uri().required(),
};

const createVideoParamType = joi.object({
  ...videoPayload,
});

const updateVideoParamType = joi.object({
  id: joi.string().uuid().required(),
  ...videoPayload,
});

const deleteVideoParamType = joi.object({
  id: joi.string().uuid().required(),
});

module.exports = {
  createVideoParamType,
  updateVideoParamType,
  deleteVideoParamType,
};
