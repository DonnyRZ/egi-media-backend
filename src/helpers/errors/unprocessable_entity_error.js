const CommonError = require("./common_error");

class UnprocessableEntityError extends CommonError {
  constructor(message) {
    super(message || "Unprocessable Entity");
  }
}

module.exports = UnprocessableEntityError;
