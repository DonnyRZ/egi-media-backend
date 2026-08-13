const joi = require("joi");

const listMembersParamType = joi.object({
  page: joi.number().integer().min(1).default(1),
  limit: joi.number().integer().min(1).max(100).default(20),
  search: joi.string().trim().max(100).allow("").default(""),
  active: joi
    .alternatives()
    .try(joi.boolean(), joi.string().valid("true", "false", "all"))
    .default(true),
});

const getMemberParamType = joi.object({
  id: joi.string().uuid().required(),
});

module.exports = {
  listMembersParamType,
  getMemberParamType,
};
