const profesionalHandler = require("../modules/profesional/handlers/api_handler");

module.exports = (server) => {
  server.post(
    "/api/v1/profesional/demo-requests",
    profesionalHandler.createDemoRequest,
  );
};
