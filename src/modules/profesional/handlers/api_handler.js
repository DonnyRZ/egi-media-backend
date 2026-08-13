const commandHandler = require("../repositories/commands/command_handler");
const commandModel = require("../repositories/commands/command_model");
const validator = require("../../../helpers/utils/validator");
const wrapper = require("../../../helpers/utils/wrapper");
const { sendResponse } = require("../../../helpers/utils/response");
const { SUCCESS } = require("../../../helpers/http-status/status_code");
const { TooManyRequestsError } = require("../../../helpers/errors");
const { clientIp, consumeRateLimit } = require("../rate-limit");

const createDemoRequest = async (req, res) => {
  if (!consumeRateLimit(clientIp(req))) {
    return sendResponse(
      wrapper.error(new TooManyRequestsError("Too many requests")),
      res,
    );
  }

  const payload = validator.isValidPayload(
    req.body,
    commandModel.createDemoRequestParamType,
  );
  if (payload.err) return sendResponse(payload, res);
  if (payload.data.website) return res.status(204).end();

  return sendResponse(
    await commandHandler.submitDemoRequest(payload.data),
    res,
    SUCCESS.CREATED,
  );
};

module.exports = {
  createDemoRequest,
};
