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

const listAds = async (req, res) => {
  const payload = validator.isValidPayload(
    req.query,
    queryModel.listAdsParamType
  );
  if (payload.err) return sendResponse(payload, res);
  return paginationResponse(await queryHandler.listAds(payload.data), res);
};

const getAd = async (req, res) => {
  const payload = validator.isValidPayload(
    { id: req.params.id },
    queryModel.getAdParamType
  );
  if (payload.err) return sendResponse(payload, res);
  return sendResponse(await queryHandler.getAd(payload.data), res);
};

const listActiveByPlacement = async (req, res) => {
  const payload = validator.isValidPayload(
    { placement: req.query.placement },
    queryModel.listActiveByPlacementParamType
  );
  if (payload.err) return sendResponse(payload, res);
  return sendResponse(
    await queryHandler.listActiveByPlacement(payload.data),
    res
  );
};

const addAd = async (req, res) => {
  const payload = validator.isValidPayload(
    req.body,
    commandModel.createAdParamType
  );
  if (payload.err) return sendResponse(payload, res);
  return sendResponse(
    await commandHandler.addAd(payload.data),
    res,
    SUCCESS.CREATED
  );
};

const updateAd = async (req, res) => {
  const payload = validator.isValidPayload(
    { ...req.body, id: req.params.id },
    commandModel.updateAdParamType
  );
  if (payload.err) return sendResponse(payload, res);
  return sendResponse(await commandHandler.updateAd(payload.data), res);
};

const deleteAd = async (req, res) => {
  const payload = validator.isValidPayload(
    req.params,
    commandModel.deleteAdParamType
  );
  if (payload.err) return sendResponse(payload, res);
  return sendResponse(await commandHandler.deleteAd(payload.data), res);
};

const trackClick = async (req, res) => {
  const payload = validator.isValidPayload(
    req.params,
    commandModel.trackAdParamType
  );
  if (payload.err) return sendResponse(payload, res);
  return sendResponse(await commandHandler.trackClick(payload.data), res);
};

const trackImpression = async (req, res) => {
  const payload = validator.isValidPayload(
    req.params,
    commandModel.trackAdParamType
  );
  if (payload.err) return sendResponse(payload, res);
  return sendResponse(await commandHandler.trackImpression(payload.data), res);
};

module.exports = {
  listAds,
  getAd,
  listActiveByPlacement,
  addAd,
  updateAd,
  deleteAd,
  trackClick,
  trackImpression,
};
