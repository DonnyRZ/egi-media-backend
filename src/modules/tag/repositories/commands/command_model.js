const joi = require("joi");
const createTagParamType = joi.object({ name: joi.string().trim().min(1).max(100).required() });
const deleteTagParamType = joi.object({ id: joi.string().uuid().required() });
module.exports = { createTagParamType, deleteTagParamType };
