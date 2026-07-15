const queryHandler = require("../repositories/queries/query_handler");
const queryModel = require("../repositories/queries/query_model");
const validator = require("../../../helpers/utils/validator");
const { paginationResponse, sendResponse } = require("../../../helpers/utils/response");

const listAuditLogs = async (req, res) => {
  const payload = validator.isValidPayload(req.query, queryModel.listAuditLogsParamType);
  if (payload.err) return sendResponse(payload, res);
  return paginationResponse(await queryHandler.listAuditLogs(payload.data), res);
};

const getAuditLog = async (req, res) => {
  const payload = validator.isValidPayload(req.params, queryModel.getAuditLogParamType);
  if (payload.err) return sendResponse(payload, res);
  return sendResponse(await queryHandler.getAuditLog(payload.data), res);
};

module.exports = {
  listAuditLogs,
  getAuditLog,
};
