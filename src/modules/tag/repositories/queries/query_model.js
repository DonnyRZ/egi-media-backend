const joi = require("joi");
const listTagParamType = joi.object({ page: joi.number().integer().min(1).default(1), limit: joi.number().integer().min(1).max(100).default(20), search: joi.string().trim().max(100).allow("").default("") });
module.exports = { listTagParamType };
