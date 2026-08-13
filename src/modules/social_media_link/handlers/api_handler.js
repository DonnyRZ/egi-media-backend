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

const listSocialMediaLinks = async (req, res) => {
  const payload = validator.isValidPayload(
    req.query,
    queryModel.listLinksParamType
  );
  if (payload.err) return sendResponse(payload, res);
  return paginationResponse(
    await queryHandler.listSocialMediaLinks(payload.data),
    res
  );
};

const getSocialMediaLink = async (req, res) => {
  const payload = validator.isValidPayload(
    { id: req.params.id },
    queryModel.getLinkParamType
  );
  if (payload.err) return sendResponse(payload, res);
  return sendResponse(await queryHandler.getSocialMediaLink(payload.data), res);
};

const addSocialMediaLink = async (req, res) => {
  const payload = validator.isValidPayload(
    req.body,
    commandModel.createLinkParamType
  );
  if (payload.err) return sendResponse(payload, res);
  return sendResponse(
    await commandHandler.addSocialMediaLink(payload.data),
    res,
    SUCCESS.CREATED
  );
};

const updateSocialMediaLink = async (req, res) => {
  const payload = validator.isValidPayload(
    { ...req.body, id: req.params.id },
    commandModel.updateLinkParamType
  );
  if (payload.err) return sendResponse(payload, res);
  return sendResponse(
    await commandHandler.updateSocialMediaLink(payload.data),
    res
  );
};

const deleteSocialMediaLink = async (req, res) => {
  const payload = validator.isValidPayload(
    req.params,
    commandModel.deleteLinkParamType
  );
  if (payload.err) return sendResponse(payload, res);
  return sendResponse(
    await commandHandler.deleteSocialMediaLink(payload.data),
    res
  );
};

module.exports = {
  listSocialMediaLinks,
  getSocialMediaLink,
  addSocialMediaLink,
  updateSocialMediaLink,
  deleteSocialMediaLink,
};
