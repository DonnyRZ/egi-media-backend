const CommonError = require("./common_error");

class ServiceUnavailableError extends CommonError {
  constructor(message) {
    super(message || "Service Unavailable");
    this.name = "ServiceUnavailableError";
  }
}

module.exports = ServiceUnavailableError;
