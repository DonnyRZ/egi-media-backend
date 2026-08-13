const joi = require("joi");

const createDemoRequestParamType = joi.object({
  full_name: joi.string().trim().min(2).max(120).required(),
  company_name: joi.string().trim().min(2).max(160).required(),
  job_title: joi.string().trim().min(2).max(120).required(),
  work_email: joi.string().trim().email().max(254).required(),
  phone: joi.string().trim().max(40).allow("", null).optional(),
  message: joi.string().trim().max(2000).allow("", null).optional(),
  website: joi.string().trim().max(200).allow("", null).optional(),
});

module.exports = {
  createDemoRequestParamType,
};
