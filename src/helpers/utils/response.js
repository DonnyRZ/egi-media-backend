// Used to send response to client on api handler
const wrapper = require("./wrapper");

const sendResponse = async (result, res, code = 200) => {
  return result.err ? wrapper.response(res, "fail", result) : wrapper.response(res, "success", result, "Your Request Has Been Processed", code);
};

const paginationResponse = async (result, res) => {
  return result.err ? wrapper.response(res, "fail", result) : wrapper.paginationResponse(res, "success", result, "Your Request Has Been Processed");
};

const exportFileResponse = async (result, res) => {
  return result.err ? wrapper.response(res, "fail", result) : wrapper.exportFileResponse(res, "success", result, "Your Request Has Been Processed");
};

module.exports = {
  sendResponse,
  paginationResponse,
  exportFileResponse,
};
