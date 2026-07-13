const joi = require("joi");

const categoryPayload = {
  name: joi.string().trim().min(1).max(100).required(),
  description: joi.string().trim().allow("", null).optional(),
};

const createCategoryParamType = joi.object(categoryPayload);
const updateCategoryParamType = joi.object({
  id: joi.string().uuid().required(),
  ...categoryPayload,
});
const deleteCategoryParamType = joi.object({
  id: joi.string().uuid().required(),
});

module.exports = {
  createCategoryParamType,
  updateCategoryParamType,
  deleteCategoryParamType,
};
