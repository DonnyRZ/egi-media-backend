const joi = require("joi");
const { PLACEMENTS } = require("../commands/command_model");

const listAdsParamType = joi.object({
  page: joi.number().integer().min(1).default(1),
  limit: joi.number().integer().min(1).max(100).default(20),
  search: joi.string().trim().max(100).allow("").default(""),
  active: joi
    .alternatives()
    .try(joi.boolean(), joi.string().valid("true", "false", "all"))
    .default("all"),
  placement: joi
    .alternatives()
    .try(joi.string().valid(...PLACEMENTS, "all"), joi.allow(""))
    .default("all"),
});

const getAdParamType = joi.object({
  id: joi.string().uuid().required(),
});

const listActiveByPlacementParamType = joi.object({
  placement: joi
    .string()
    .valid(...PLACEMENTS)
    .required(),
});

module.exports = {
  listAdsParamType,
  getAdParamType,
  listActiveByPlacementParamType,
};
