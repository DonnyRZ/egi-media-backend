const queryHandler = require("../repositories/queries/query_handler");
const queryModel = require("../repositories/queries/query_model");
const commandHandler = require("../repositories/commands/command_handler");
const commandModel = require("../repositories/commands/command_model");
const validator = require("../../../helpers/utils/validator");
const {
  paginationResponse,
  sendResponse,
} = require("../../../helpers/utils/response");
const { SUCCESS } = require("../../../helpers/http-status/status_code");

const listTeamMembers = async (req, res) => {
  const payload = validator.isValidPayload(
    req.query,
    queryModel.listMembersParamType
  );
  if (payload.err) return sendResponse(payload, res);
  return paginationResponse(
    await queryHandler.listTeamMembers(payload.data),
    res
  );
};

const getTeamMember = async (req, res) => {
  const payload = validator.isValidPayload(
    { id: req.params.id },
    queryModel.getMemberParamType
  );
  if (payload.err) return sendResponse(payload, res);
  return sendResponse(await queryHandler.getTeamMember(payload.data), res);
};

const addTeamMember = async (req, res) => {
  const payload = validator.isValidPayload(
    req.body,
    commandModel.createMemberParamType
  );
  if (payload.err) return sendResponse(payload, res);
  return sendResponse(
    await commandHandler.addTeamMember(payload.data),
    res,
    SUCCESS.CREATED
  );
};

const updateTeamMember = async (req, res) => {
  const payload = validator.isValidPayload(
    { ...req.body, id: req.params.id },
    commandModel.updateMemberParamType
  );
  if (payload.err) return sendResponse(payload, res);
  return sendResponse(
    await commandHandler.updateTeamMember(payload.data),
    res
  );
};

const deleteTeamMember = async (req, res) => {
  const payload = validator.isValidPayload(
    req.params,
    commandModel.deleteMemberParamType
  );
  if (payload.err) return sendResponse(payload, res);
  return sendResponse(
    await commandHandler.deleteTeamMember(payload.data),
    res
  );
};

module.exports = {
  listTeamMembers,
  getTeamMember,
  addTeamMember,
  updateTeamMember,
  deleteTeamMember,
};
