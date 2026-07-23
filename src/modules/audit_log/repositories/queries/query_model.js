const joi = require("joi");

const listAuditLogsParamType = joi.object({
  page: joi.number().integer().min(1).default(1),
  limit: joi.number().integer().min(1).max(100).default(20),
  user_id: joi.string().uuid().optional().allow("", null),
  table_name: joi.string().trim().optional().allow("", null),
  action: joi
    .string()
    .valid(
      "INSERT",
      "CREATE",
      "UPDATE",
      "DELETE",
      "TRASHED",
      "STATUS_CHANGE",
      "ARCHIVED",
      "RESTORED",
      "PUBLISHED",
      "SCHEDULED",
      "SUBMITTED_FOR_REVIEW",
      "REVERTED_TO_DRAFT",
    )
    .optional()
    .allow("", null),
  from: joi.string().isoDate().optional().allow("", null),
  to: joi.string().isoDate().optional().allow("", null),
});

const getAuditLogParamType = joi.object({
  id: joi.string().uuid().required(),
});

module.exports = {
  listAuditLogsParamType,
  getAuditLogParamType,
};
